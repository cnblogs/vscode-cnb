import { PostTag } from '../../../src/wasm'

let tags: PostTag[] = []

export namespace TagStore {
    export const get = () => tags

    export function set(value: PostTag[]) {
        tags = value
    }
}
