export class Ing {
    id = -1;
    content = '';
    isPrivate = false;
    icons = '';
    userAlias = '';
    userDisplayName = '';
    userIconUrl = '';
    commentCount = '';
    userId = -1;
    userGuid = '';

    static parse(this: void, value: unknown): Ing {
        return Object.assign(new Ing(), typeof value === 'object' ? value : {});
    }
}

export enum IngType {
    following = 1,
    mu = 4,
    all = 5,
    mycomment = 7,
    comment = 13,
    mention = 14,
}

export type IngPublishModel = Pick<Ing, 'content' | 'isPrivate'>;
