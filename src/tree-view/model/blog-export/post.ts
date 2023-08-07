import type { ExportPost } from '@/model/blog-export/export-post'
import { BaseTreeItemSource } from '@/tree-view/model/base-tree-item-source'
import { ExportPostEntryTreeItem } from '@/tree-view/model/blog-export'
import { ThemeIcon, TreeItem, TreeItemCollapsibleState, Uri } from 'vscode'
import { globalCtx } from '@/ctx/global-ctx'
import { WorkspaceCfg } from '@/ctx/cfg/workspace'

export class ExportPostTreeItem extends BaseTreeItemSource {
    readonly contextValue = 'cnblogs-export-post'

    constructor(
        public readonly parent: ExportPostEntryTreeItem,
        public readonly post: ExportPost
    ) {
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
                command: `${globalCtx.extName}.blog-export.view-post`,
                arguments: [this],
            },
            resourceUri: Uri.joinPath(WorkspaceCfg.getWorkspaceUri(), title + (isMarkdown ? '.md' : '.html')),
            contextValue,
        }
    }
}
