import { Post } from '@/models/post';
import { Settings } from '@/services/settings.service';
import { BaseTreeItemSource } from '@/tree-view-providers/models/base-tree-item-source';
import { ThemeIcon, TreeItem, TreeItemCollapsibleState, Uri } from 'vscode';

export class ExportPostTreeItem extends BaseTreeItemSource {
    constructor(public readonly post: Post) {
        super();
    }

    toTreeItem(): TreeItem | Promise<TreeItem> {
        const {
            post: { title, isMarkdown },
        } = this;

        return {
            label: title,
            iconPath: new ThemeIcon(isMarkdown ? 'markdown' : 'file-code'),
            collapsibleState: TreeItemCollapsibleState.None,
            command: undefined,
            resourceUri: Uri.joinPath(Settings.workspaceUri, title + (isMarkdown ? '.md' : '.html')),
        };
    }
}
