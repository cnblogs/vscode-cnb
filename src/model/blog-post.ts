import { AccessPermission, PostType } from '@/model/post'

export type BlogPost = {
    postBody: string
    categoryIds: []
    collectionIds: []
    inSiteCandidate: boolean
    inSiteHome: boolean
    siteCategoryId: null
    blogTeamIds: []
    displayOnHomePage: boolean
    isAllowComments: boolean
    includeInMainSyndication: boolean
    isOnlyForRegisterUser: boolean
    isUpdateDateAdded: boolean
    description: string
    featuredImage: null
    tags: []
    password: null
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

    // fields also in PostListRespItem
    id: number
    postType: PostType
    accessPermission: AccessPermission
    title: string
    url: string
    entryName: null
    datePublished: string
    dateUpdated: string
    isMarkdown: boolean
    isDraft: boolean
    isPinned: boolean
    isPublished: boolean

    // fields only in PostLispRespItem
    aggCount: number
    feedBackCount: number
    isInSiteCandidate: boolean
    isInSiteHome: boolean
    postConfig: number
    viewCount: number
    webCount: number
}
