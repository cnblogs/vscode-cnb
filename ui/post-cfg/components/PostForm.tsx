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
    onConfirm?: (postCfg: PostCfg) => void
    onTitleChange?: (title: string) => void
}

type State = PostCfg

export class PostForm extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = props.post
    }

    render() {
        return (
            <form>
                <Stack tokens={{ childrenGap: 16 }}>
                    <TitleInput
                        value={this.state.title ?? ''}
                        fileName={this.props.fileName ?? ''}
                        onChange={v => {
                            this.setState({ title: v ?? '' })
                            this.props.onTitleChange?.(v ?? '')
                        }}
                    ></TitleInput>
                    <TagInput selectedTagNames={this.state.tags ?? []} onChange={tags => this.setState({ tags })} />
                    <Stack tokens={{ childrenGap: 8 }}>
                        <Label>分类</Label>
                        <Stack>
                            {this.props.useNestCategoriesSelect ? (
                                <NestedCatSelect
                                    onSelect={categoryIds => this.setState({ categoryIds })}
                                    selected={this.state.categoryIds ?? []}
                                ></NestedCatSelect>
                            ) : (
                                <CatSelect
                                    onChange={categoryIds => this.setState({ categoryIds })}
                                    categoryIds={this.state.categoryIds ?? []}
                                />
                            )}
                        </Stack>
                    </Stack>
                    <PermissionSelect
                        accessPermission={this.state.accessPermission}
                        onChange={value => {
                            this.setState({ accessPermission: value })
                        }}
                    />
                    <PwdInput
                        onChange={value => this.setState({ password: value })}
                        password={this.state.password ?? ''}
                    />
                    <SummaryInput
                        summary={this.state.description}
                        featureImgUrl={this.state.featuredImage ?? ''}
                        onChange={summary => this.setState({ description: summary })}
                        onFeatureImageChange={imageUrl => this.setState({ featuredImage: imageUrl })}
                    />
                    <SiteHomeContributionOptionSelect
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
                    <SiteCatSelect
                        categoryIds={this.state.siteCategoryId !== undefined ? [this.state.siteCategoryId] : []}
                        onChange={categoryId => this.setState({ siteCategoryId: categoryId })}
                    />
                    <UrlSlugInput
                        entryName={this.state.entryName}
                        onChange={value => this.setState({ entryName: value })}
                    />
                    <OptionCheckBox
                        options={{
                            isPublished: { label: '发布', checked: this.state.isPublished },
                            displayOnHomePage: {
                                label: '博客主页显示',
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
                    <Stack horizontal tokens={{ childrenGap: 8 }}>
                        <PrimaryButton text="确定" onClick={() => this.confirm()} allowDisabledFocus />
                        <DefaultButton text="取消" onClick={() => this.cancel()} />
                        {status === 'submitting' ? <Spinner label="正在提交" labelPosition="right" /> : <></>}
                    </Stack>
                </Stack>
            </form>
        )
    }

    private confirm() {
        getVsCodeApiSingleton().postMessage({
            command: Webview.Cmd.Ext.uploadPost,
            post: Object.assign({}, this.props.post, this.state),
        } as WebviewMsg.UploadPostMsg)
    }

    private cancel() {
        getVsCodeApiSingleton().postMessage({ command: Webview.Cmd.Ext.disposePanel } as WebviewMsg.Msg)
    }
}
