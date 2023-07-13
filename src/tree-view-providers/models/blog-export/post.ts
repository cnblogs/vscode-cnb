import { ViewPostCommandHandler } from '@/commands/blog-export/view-post'
import type { ExportPost } from '@/models/blog-export/export-post'
import { Settings } from '@/services/settings.service'
import { BaseTreeItemSource } from '@/tree-view-providers/models/base-tree-item-source'
import { ExportPostsEntryTreeItem } from '@/tree-view-providers/models/blog-export'
import { ThemeIcon, TreeItem, TreeItemCollapsibleState, Uri } from 'vscode'

export class ExportPostTreeItem extends BaseTreeItemSource {
    readonly contextValue = 'cnblogs-export-post'

    constructor(public readonly parent: ExportPostsEntryTreeItem, public readonly post: ExportPost) {
        super()
    }

    toTreeItem(): TreeItem | Promise<TreeItem> {
        const {
            post: { title, isMarkdown },
            contextValue,
        } = this

        return {
            label: title,
            iconPath: new ThemeIcon(isMarkdown ? 'markdown' : 'file-code'),
            collapsibleState: TreeItemCollapsibleState.None,
            command: {
                title: '查看博文',
                command: ViewPostCommandHandler.commandName,
                arguments: [this],
            },
            resourceUri: Uri.joinPath(Settings.workspaceUri, title + (isMarkdown ? '.md' : '.html')),
            contextValue,
        }
    }
}
