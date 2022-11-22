import React, { Component } from 'react';
import { Ing } from '@models/ing';
import { IngItemState } from '@models/ing-view';
import { take } from 'lodash-es';
import { ActivityItem, IPersonaProps, Link, Text } from '@fluentui/react';
import { formatDistanceStrict } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface IngItemProps {
    ing: Ing;
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
        } = this.props;
        const { comments } = this.state;
        const { persons } = this;
        console.debug(id);
        return (
            <div>
                <div>
                    <ActivityItem
                        key={id}
                        activityPersonas={persons.map<IPersonaProps>(imageUrl => ({ imageUrl }))}
                        comments={content}
                        activityDescription={[<Link key={1}>{userDisplayName}</Link>]}
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
                {comments ? <div className="mr-16px">{comments.map(this.renderComment)}</div> : <></>}
            </div>
        );
    }

    private renderComment = ({ userDisplayName, content }: Ing) => (
        <div>
            <Link>{userDisplayName}</Link>
            <Text>:&nbsp;{content}</Text>
        </div>
    );
}

export { IngItem };
