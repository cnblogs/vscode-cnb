import { DefaultButton, PrimaryButton } from '@fluentui/react/lib/Button'
import { Stack } from '@fluentui/react/lib/Stack'
import React, { Component } from 'react'
import { OptionCheckBox } from './OptionCheckBox'
import { getVsCodeApiSingleton } from '../../share/vscode-api'
import { Webview } from '@/model/webview-cmd'
import { WebviewMsg } from '@/model/webview-msg'
import { Post } from '@/model/post'
import TitleInput from './input/TitleInput'
import { TagInput } from './input/TagInput'
import { CatSelect } from './select/CatSelect'
import { PwdInput } from './input/PwdInput'
import { SummaryInput } from './input/SummaryInput'
import { SiteHomeContributionOptionSelect } from './select/SiteHomeContributionOptionSelect'
import UrlSlugInput from './input/UrlSlugInput'
import { PermissionSelect } from './select/PermissionSelect'
import { SiteCatSelect } from './select/SiteCatSelect'
import { SiteCat } from '@/model/site-category'
import { PostCat } from '@/model/post-cat'
import { PostTag } from '@/wasm'

type Props = {
    post: Post
    fileName?: string
    onTitleChange: (title: string) => void
    userCats: PostCat[]
    siteCats: SiteCat[]
    tags: PostTag[]
}
type State = Post

export class PostForm extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = this.props.post
    }

    render() {
        const props = this.props
        const state = this.state

        return (
            <Stack tokens={{ childrenGap: 10 }}>
                <TitleInput
                    value={state.title}
                    fileName={props.fileName ?? ''}
                    onChange={v => {
                        this.setState({ title: v ?? '' })
                        this.props.onTitleChange?.(v ?? '')
                    }}
                ></TitleInput>
                <TagInput
                    selectedTagNames={state.tags ?? []}
                    onChange={tags => this.setState({ tags })}
                    tags={this.props.tags}
                />
                <CatSelect
                    userCats={props.userCats}
                    selectedCatIds={state.categoryIds}
                    onChange={categoryIds => this.setState({ categoryIds })}
                />
                <PermissionSelect
                    accessPermission={state.accessPermission}
                    onChange={value => {
                        this.setState({ accessPermission: value })
                    }}
                />
                <PwdInput onChange={value => this.setState({ password: value })} password={state.password ?? ''} />
                <SummaryInput
                    summary={state.description}
                    featureImgUrl={state.featuredImage ?? ''}
                    onChange={summary => this.setState({ description: summary })}
                    onFeatureImageChange={imageUrl => this.setState({ featuredImage: imageUrl })}
                />
                <SiteHomeContributionOptionSelect
                    onInSiteCandidateChange={v =>
                        this.setState({ inSiteCandidate: v, inSiteHome: v ? false : state.inSiteHome })
                    }
                    onInSiteHomeChange={v =>
                        this.setState({
                            inSiteHome: v,
                            inSiteCandidate: v ? false : state.inSiteCandidate,
                        })
                    }
                    inSiteCandidate={state.inSiteCandidate}
                    inSiteHome={state.inSiteHome}
                />
                <SiteCatSelect
                    catIds={state.siteCategoryId !== undefined ? [state.siteCategoryId] : []}
                    siteCats={props.siteCats}
                    onChange={categoryId => this.setState({ siteCategoryId: categoryId })}
                />
                <UrlSlugInput entryName={state.entryName} onChange={value => this.setState({ entryName: value })} />
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
                <div style={{ marginTop: 20 }}>
                    <Stack horizontal tokens={{ childrenGap: 8 }}>
                        <Stack.Item grow={1}>
                            <div />
                        </Stack.Item>
                        <PrimaryButton text="确定" onClick={() => this.confirm()} allowDisabledFocus />
                        <DefaultButton text="取消" onClick={() => this.cancel()} />
                    </Stack>
                </div>
            </Stack>
        )
    }

    private confirm() {
        getVsCodeApiSingleton().postMessage({
            command: Webview.Cmd.Ext.uploadPost,
            post: this.state,
        } as WebviewMsg.UploadPostMsg)
    }

    private cancel() {
        getVsCodeApiSingleton().postMessage({ command: Webview.Cmd.Ext.disposePanel } as WebviewMsg.Msg)
    }
}
