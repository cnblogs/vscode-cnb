import React from 'react';
import { SiteHomeContributionOptions as ISiteHomeContributionOptions } from '../models/site-home-contribution-options';
import { Text } from '@fluentui/react/lib/Text';
import { Stack } from '@fluentui/react/lib/Stack';
import { ActionButton, Checkbox, Label } from '@fluentui/react';

export interface ISiteHomeContributionOptionsSelectorProps extends ISiteHomeContributionOptions {
    onInSiteHomeChange: (value: boolean) => void;
    onInSiteCandidateChange: (value: boolean) => void;
}

export interface ISiteHomeContributionOptionsSelector {
    isCollapse: boolean;
}

export class SiteHomeContributionOptionsSelector extends React.Component<
    ISiteHomeContributionOptionsSelectorProps,
    ISiteHomeContributionOptionsSelector
> {
    onChange: ((options: ISiteHomeContributionOptions) => void) | null = null;

    constructor(props: ISiteHomeContributionOptionsSelectorProps) {
        super(props);
        this.state = { isCollapse: true };
    }

    public render() {
        return (
            <Stack tokens={{ childrenGap: 16 }}>
                <Stack>
                    <ActionButton
                        onClick={() => this.setState({ isCollapse: !this.state.isCollapse })}
                        styles={{ root: { height: 'auto', paddingLeft: 0 } }}
                    >
                        <Label styles={{ root: { paddingBottom: 0, paddingTop: 0 } }}>投稿至首页</Label>
                        <ActionButton
                            iconProps={{ iconName: this.state.isCollapse ? 'CirclePlus' : 'SkypeCircleMinus' }}
                            styles={{ root: { height: 'auto' } }}
                        />
                    </ActionButton>
                </Stack>
                {this.state.isCollapse ? (
                    <></>
                ) : (
                    <Stack tokens={{ childrenGap: 8, padding: ' 0 0 0 8px' }}>
                        <Checkbox
                            label='投稿至首页候选区'
                            onChange={(_, checked) => this.props.onInSiteCandidateChange?.apply(this, [checked])}
                            checked={this.props.inSiteCandidate}
                        />
                        <Checkbox
                            label='投稿至博客园首页（原创、精品、知识分享）'
                            onChange={(_, checked) => this.props.onInSiteHomeChange?.apply(this, [checked])}
                            checked={this.props.inSiteHome}
                        />
                        <Text variant='medium' nowrap block>
                            【投稿说明】
                        </Text>
                        <Text variant='medium' block>
                            博客园是面向开发者的知识分享社区，不允许发布任何推广、广告、政治方面的内容。
                        </Text>
                        <Text variant='medium' block>
                            博客园首页（即网站首页）只能发布原创的、高质量的、能让读者从中学到东西的内容。
                        </Text>
                        <Text variant='medium' block>
                            如果博文质量不符合首页要求，会被工作人员移出首页，望理解。如有疑问，请联系contact@cnblogs.com。
                        </Text>
                    </Stack>
                )}
            </Stack>
        );
    }
}
