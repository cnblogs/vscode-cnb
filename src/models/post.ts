import { parseISO } from 'date-fns';

export class Post {
    id: number = -1;
    author: string = '';
    autoDesc: string = '';
    blogId: number = -1;
    blogTeamIds: number[] = [];
    canChangeCreatedTime: boolean = false;
    categoryIds: number[] | null = [];
    changeCreatedTime: boolean = false;
    changePostType: boolean = false;
    private _datePublished?: Date | undefined;
    get datePublished(): Date | undefined {
        return this._datePublished;
    }
    set datePublished(value: Date | string | undefined) {
        this._datePublished = typeof value === 'string' ? parseISO(value) : value;
    }
    private _dateUpdated?: Date | undefined;
    get dateUpdated(): Date | undefined {
        return this._dateUpdated;
    }
    set dateUpdated(value: Date | string | undefined) {
        this._dateUpdated = typeof value === 'string' ? parseISO(value) : value;
    }
    description: string = '';
    featuredImage: string = '';
    displayOnHomePage: boolean = false;
    entryName: string = '';
    inSiteCandidate: boolean = false;
    inSiteHome: boolean = false;
    includeInMainSyndication: boolean = false;
    ip: string = '';
    isAllowComments: boolean = true;
    isDraft: boolean = true;
    isMarkdown: boolean = true;
    isOnlyForRegisterUser: boolean = false;
    isPinned: boolean = false;
    isPublished: boolean = false;
    isUpdateDateAdded: boolean = false;
    password: string = '';
    postBody: string = '';
    postType: PostType = PostType.blogPost;
    accessPermission: AccessPermission = 0;
    removeScript: boolean = true;
    siteCategoryId?: number;
    tags?: string[];
    title: string = '';
    url: string = '';

    get accessPermissionDesc(): string {
        switch (this.accessPermission) {
            case AccessPermission.authenticated:
                return '仅登录用户';
            case AccessPermission.owner:
                return '仅自己';
            default:
                return '公开';
        }
    }
}

export enum PostType {
    blogPost = 1,
    article = 2,
    diary = 128,
}

export enum AccessPermission {
    undeclared = 0,
    authenticated = 1 << 3,
    owner = 1 << 28,
}
