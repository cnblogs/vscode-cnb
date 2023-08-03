import differenceInSeconds from 'date-fns/differenceInSeconds'
import parseISO from 'date-fns/parseISO'

export type PostListRespItem = {
    accessPermission: AccessPermission
    aggCount: number

    datePublished: string
    dateUpdated: string

    entryName: string
    feedBackCount: number

    id: number

    isDraft: boolean
    isInSiteCandidate: boolean
    isInSiteHome: boolean
    isMarkdown: boolean
    isPinned: boolean
    isPublished: boolean

    postConfig: number
    postType: PostType

    title: string
    url: string
    viewCount: number
    webCount: number
}

export type BlogPost = {
    id: number
    postType: 1
    accessPermission: AccessPermission
    title: string
    url: string
    postBody: string
    categoryIds: []
    collectionIds: []
    inSiteCandidate: boolean
    inSiteHome: boolean
    siteCategoryId: null
    blogTeamIds: []
    isPublished: boolean
    displayOnHomePage: boolean
    isAllowComments: boolean
    includeInMainSyndication: boolean
    isPinned: boolean
    isOnlyForRegisterUser: boolean
    isUpdateDateAdded: boolean
    entryName: null
    description: string
    featuredImage: null
    tags: []
    password: null
    datePublished: string
    dateUpdated: string
    isMarkdown: boolean
    isDraft: boolean
    autoDesc: string
    changePostType: boolean
    blogId: number
    author: string
    removeScript: boolean
    clientInfo: null
    changeCreatedTime: boolean
    canChangeCreatedTime: boolean
    isContributeToImpressiveBugActivity: boolean
    usingEditorId: null
    sourceUrl: null
}

export type MyConfig = {
    canInSiteCandidate: boolean
    noSiteCandidateMsg: string
    canInSiteHome: boolean
    noSiteHomeMsg: string
    myTeamCollection: []
    editor: {
        id: number
        host: string
        cdnRefreshId: number
    }
}

export class Post {
    id = -1
    author = ''
    autoDesc = ''
    blogId = -1
    blogTeamIds: number[] = []
    canChangeCreatedTime = false
    categoryIds: number[] | null = []
    changeCreatedTime = false
    changePostType = false

    description = ''
    featuredImage = ''
    displayOnHomePage = false
    entryName = ''
    inSiteCandidate = false
    inSiteHome = false
    includeInMainSyndication = false
    ip = ''
    isAllowComments = true
    isDraft = true
    isMarkdown = true
    isOnlyForRegisterUser = false
    isPinned = false
    isPublished = false
    isUpdateDateAdded = false
    password?: string | null = ''
    postBody = ''
    postType: PostType = PostType.blogPost
    accessPermission: AccessPermission = AccessPermission.undeclared
    removeScript = true
    siteCategoryId?: number
    tags?: string[]
    title = ''

    private _url = ''
    private _dateUpdated?: Date
    private _datePublished = new Date()

    get datePublished(): Date {
        return this._datePublished
    }

    set datePublished(value: Date | string | undefined) {
        this._datePublished = typeof value === 'string' ? parseISO(value) : value ?? new Date()
    }

    get dateUpdated(): Date | undefined {
        return this._dateUpdated
    }

    set dateUpdated(value: Date | string | undefined) {
        this._dateUpdated = typeof value === 'string' ? parseISO(value) : value
    }

    get url() {
        const { _url } = this
        return _url.startsWith('//') ? (this._url = `https:${_url}`) : _url
    }

    set url(value) {
        this._url = value
    }

    get accessPermissionDesc(): string {
        switch (this.accessPermission) {
            case AccessPermission.authenticated:
                return '仅登录用户'
            case AccessPermission.owner:
                return '仅自己'
            default:
                return '公开'
        }
    }

    get hasUpdates(): boolean {
        return this.dateUpdated != null && differenceInSeconds(this.dateUpdated, this.datePublished) > 0
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
    private = 1 << 27,
}

export function formatAccessPermission(value: AccessPermission) {
    switch (value) {
        case AccessPermission.undeclared:
            return '所有人'
        case AccessPermission.authenticated:
            return '登录用户'
        default:
            return '只有我'
    }
}
