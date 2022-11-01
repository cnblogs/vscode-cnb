export class PageModel<T> {
    constructor(public pageIndex = 1, public pageSize = 0, public totalItemsCount = 0, public items: T[] = []) {}

    get hasPrevious() {
        return this.pageIndex > 1;
    }

    get hasNext() {
        return this.pageCount > this.pageIndex;
    }

    get pageCount() {
        return Math.floor(this.totalItemsCount / this.pageSize) + (this.totalItemsCount % this.pageSize > 0 ? 1 : 0);
    }
}
