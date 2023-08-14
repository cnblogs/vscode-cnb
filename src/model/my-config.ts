import { AccessPermission, PostType } from '@/model/post'

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
    postType: PostType
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
