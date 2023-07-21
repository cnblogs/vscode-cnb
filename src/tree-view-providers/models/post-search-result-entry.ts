import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from 'vscode'
import { Post } from '@/models/post'
import { ZzkSearchResult } from '@/models/zzk-search-result'
import { BaseEntryTreeItem } from './base-entry-tree-item'
import { BaseTreeItemSource } from './base-tree-item-source'
import { PostTreeItem } from './post-tree-item'

export class PostSearchResultEntry extends BaseTreeItemSource implements BaseEntryTreeItem<PostTreeItem | TreeItem> {
    readonly children: (PostTreeItem | TreeItem)[]

    constructor(
        public searchKey: string,
        public readonly postList: Post[],
        public readonly totalCount: number,
        public readonly zzkSearchResult?: ZzkSearchResult
    ) {
        if (searchKey.length <= 0) throw Error('Empty search key is not allowed')

        super()
        this.children = this.parseChildren()
    }

    private get zzkCount() {
        return this.zzkSearchResult?.count ?? 0
    }

    toTreeItem = (): TreeItem | Promise<TreeItem> =>
        Object.assign<TreeItem, TreeItem>(new TreeItem(`搜索结果: "${this.searchKey}"`), {
            iconPath: new ThemeIcon('vscode-cnb-post-list-search'),
            collapsibleState: TreeItemCollapsibleState.Expanded,
            contextValue: 'cnblogs-post-search-results-entry',
        })

    getChildren = () => this.children
    getChildrenAsync = () => Promise.resolve(this.children)

    private readonly parseChildren = () => [
        this.buildSummaryTreeItem(),
        ...this.postList.map(post => new PostTreeItem(post, false)),
    ]

    private readonly buildSummaryTreeItem = (): TreeItem =>
        Object.assign<TreeItem, TreeItem>(
            new TreeItem(
                `共找到 ${this.totalCount} 篇随笔` +
                    (this.zzkCount > 0 ? `, ${this.zzkSearchResult?.postIds.length} 篇来自找找看` : '')
            ),
            { iconPath: new ThemeIcon('vscode-cnb-post-list-search-result-summary') }
        )
}
