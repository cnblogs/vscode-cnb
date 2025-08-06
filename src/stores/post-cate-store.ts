import { PostCat } from '@/model/post-cat'
import { PostCatService } from '@/service/post/post-cat'

const DEFAULT_ORDER: number = 999999

export class PostCateStore {
    constructor(private categories: ReadonlyArray<PostCat>) { }

    get isNullOrEmpty() {
        return this.categories == null || this.categories.length === 0
    }

    static async createAsync() {
        const categories = await PostCatService.getAll()
        return new PostCateStore(categories)
    }

    private static clonePostCat(categories: ReadonlyArray<PostCat>) {
        return categories.map(x => {
            const cate = Object.assign(new PostCat(), x)
            return cate
        })
    }

    async refreshAsync() {
        this.categories = await PostCatService.getAll()
    }

    getFlatAll() {
        if (this.isNullOrEmpty) return []

        const flat: PostCat[] = []
        const queue = this.getRoots()
        while (queue.length > 0) {
            const current = queue.pop()
            if (current == null) continue
            flat.push(Object.assign(new PostCat(), current))
            if (current.children != null) for (const child of current.children) queue.unshift(child)
        }

        return flat.sort((x, y) => {
            const order1 = x.order ?? DEFAULT_ORDER
            const order2 = y.order ?? DEFAULT_ORDER
            if (order1 > order2) return 1
            else if (order1 < order2) return -1
            else return x.title.localeCompare(y.title)
        })
    }

    getRoots() {
        if (this.isNullOrEmpty) return []
        return PostCateStore.clonePostCat(this.categories)
    }

    getChildren(categoryId: number) {
        if (this.isNullOrEmpty) return []

        let children: PostCat[] = []
        const queue = this.getRoots()
        while (queue.length > 0) {
            const current = queue.pop()
            if (current == null) continue
            if (current.categoryId === categoryId) {
                if (current.children != null) children = current.children
                break
            }

            if (current.children != null) for (const child of current.children) queue.unshift(child)
        }

        children = PostCateStore.clonePostCat(children)
        return children
    }

    getOne(categoryId: number) {
        if (this.isNullOrEmpty) return null

        let category: PostCat | null = null
        const queue = this.getRoots()
        while (queue.length > 0) {
            const current = queue.pop()
            if (current == null) continue
            if (current.categoryId === categoryId) {
                category = Object.assign(new PostCat(), current)
                break
            }

            if (current.children != null) for (const child of current.children) queue.unshift(child)
        }

        if (category != null) category.children = []
        return category
    }
}
