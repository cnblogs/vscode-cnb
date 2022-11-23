import React, { Component } from 'react';
import { Ing, IngComment } from '@models/ing';
import { IngItemState } from '@models/ing-view';
import { take } from 'lodash-es';
import { ActivityItem, IPersonaProps, Link, Text } from '@fluentui/react';
import { format, formatDistanceStrict } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { vsCodeApi } from 'share/vscode-api';
import { IngWebviewHostCommand, webviewCommands } from '@models/webview-commands';

interface IngItemProps {
    ing: Ing;
    comments?: IngComment[];
}

class IngItem extends Component<IngItemProps, IngItemState> {
    constructor(props: IngItemProps) {
        super(props);
        this.state = {};
    }

    private get persons() {
        return take([this.props.ing.userIconUrl, ...(this.state.comments?.map((x: Ing) => x.userIconUrl) ?? [])], 5);
    }

    render() {
        const {
            ing: { id, content, userDisplayName, dateAdded },
            comments,
        } = this.props;
        const { persons } = this;
        console.debug(comments);
        return (
            <div>
                <div>
                    <ActivityItem
                        key={id}
                        activityPersonas={persons.map<IPersonaProps>(imageUrl => ({ imageUrl }))}
                        comments={content}
                        activityDescription={[
                            <Link key={1}>{userDisplayName}</Link>,
                            <Link key={2} onClick={() => this.comment({ ingId: id, ingContent: content })}>
                                &nbsp;&nbsp;回应&nbsp;
                            </Link>,
                        ]}
                        timeStamp={formatDistanceStrict(dateAdded, new Date(), {
                            locale: zhCN,
                            addSuffix: true,
                        })}
                        styles={{
                            timeStamp: { fontFamily: 'inherit', lineHeight: 16 },
                            activityText: {
                                color: 'inherit',
                                fontFamily: 'inherit',
                                lineHeight: 16,
                            },
                            commentText: {
                                color: 'inherit',
                                fontFamily: 'inherit',
                                lineHeight: 16,
                            },
                            root: {
                                color: 'inherit',
                                fontFamily: 'inherit',
                            },
                        }}
                    />
                </div>
                {comments ? <div className="pl-[40px] text-[12px]">{comments.map(this.renderComment)}</div> : <></>}
            </div>
        );
    }

    private renderComment = ({ userDisplayName, content, dateAdded, statusId, userId, id }: IngComment) => (
        <div>
            <Link>{userDisplayName}</Link>
            <div className="inline-block">
                <span>&nbsp;:&nbsp;</span>
                {/* eslint-disable-next-line @typescript-eslint/naming-convention */}
                <div className="inline-block" dangerouslySetInnerHTML={{ __html: content }}></div>
            </div>
            <Text
                styles={{ root: { fontSize: 'inherit', color: 'var(--vscode-disabledForeground)' } }}
                title={format(dateAdded, 'yyyy-MM-dd HH:mm')}
            >
                &nbsp;&nbsp;{formatDistanceStrict(dateAdded, new Date(), { locale: zhCN, addSuffix: true })}
            </Text>
            <Link
                onClick={() =>
                    this.comment({
                        ingId: statusId,
                        ingContent: content,
                        atUser: { id: userId, displayName: userDisplayName },
                        parentCommentId: id,
                    })
                }
            >
                &nbsp;回复
            </Link>
        </div>
    );

    private comment(payload: webviewCommands.ingCommands.CommentCommandPayload) {
        vsCodeApi.getInstance().postMessage({
            command: webviewCommands.ingCommands.ExtensionCommands.comment,
            payload,
        } as IngWebviewHostCommand<webviewCommands.ingCommands.CommentCommandPayload>);
    }
}

export { IngItem };
