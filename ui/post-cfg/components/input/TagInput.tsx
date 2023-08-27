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
} from '@fluentui/react'
import React, { Component } from 'react'
import { PostTag } from '../../../../src/wasm'

type Props = {
    tags: PostTag[]
    selectedTagNames: string[]
    onChange: (tagNames: string[]) => void
}

type State = {
    selectedTags: ITag[]
}

export class TagInput extends Component<Props, State> {
    constructor(props: Props) {
        super(props)

        const selectedTags = this.props.selectedTagNames
            .map(name => this.props.tags.find(x => x.name === name))
            .filter(tag => tag !== undefined)
            .map(tag => tag as PostTag)
            .map(tag => ({ name: tag.name, key: tag.id }))

        this.state = {
            selectedTags,
        }
    }

    render() {
        return (
            <Stack>
                <Label>标签</Label>
                <TagPicker
                    itemLimit={10}
                    onResolveSuggestions={(text, selectedItems) =>
                        filterSuggestedTags(this.props.tags, text, selectedItems ?? [])
                    }
                    onRenderSuggestionsItem={tag => {
                        const isNewTag = (tag as NewTag).isNew ?? false
                        const tagEl = (
                            <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
                                <Icon iconName="Tag" />
                                <Text>{tag.name}</Text>
                            </Stack>
                        )
                        const el = isNewTag ? (
                            <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
                                <Text>新建标签:&nbsp;</Text>"{tagEl}"
                            </Stack>
                        ) : (
                            tagEl
                        )
                        return (
                            <ActionButton>
                                <TagItemSuggestion>{el}</TagItemSuggestion>
                            </ActionButton>
                        )
                    }}
                    onRenderItem={props => {
                        const { item: tag } = props
                        return (
                            <TagItem {...props}>
                                <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
                                    <Icon iconName="Tag" />
                                    <Text>{tag.name}</Text>
                                </Stack>
                            </TagItem>
                        )
                    }}
                    getTextFromItem={item => item.name ?? ''}
                    selectedItems={this.state.selectedTags}
                    onChange={tags => {
                        if (tags !== undefined) {
                            this.props.onChange(tags.map(t => t.name))
                            this.setState({ selectedTags: tags })
                        }
                    }}
                    onEmptyResolveSuggestions={items => filterSuggestedTags(this.props.tags, '', items ?? [])}
                    inputProps={{ placeholder: '点击选择' }}
                    onValidateInput={input => (input.length <= 50 ? ValidationState.valid : ValidationState.invalid)}
                    onInputChange={value => (value.length <= 50 ? value : value.substring(0, 49))}
                />
            </Stack>
        )
    }
}

type NewTag = {
    name: string
    key: string | number
    isNew?: boolean
}

function filterSuggestedTags(tags: PostTag[], filterText: string, selectedTags: ITag[]) {
    filterText = filterText.trim()

    const filteredTags = tags
        .filter(
            tag =>
                (filterText === '' || tag.name.indexOf(filterText) >= 0) &&
                selectedTags.findIndex(st => st.name === tag.name) < 0
        )
        .map(x => ({ name: x.name, key: x.id }) as ITag)

    if (filteredTags.length <= 0 || tags.findIndex(t => t.name.toLowerCase() === filterText.toLowerCase()) < 0)
        filteredTags.push({ name: filterText, key: filterText, isNew: true } as NewTag)

    return filteredTags
}
