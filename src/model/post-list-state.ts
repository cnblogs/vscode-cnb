export interface PostListState {
    pageIndex: number
    pageSize: number
    itemsCount: number
    pageCount: number
    hasPrev: boolean
    hasNext: boolean
    timestamp: Date
}
