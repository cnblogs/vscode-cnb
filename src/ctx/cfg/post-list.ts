import { LocalState } from '@/ctx/local-state'

export namespace PostListCfg {
    export function getPostListPageSize() {
        return LocalState.getExtCfg().get<number>('pageSize.postList') ?? 30
    }
}
