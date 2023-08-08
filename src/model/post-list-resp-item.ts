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
