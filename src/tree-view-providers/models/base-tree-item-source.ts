import { TreeItem } from 'vscode';

export abstract class BaseTreeItemSource {
    abstract toTreeItem(): TreeItem | Promise<TreeItem>;
}
