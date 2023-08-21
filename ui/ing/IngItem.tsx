import React, { Component } from 'react'
import { Ing, IngComment, IngSendFromType } from '@/model/ing'
import { IngItemState } from '@/model/ing-view'
import { take } from 'lodash-es'
import { ActivityItem, IPersonaProps, Link, Text } from '@fluentui/react'
import { format, formatDistanceStrict } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { getVsCodeApiSingleton } from 'share/vscode-api'
import { IngWebviewHostCmd, Webview } from '@/model/webview-cmd'

interface IngItemProps {
    ing: Ing
    comments?: IngComment[]
}

export class IngItem extends Component<IngItemProps, IngItemState> {
    readonly icons = {
        vscodeLogo: (
            <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="14" height="14">
                <path
                    d="M746.222933 102.239573l-359.799466 330.820267L185.347413 281.4976 102.2464 329.864533l198.20544 182.132054-198.20544 182.132053 83.101013 48.510293 201.076054-151.558826 359.799466 330.676906 175.527254-85.251413V187.4944z m0 217.57952v384.341334l-255.040853-192.177494z"
                    fill="#2196F3"
                ></path>
            </svg>
        ),
        mobile: (
            <svg
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                fill="currentColor"
            >
                <path
                    d="M700.8 976H307.2c-36.8 0-67.2-30.4-67.2-67.2V147.2C240 110.4 270.4 80 307.2 80h393.6C737.6 80 768 110.4 768 147.2v761.6c0 36.8-30.4 67.2-67.2 67.2zM307.2 112C288 112 272 128 272 147.2v761.6c0 19.2 16 35.2 35.2 35.2h393.6c19.2 0 35.2-16 35.2-35.2V147.2C736 128 720 112 700.8 112H307.2z"
                    fill=""
                ></path>
                <path
                    d="M752 240H272c-9.6 0-16-6.4-16-16s6.4-16 16-16h480c9.6 0 16 6.4 16 16s-6.4 16-16 16zM752 848H272c-9.6 0-16-6.4-16-16s6.4-16 16-16h480c9.6 0 16 6.4 16 16s-6.4 16-16 16zM544 912h-64c-9.6 0-16-6.4-16-16s6.4-16 16-16h64c9.6 0 16 6.4 16 16s-6.4 16-16 16zM480 144h128v32h-128zM416 144h32v32h-32z"
                    fill=""
                ></path>
            </svg>
        ),
    } as const

    constructor(props: IngItemProps) {
        super(props)
        this.state = {}
    }

    private get persons() {
        return take([this.props.ing.userIconUrl, ...(this.state.comments?.map((x: Ing) => x.userIconUrl) ?? [])], 5)
    }

    render() {
        const {
            ing: { id, content, userDisplayName, dateAdded, icons, sendFrom },
            comments,
        } = this.props
        const { persons } = this
        console.debug(comments)
        /* eslint-disable-next-line @typescript-eslint/naming-convention */
        return (
            <div>
                <div>
                    <ActivityItem
                        key={id}
                        activityPersonas={persons.map<IPersonaProps>(imageUrl => ({ imageUrl }))}
                        comments={[
                            // eslint-disable-next-line @typescript-eslint/naming-convention
                            <div dangerouslySetInnerHTML={{ __html: content }}></div>,
                            icons !== '' ? (
                                <span /* eslint-disable-next-line @typescript-eslint/naming-convention */
                                    dangerouslySetInnerHTML={{ __html: icons }}
                                    className="ml-[5px] inline-flex items-center scale-[85] ing-content__icons"
                                />
                            ) : (
                                <></>
                            ),
                        ]}
                        activityDescription={[
                            <Link key={1}>{userDisplayName}</Link>,
                            <Link
                                key={2}
                                onClick={() =>
                                    this.comment({
                                        ingId: id,
                                        ingContent: content,
                                    })
                                }
                            >
                                &nbsp;&nbsp;回应&nbsp;
                            </Link>,
                        ]}
                        timeStamp={[
                            <span title={format(dateAdded, 'yyyy-MM-dd HH:mm')}>
                                {formatDistanceStrict(dateAdded, new Date(), {
                                    locale: zhCN,
                                    addSuffix: true,
                                })}
                            </span>,
                            (sendFrom as number) > 0 ? (
                                <span className="ml-[3px] inline-flex items-center">
                                    {this.renderSendFromIcon(sendFrom)}
                                </span>
                            ) : (
                                <></>
                            ),
                        ]}
                        styles={{
                            timeStamp: {
                                fontFamily: 'inherit',
                                lineHeight: 16,
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: 'inherit',
                            },
                            activityText: {
                                color: 'inherit',
                                fontFamily: 'inherit',
                                lineHeight: '1.5',
                                minHeight: 16,
                            },
                            commentText: {
                                color: 'inherit',
                                fontFamily: 'inherit',
                                lineHeight: '1.5',
                                display: 'flex',
                                alignItems: 'center',
                                minHeight: 16,
                            },
                            root: {
                                color: 'inherit',
                                fontFamily: 'inherit',
                            },
                        }}
                    />
                </div>
                {comments !== undefined ? (
                    <div className="pl-[40px] text-[12px]">{comments.map(this.renderComment)}</div>
                ) : (
                    <></>
                )}
            </div>
        )
    }

    private renderComment = (
        { userDisplayName, content, dateAdded, statusId, userId, id }: IngComment,
        index: number
    ) => (
        <div className={`${index > 0 ? 'mt-[3px]' : ''} leading-[1.5]`}>
            <div className="inline">
                <span className="whitespace-nowrap">
                    <Link>{userDisplayName}</Link>&nbsp;:&nbsp;
                </span>
                {/* eslint-disable-next-line @typescript-eslint/naming-convention */}
                <div className="ing-comment__content inline" dangerouslySetInnerHTML={{ __html: content }}></div>
            </div>
            <Text
                nowrap={true}
                styles={{
                    root: {
                        fontSize: 'inherit',
                        color: 'var(--vscode-disabledForeground)',
                    },
                }}
                title={format(dateAdded, 'yyyy-MM-dd HH:mm')}
            >
                &nbsp;&nbsp;
                {formatDistanceStrict(dateAdded, new Date(), {
                    locale: zhCN,
                    addSuffix: true,
                })}
                <Link
                    onClick={() =>
                        this.comment({
                            ingId: statusId,
                            ingContent: content,
                            atUser: {
                                id: userId,
                                displayName: userDisplayName,
                            },
                            parentCommentId: id,
                        })
                    }
                >
                    &nbsp;回复
                </Link>
            </Text>
        </div>
    )

    private renderSendFromIcon(value: IngSendFromType) {
        if (value === IngSendFromType.code) return this.icons.vscodeLogo
        if (value === IngSendFromType.cellPhone) return this.icons.mobile
    }

    private comment(payload: Webview.Cmd.Ing.CommentCmdPayload) {
        getVsCodeApiSingleton().postMessage({
            command: Webview.Cmd.Ing.Ext.comment,
            payload,
        } as IngWebviewHostCmd<Webview.Cmd.Ing.CommentCmdPayload>)
    }
}
