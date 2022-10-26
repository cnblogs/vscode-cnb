import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from 'vscode';
import { Post } from '../../models/post';
import { ZzkSearchResult } from '../../models/zzk-search-result';
import { BaseTreeItemSource } from './base-tree-item-source';
import { PostTreeItem } from './post-tree-item';

export class PostSearchResultEntry extends BaseTreeItemSource {
    readonly children: (PostTreeItem | TreeItem)[];

    constructor(
        public searchKey: string,
        public readonly posts: Post[],
        public readonly totalCount: number,
        public readonly zzkSearchResult?: ZzkSearchResult
    ) {
        if (searchKey.length <= 0) {
            throw Error('Empty search key is not allowed');
        }
        super();
        this.children = this.parseChildren();
    }

    private get zzkCount() {
        return this.zzkSearchResult?.count ?? 0;
    }

    toTreeItem = (): TreeItem | Promise<TreeItem> =>
        Object.assign<TreeItem, TreeItem>(new TreeItem(`搜索结果: "${this.searchKey}"`), {
            iconPath: new ThemeIcon('vscode-cnb-posts-list-search'),
            collapsibleState: TreeItemCollapsibleState.Expanded,
        });

    private readonly parseChildren = () => [
        this.buildSummaryTreeItem(),
        ...this.posts.map(post => new PostTreeItem(post, false)),
    ];

    private readonly buildSummaryTreeItem = (): TreeItem =>
        Object.assign<TreeItem, TreeItem>(
            new TreeItem(
                `共找到 ${this.totalCount} 篇随笔` +
                    (this.zzkCount > 0 ? `, ${this.zzkSearchResult?.postIds.length} 篇来自找找看` : '')
            ),
            { iconPath: new ThemeIcon('vscode-cnb-posts-list-search-result-summary') }
        );
}
