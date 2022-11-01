import {
    ActionButton,
    Icon,
    ITag,
    Label,
    Stack,
    TagItem,
    TagItemSuggestion,
    TagPicker,
    ValidationState,
    Text,
} from '@fluentui/react';
import React from 'react';
import { tagsStore } from '../services/tags-store';
import { PostTags, PostTag } from '@models/post-tag';

export interface ITagsInputProps {
    selectedTagNames?: string[];
    onChange?: (tagNames: string[]) => void;
}

export interface ITagsInputState {
    tags: PostTags;
    selectedTags: ITag[];
}

export interface INewTag extends ITag {
    readonly isNew: boolean;
}

export class TagsInput extends React.Component<ITagsInputProps, ITagsInputState> {
    constructor(props: ITagsInputProps) {
        super(props);

        const tags = tagsStore.get();
        this.state = {
            tags,
            selectedTags:
                this.props.selectedTagNames
                    ?.map(name => tags.find(x => x.name === name))
                    .filter(t => t)
                    .map(this.toITag) ?? [],
        };
    }

    render() {
        return this.state ? (
            <Stack tokens={{ childrenGap: 8 }}>
                <Label>Tag标签</Label>
                <Stack>
                    <TagPicker
                        removeButtonAriaLabel="Remove"
                        selectionAriaLabel="Selected tags"
                        itemLimit={10}
                        onResolveSuggestions={(text, selectedItems) => this.filterSuggestedTags(text, selectedItems)}
                        pickerSuggestionsProps={{
                            suggestionsHeaderText: '选择标签',
                            loadingText: '加载中',
                        }}
                        onRenderSuggestionsItem={tag => {
                            const isNewTag = (tag as INewTag).isNew === true;
                            const tagEl = (
                                <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
                                    <Icon iconName="Tag" />
                                    <Text>{tag.name}</Text>
                                </Stack>
                            );
                            const el = isNewTag ? (
                                <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
                                    <Text>新建标签:&nbsp;</Text>"{tagEl}"
                                </Stack>
                            ) : (
                                tagEl
                            );
                            return (
                                <ActionButton>
                                    <TagItemSuggestion>{el}</TagItemSuggestion>
                                </ActionButton>
                            );
                        }}
                        onRenderItem={props => {
                            const { item: tag } = props;
                            return (
                                <TagItem {...props}>
                                    <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
                                        <Icon iconName="Tag" />
                                        <Text>{tag.name}</Text>
                                    </Stack>
                                </TagItem>
                            );
                        }}
                        getTextFromItem={item => item.name ?? ''}
                        selectedItems={this.state.selectedTags}
                        onChange={tags => {
                            tags ??= [];
                            tags = tags.filter(x => x);
                            this.props.onChange?.apply(this, [tags.map(t => t.name)]);
                            this.setState({ selectedTags: tags });
                        }}
                        onEmptyResolveSuggestions={items => this.filterSuggestedTags('', items)}
                        inputProps={{ placeholder: '点击选择标签' }}
                        onValidateInput={input =>
                            input?.length <= 50 ? ValidationState.valid : ValidationState.invalid
                        }
                        onInputChange={value => (value.length <= 50 ? value : value.substring(0, 49))}
                    />
                </Stack>
            </Stack>
        ) : (
            <></>
        );
    }

    private toITag(this: void, tag: PostTag): ITag {
        return { name: tag.name, key: tag.id };
    }

    private filterSuggestedTags(filterText: string, selectedTags?: ITag[]): ITag[] {
        filterText = filterText?.trim() ?? '';
        const { tags } = this.state;
        const filteredTags = tags
            .filter(
                tag =>
                    (!filterText || tag.name.indexOf(filterText) >= 0) &&
                    (!selectedTags || selectedTags.findIndex(st => st.name === tag.name) < 0)
            )
            .map(x => ({ name: x.name, key: x.id } as ITag));
        if (filteredTags.length <= 0 || tags.findIndex(t => t.name.toLowerCase() === filterText.toLowerCase()) < 0)
            filteredTags.push({ name: filterText, key: filterText, isNew: true } as INewTag);

        return filteredTags;
    }
}
