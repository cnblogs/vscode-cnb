export class PostCat {
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
    parent?: PostCat | null

    flattenParents(includeSelf: boolean): PostCat[] {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let i: PostCat | null | undefined = this
        const result: PostCat[] = []
        while (i != null) {
            if (i !== this || includeSelf) result.unshift(i)
            if (i.parent !== null && i.parent !== undefined && !(i.parent instanceof PostCat))
                i.parent = Object.assign(new PostCat(), i.parent)
            i = i.parent
        }

        return result
    }
}

export type PostCatAddDto = {
    title: string
    visible: boolean
    description: string
}
export type PostCatUpdateDto = Pick<
    PostCat,
    'categoryId' | 'description' | 'count' | 'title' | 'order' | 'visible'
>
