import { DefaultButton, PrimaryButton } from '@fluentui/react/lib/Button'
import { Stack } from '@fluentui/react/lib/Stack'
import React from 'react'
import { CategorySelect } from './CategorySelect'
import { SiteHomeContributionOptionsSelector } from './SiteHomeContributionOptionsSelector'
import { PostCfg } from '@/model/post-cfg'
import { Label, Spinner } from '@fluentui/react'
import { SiteCategorySelector } from './SiteCategorySelector'
import { TagsInput } from './TagsInput'
import { CommonOptions } from './CommonOptions'
import { AccessPermissionSelector } from './AccessPermissionSelector'
import { PasswordInput } from './PasswordInput'
import { getVsCodeApiSingleton } from '../../share/vscode-api'
import { ErrorResponse } from './ErrorResponse'
import { Webview } from '@/model/webview-cmd'
import { WebviewMsg } from '@/model/webview-msg'
import { InputSummary } from './InputSummary'
import { IPostFormContext, PostFormContext } from './PostFormContext'
import PostEntryNameInput from './PostEntryNameInput'
import PostTitleInput from 'post-cfg/components/PostTitleInput'
import NestCategorySelect from './NestCategorySelect'
import { Post } from '@/model/post'

export type IPostFormProps = {
    post?: Post
    fileName?: string
    useNestCategoriesSelect: boolean
    onConfirm?: (postCfg: PostCfg) => void
    onTitleChange?: (title: string) => void
}

export interface IPostFormState extends PostCfg {}

export class PostForm extends React.Component<IPostFormProps, IPostFormState> {
    static contextType?: React.Context<IPostFormContext> = PostFormContext
    declare context: React.ContextType<typeof PostFormContext>

    constructor(props: IPostFormProps) {
        super(props)
        this.state = Object.assign({}, props.post ?? new Post())
    }

    render() {
        if (!this.props.post) return <></>

        const { disabled: isDisabled, status } = this.context
        return (
            <form>
                <Stack tokens={{ childrenGap: 16 }}>
                    <PostTitleInput
                        value={this.state.title ?? ''}
                        fileName={this.props.fileName ?? ''}
                        onChange={v => {
                            this.setState({ title: v ?? '' })
                            this.props.onTitleChange?.(v ?? '')
                        }}
                    ></PostTitleInput>
                    <Stack tokens={{ childrenGap: 8 }}>
                        <Label>个人分类</Label>
                        <Stack>
                            {this.props.useNestCategoriesSelect ? (
                                <NestCategorySelect
                                    onSelect={categoryIds => this.setState({ categoryIds })}
                                    selected={this.state.categoryIds ?? []}
                                ></NestCategorySelect>
                            ) : (
                                <CategorySelect
                                    onChange={categoryIds => this.setState({ categoryIds })}
                                    categoryIds={this.state.categoryIds ?? []}
                                />
                            )}
                        </Stack>
                    </Stack>
                    <TagsInput selectedTagNames={this.state.tags} onChange={tags => this.setState({ tags })} />
                    <AccessPermissionSelector
                        accessPermission={this.state.accessPermission}
                        onChange={value => {
                            this.setState({ accessPermission: value })
                        }}
                    />
                    <CommonOptions
                        options={{
                            isPublished: { label: '发布', checked: this.state.isPublished },
                            displayOnHomePage: {
                                label: '显示在我的博客首页',
                                checked: this.state.displayOnHomePage,
                            },
                            isAllowComments: {
                                label: '允许评论',
                                checked: this.state.isAllowComments,
                            },
                            isPinned: {
                                label: '置顶',
                                checked: this.state.isPinned,
                            },
                        }}
                        onChange={(_, __, stateObj) => this.setState(stateObj)}
                    />
                    <PasswordInput
                        onChange={value => this.setState({ password: value })}
                        password={this.state.password ?? ''}
                    />
                    <InputSummary
                        summary={this.state.description}
                        featureImageUrl={this.state.featuredImage}
                        onChange={summary => this.setState({ description: summary })}
                        onFeatureImageChange={imageUrl => this.setState({ featuredImage: imageUrl })}
                    />
                    <SiteHomeContributionOptionsSelector
                        onInSiteCandidateChange={v =>
                            this.setState({ inSiteCandidate: v, inSiteHome: v ? false : this.state.inSiteHome })
                        }
                        onInSiteHomeChange={v =>
                            this.setState({
                                inSiteHome: v,
                                inSiteCandidate: v ? false : this.state.inSiteCandidate,
                            })
                        }
                        inSiteCandidate={this.state.inSiteCandidate}
                        inSiteHome={this.state.inSiteHome}
                    />
                    <SiteCategorySelector
                        categoryIds={this.state.siteCategoryId ? [this.state.siteCategoryId] : []}
                        onChange={categoryId => this.setState({ siteCategoryId: categoryId })}
                    />
                    <PostEntryNameInput
                        entryName={this.state.entryName}
                        onChange={value => this.setState({ entryName: value })}
                    />
                    <ErrorResponse />
                    <Stack horizontal tokens={{ childrenGap: 8 }}>
                        <PrimaryButton
                            text="确定"
                            disabled={isDisabled}
                            onClick={() => this.onConfirm()}
                            allowDisabledFocus
                        />
                        <DefaultButton disabled={isDisabled} text="取消" onClick={() => this.onCancel()} />
                        {status === 'submitting' ? <Spinner label="正在提交" labelPosition="right" /> : <></>}
                    </Stack>
                </Stack>
            </form>
        )
    }

    private onConfirm() {
        this.context.set({ disabled: true, status: 'submitting' })
        getVsCodeApiSingleton().postMessage({
            command: Webview.Cmd.Ext.uploadPost,
            post: Object.assign({}, this.props.post, this.state),
        } as WebviewMsg.UploadPostMsg)
    }

    private onCancel() {
        getVsCodeApiSingleton().postMessage({ command: Webview.Cmd.Ext.disposePanel } as WebviewMsg.Msg)
    }
}
