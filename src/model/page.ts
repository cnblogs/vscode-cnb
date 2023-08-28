export type Page<T> = {
    index: number
    size: number
    count: number
    items: T[]
}

export type PageList<T> = {
    pages: Page<T>[]
}

export namespace PageList {
    export function hasPrev(pageIndex: number) {
        return pageIndex > 1
    }

    export function hasNext(pageIndex: number, pageCount: number) {
        return pageIndex < pageCount
    }

    export function calcPageCount(pageCap: number, pageListItemCount: number) {
        return Math.floor(pageListItemCount / pageCap) + (pageListItemCount % pageCap > 0 ? 1 : 0)
    }
}
