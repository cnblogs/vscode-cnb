import { parseISO } from 'date-fns';
import { camelCase, mapKeys } from 'lodash-es';

export class Ing {
    id = -1;
    content = '';
    isPrivate = false;
    icons = '';
    userAlias = '';
    userDisplayName = '';
    commentCount = '';
    userId = -1;
    userGuid = '';
    private _dateAdded: Date | string = new Date();
    private _userIconUrl = '';

    get dateAdded(): Date {
        return (this._dateAdded = typeof this._dateAdded === 'string' ? parseISO(this._dateAdded) : this._dateAdded);
    }

    set dateAdded(value: Date) {
        this._dateAdded = value;
    }

    get userIconUrl(): string {
        return (this._userIconUrl = this._userIconUrl.startsWith('//')
            ? `https:${this._userIconUrl}`
            : this._userIconUrl);
    }

    set userIconUrl(value: string) {
        this._userIconUrl = value;
    }

    static parse(this: void, value: unknown): Ing {
        return Object.assign(new Ing(), typeof value === 'object' ? mapKeys(value, (_, k) => camelCase(k)) : {});
    }
}

export enum IngType {
    following = 1,
    my = 4,
    all = 5,
    mycomment = 7,
    comment = 13,
    mention = 14,
}

export const IngTypesMetadata = [
    [IngType.all, { displayName: '全站', description: '全站闪存' }],
    [IngType.my, { displayName: '我的', description: '我的闪存' }],
    [IngType.following, { displayName: '关注的人', description: '关注的人的闪存' }],
] as const;

export type IngPublishModel = Pick<Ing, 'content' | 'isPrivate'>;