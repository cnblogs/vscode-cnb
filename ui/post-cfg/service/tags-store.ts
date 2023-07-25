import { PostTag } from '@/model/post-tag'

export namespace tagsStore {
    let tags: PostTag[] = []

    export const set = (value: PostTag[]) => (tags = value ?? [])
    export const get = (): PostTag[] => tags ?? []
}
