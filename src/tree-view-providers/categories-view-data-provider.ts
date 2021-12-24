import { commands, Event, EventEmitter, MessageOptions, ThemeIcon, TreeDataProvider, TreeItem, window } from 'vscode';
import { PostCategories, PostCategory } from '../models/post-category';
import { globalState } from '../services/global-state';
import { postCategoryService } from '../services/post-category.service';

export class PostCategoriesViewDataProvider implements TreeDataProvider<PostCategory> {
    private static _instance: PostCategoriesViewDataProvider;
    private _treeDataChanged = new EventEmitter<PostCategory | null | undefined>();
    private _isRefreshing = false;

    onDidChangeTreeData: Event<void | PostCategory | null | undefined> = this._treeDataChanged.event;

    static get instance() {
        if (!this._instance) {
            this._instance = new PostCategoriesViewDataProvider();
        }

        return this._instance;
    }

    get isRefreshing() {
        return this._isRefreshing;
    }

    async setIsRefreshing(value: boolean) {
        await commands.executeCommand(
            'setContext',
            `${globalState.extensionName}.postCategoriesList.isRefreshing`,
            value
        );
        this._isRefreshing = value;
    }

    private constructor() {}

    getTreeItem(element: PostCategory): TreeItem | Thenable<TreeItem> {
        const label = `${element.title}(${element.count})`;
        return Object.assign(new TreeItem(label), {
            iconPath: new ThemeIcon('folder'),
            contextValue: 'cnb-post-category',
        } as TreeItem);
    }

    async getChildren(parent?: PostCategory): Promise<PostCategory[] | undefined> {
        if (parent || this.isRefreshing) {
            return undefined;
        }
        await this.setIsRefreshing(true);
        let categories: PostCategories = [];
        try {
            categories = await postCategoryService.fetchCategories();
        } catch (err) {
            window.showWarningMessage('获取博文分类失败', {
                detail: `服务器返回了错误, ${err instanceof Error ? err.message : JSON.stringify(err)}`,
            } as MessageOptions);
        } finally {
            await this.setIsRefreshing(false);
        }

        return categories;
    }

    getParent?(): Promise<PostCategory | undefined> {
        return Promise.resolve(undefined);
    }

    triggerTreeDataChangeEvent(item?: PostCategory) {
        this._treeDataChanged.fire(item);
    }
}

export const postCategoriesDataProvider = PostCategoriesViewDataProvider.instance;
