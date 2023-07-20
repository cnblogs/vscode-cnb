import { PostTag } from '@models/post-tag'

export namespace tagsStore {
    let tags: PostTag[] = []

    export const set = (value: PostTag[]) => (tags = value ?? [])
    export const get = (): PostTag[] => tags ?? []
}
