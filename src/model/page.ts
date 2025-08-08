export type Page<T> = {
    index: number
    size: number
    count: number
    items: T[]
}

export type PageListGeneric<T> = {
    pages: Page<T>[]
}

export class PageList {
    static hasPrev(pageIndex: number) {
        return pageIndex > 1
    }

    static hasNext(pageIndex: number, pageCount: number) {
        return pageIndex < pageCount
    }

    static calcPageCount(pageCap: number, pageListItemCount: number) {
        return Math.floor(pageListItemCount / pageCap) + (pageListItemCount % pageCap > 0 ? 1 : 0)
    }
}
