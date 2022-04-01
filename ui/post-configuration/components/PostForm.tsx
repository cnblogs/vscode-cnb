import { DefaultButton, PrimaryButton } from '@fluentui/react/lib/Button';
import { Stack } from '@fluentui/react/lib/Stack';
import React from 'react';
import { CategoriesSelector } from './CategoriesSelector';
import { SiteHomeContributionOptionsSelector } from './SiteHomeContributionOptionsSelector';
import { PostConfiguration } from '@models/post-configuration';
import { Post } from '@models/post';
import { Label, Spinner } from '@fluentui/react';
import { SiteCategoriesSelector } from './SiteCategoriesSelector';
import { TagsInput } from './TagsInput';
import { CommonOptions } from './CommonOptions';
import { AccessPermissionSelector } from './AccessPermissionSelector';
import { PasswordInput } from './PasswordInput';
import { vsCodeApi } from '../../share/vscode-api';
import { ErrorResponse } from './ErrorResponse';
import { webviewCommand } from '@models/webview-command';
import { webviewMessage } from '@models/webview-message';
import { InputSummary } from './InputSummary';
import { IPostFormContext, PostFormContext } from './PostFormContext';

export interface IPostFormProps {
    post?: Post;
    onConfirm?: (postConfiguration: PostConfiguration) => void;
}

export interface IPostFormState extends PostConfiguration {}

export class PostForm extends React.Component<IPostFormProps, IPostFormState> {
    static contextType?: React.Context<IPostFormContext> | undefined = PostFormContext;
    constructor(props: IPostFormProps) {
        super(props);
        this.state = {};
        Object.assign(this.state, props.post);
    }

    private onConfirm() {
        this.context.set({ disabled: true, status: 'submitting' });
        vsCodeApi.getInstance().postMessage({
            command: webviewCommand.ExtensionCommands.savePost,
            post: Object.assign({}, this.props.post, this.state),
        } as webviewMessage.SavePostMessage);
    }

    private onCancel() {
        vsCodeApi
            .getInstance()
            .postMessage({ command: webviewCommand.ExtensionCommands.disposePanel } as webviewMessage.Message);
    }

    public render() {
        if (!this.props.post) {
            return <></>;
        }
        const { disabled, status } = this.context as IPostFormContext;
        return (
            <form>
                <Stack tokens={{ childrenGap: 16 }}>
                    <Stack tokens={{ childrenGap: 8 }}>
                        <Label>个人分类</Label>
                        <Stack>
                            <CategoriesSelector
                                onChange={categoryIds => {
                                    this.setState({ categoryIds: categoryIds });
                                }}
                                categoryIds={this.state.categoryIds ?? []}
                            />
                        </Stack>
                    </Stack>
                    <TagsInput selectedTagNames={this.state.tags} onChange={tags => this.setState({ tags })} />
                    <AccessPermissionSelector
                        accessPermission={this.state.accessPermission}
                        onChange={value => {
                            this.setState({ accessPermission: value });
                        }}
                    />
                    <CommonOptions
                        options={{
                            isPublished: { label: '发布', checked: this.state.isPublished! },
                            displayOnHomePage: {
                                label: '显示在我的博客首页',
                                checked: this.state.displayOnHomePage!,
                            },
                            isAllowComments: {
                                label: '允许评论',
                                checked: this.state.isAllowComments!,
                            },
                            isPinned: {
                                label: '置顶',
                                checked: this.state.isPinned!,
                            },
                        }}
                        onChange={(key, checked) => {
                            const obj = {} as any;
                            obj[key] = checked;
                            this.setState(obj);
                        }}
                    />
                    <PasswordInput
                        onChange={value => this.setState({ password: value })}
                        password={this.state.password}
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
                        inSiteCandidate={this.state.inSiteCandidate!}
                        inSiteHome={this.state.inSiteHome!}
                    />
                    <SiteCategoriesSelector
                        categoryIds={this.state.siteCategoryId ? [this.state.siteCategoryId] : []}
                        onChange={categoryId => this.setState({ siteCategoryId: categoryId })}
                    />
                    <ErrorResponse />
                    <Stack horizontal tokens={{ childrenGap: 8 }}>
                        <PrimaryButton
                            text='确定'
                            disabled={disabled}
                            onClick={() => this.onConfirm()}
                            allowDisabledFocus
                        />
                        <DefaultButton disabled={disabled} text='取消' onClick={() => this.onCancel()} />
                        {status === 'submitting' ? <Spinner label='正在提交' labelPosition='right' /> : <></>}
                    </Stack>
                </Stack>
            </form>
        );
    }
}