export class ZzkSearchResult {
    constructor(public readonly postIds: number[] = []) {}

    get count() {
        return this.postIds.length
    }

    static parse<T extends { postIds?: number[] }>(obj?: T | null) {
        return obj == null ? null : new ZzkSearchResult(obj.postIds)
    }
}
