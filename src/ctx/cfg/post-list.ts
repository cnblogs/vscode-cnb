import { LocalState } from '@/ctx/local-state'

export class PostListCfg {
    static getListPageSize() {
        return LocalState.getExtCfg().get<number>('pageSize.postList') ?? 30
    }
}
