export class PageModel<T> {
    constructor(
        public pageIndex = 1,
        public pageSize = 0,
        public postsCount = 0,
        public items: T[] = []
    ) {}

    get hasPrevious() {
        return this.pageIndex > 1
    }

    get hasNext() {
        return this.pageCount > this.pageIndex
    }

    get pageCount() {
        return Math.floor(this.postsCount / this.pageSize) + (this.postsCount % this.pageSize > 0 ? 1 : 0)
    }
}
