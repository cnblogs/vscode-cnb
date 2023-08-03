import { PostType } from './post'

export type PostUpdatedResp = {
    blogUrl: string
    dateAdded: string
    entryName: string
    id: number
    postType: PostType
    tags: string[]
    title: string
    url: string
}
