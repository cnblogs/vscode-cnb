export interface PostsListState {
    pageIndex: number
    pageSize: number
    itemsCount: number
    pageCount: number
    hasPrevious: boolean
    hasNext: boolean
    totalItemsCount: number
    timestamp: Date
}
