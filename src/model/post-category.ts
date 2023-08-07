export class PostCategory {
    parentId?: number | null
    categoryId = -1
    title = ''
    visible = true
    description = ''
    updateTime: Date = new Date()
    count = 0
    order?: number
    childCount = 0
    visibleChildCount = 0
    parent?: PostCategory | null

    flattenParents({ includeSelf = true }: { includeSelf?: boolean } = {}): PostCategory[] {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let i: PostCategory | null | undefined = this
        const result: PostCategory[] = []
        while (i != null) {
            if (i !== this || includeSelf) result.unshift(i)
            if (i.parent && !(i.parent instanceof PostCategory)) i.parent = Object.assign(new PostCategory(), i.parent)
            i = i.parent
        }

        return result
    }
}

export type PostCategoryAddDto = Pick<PostCategory, 'title' | 'visible' | 'description'>
export type PostCategoryUpdateDto = Pick<
    PostCategory,
    'categoryId' | 'description' | 'count' | 'title' | 'order' | 'visible'
>
