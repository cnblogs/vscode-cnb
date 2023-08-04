export type Page<T> = {
    index: number
    cap: number
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

export class PageModel<T> {
    constructor(
        public pageIndex: number,
        public pageSize: number,
        public postsCount: number,
        public items: T[]
    ) {}

    get hasPrev() {
        return this.pageIndex > 1
    }

    get hasNext() {
        return this.pageCount > this.pageIndex
    }

    get pageCount() {
        return Math.floor(this.postsCount / this.pageSize) + (this.postsCount % this.pageSize > 0 ? 1 : 0)
    }
}
