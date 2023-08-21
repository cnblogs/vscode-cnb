import { DefaultButton, PrimaryButton } from '@fluentui/react/lib/Button'
import { Stack } from '@fluentui/react/lib/Stack'
import React, { Component } from 'react'
import { PostCfg } from '@/model/post-cfg'
import { Label, Spinner } from '@fluentui/react'
import { OptionCheckBox } from './OptionCheckBox'
import { getVsCodeApiSingleton } from '../../share/vscode-api'
import { Webview } from '@/model/webview-cmd'
import { WebviewMsg } from '@/model/webview-msg'
import { Post } from '@/model/post'
import TitleInput from './input/TitleInput'
import { TagInput } from './input/TagInput'
import NestedCatSelect from './select/NestedCatSelect'
import { CatSelect } from './select/CatSelect'
import { PwdInput } from './input/PwdInput'
import { SummaryInput } from './input/SummaryInput'
import { SiteHomeContributionOptionSelect } from './select/SiteHomeContributionOptionSelect'
import UrlSlugInput from './input/UrlSlugInput'
import { PermissionSelect } from './select/PermissionSelect'
import { SiteCatSelect } from './select/SiteCatSelect'

type Props = {
    post: Post
    fileName?: string
    useNestCategoriesSelect: boolean
    onConfirm: (postCfg: PostCfg) => void
    onTitleChange: (title: string) => void
}

export class PostForm extends Component<Props> {
    constructor(props: Props) {
        super(props)
    }

    render() {
        const inForm = (
            <>
                <TitleInput
                    value={this.props.post.title ?? ''}
                    fileName={this.props.fileName ?? ''}
                    onChange={v => {
                        this.setState({ title: v ?? '' })
                        this.props.onTitleChange?.(v ?? '')
                    }}
                ></TitleInput>
                <TagInput selectedTagNames={this.props.post.tags ?? []} onChange={tags => this.setState({ tags })} />
                <Stack tokens={{ childrenGap: 8 }}>
                    <Label>分类</Label>
                    <Stack>
                        {this.props.useNestCategoriesSelect ? (
                            <NestedCatSelect
                                onSelect={categoryIds => this.setState({ categoryIds })}
                                selected={this.props.post.categoryIds ?? []}
                            ></NestedCatSelect>
                        ) : (
                            <CatSelect
                                onChange={categoryIds => this.setState({ categoryIds })}
                                categoryIds={this.props.post.categoryIds ?? []}
                            />
                        )}
                    </Stack>
                </Stack>
                <PermissionSelect
                    accessPermission={this.props.post.accessPermission}
                    onChange={value => {
                        this.setState({ accessPermission: value })
                    }}
                />
                <PwdInput
                    onChange={value => this.setState({ password: value })}
                    password={this.props.post.password ?? ''}
                />
                <SummaryInput
                    summary={this.props.post.description}
                    featureImgUrl={this.props.post.featuredImage ?? ''}
                    onChange={summary => this.setState({ description: summary })}
                    onFeatureImageChange={imageUrl => this.setState({ featuredImage: imageUrl })}
                />
                <SiteHomeContributionOptionSelect
                    onInSiteCandidateChange={v =>
                        this.setState({ inSiteCandidate: v, inSiteHome: v ? false : this.props.post.inSiteHome })
                    }
                    onInSiteHomeChange={v =>
                        this.setState({
                            inSiteHome: v,
                            inSiteCandidate: v ? false : this.props.post.inSiteCandidate,
                        })
                    }
                    inSiteCandidate={this.props.post.inSiteCandidate}
                    inSiteHome={this.props.post.inSiteHome}
                />
                <SiteCatSelect
                    categoryIds={this.props.post.siteCategoryId !== undefined ? [this.props.post.siteCategoryId] : []}
                    onChange={categoryId => this.setState({ siteCategoryId: categoryId })}
                />
                <UrlSlugInput
                    entryName={this.props.post.entryName}
                    onChange={value => this.setState({ entryName: value })}
                />
                <OptionCheckBox
                    options={{
                        isPublished: { label: '发布', checked: this.props.post.isPublished },
                        displayOnHomePage: {
                            label: '博客主页显示',
                            checked: this.props.post.displayOnHomePage,
                        },
                        isAllowComments: {
                            label: '允许评论',
                            checked: this.props.post.isAllowComments,
                        },
                        isPinned: {
                            label: '置顶',
                            checked: this.props.post.isPinned,
                        },
                    }}
                    onChange={(_, __, stateObj) => this.setState(stateObj)}
                />
                <Stack horizontal tokens={{ childrenGap: 8 }}>
                    <PrimaryButton text="确定" onClick={() => this.confirm()} allowDisabledFocus />
                    <DefaultButton text="取消" onClick={() => this.cancel()} />
                    {status === 'submitting' ? <Spinner label="正在提交" labelPosition="right" /> : <></>}
                </Stack>
            </>
        )
        return <form>{inForm}</form>
    }

    private confirm() {
        getVsCodeApiSingleton().postMessage({
            command: Webview.Cmd.Ext.uploadPost,
            post: this.props.post,
        } as WebviewMsg.UploadPostMsg)
    }

    private cancel() {
        getVsCodeApiSingleton().postMessage({ command: Webview.Cmd.Ext.disposePanel } as WebviewMsg.Msg)
    }
}
