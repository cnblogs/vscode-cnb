export interface PostListState {
    pageIndex: number
    pageSize: number
    itemsCount: number
    pageCount: number
    hasPrevious: boolean
    hasNext: boolean
    timestamp: Date
}
