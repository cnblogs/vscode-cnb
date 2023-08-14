import { AccessPermission, PostType } from '@/model/post'

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
