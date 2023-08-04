export type ZzkSearchResult = {
    documents: Record<number, { content: string; title: string }>
    postIds: number[]
}
