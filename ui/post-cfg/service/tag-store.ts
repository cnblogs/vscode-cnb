import { PostTag } from '@/model/post-tag'

export namespace TagStore {
    let tags: PostTag[] = []

    export const set = (value: PostTag[]) => (tags = value ?? [])
    export const get = (): PostTag[] => tags ?? []
}
