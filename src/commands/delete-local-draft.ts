import { Uri, window, workspace } from 'vscode';
import { LocalDraftFile } from '../models/local-draft-file';
import { localDraftsTreeItem, postsDataProvider } from '../tree-view-providers/blog-posts-data-provider';
import { extensionViews } from '../tree-view-providers/tree-view-registration';

const options = ['确定', '取消'];

export const deleteLocalDraft = async (targetFile: LocalDraftFile) => {
    const files =
        extensionViews.postsList?.selection.filter(s => s instanceof LocalDraftFile).map(x => x as LocalDraftFile) ??
        [];
    if (!files.includes(targetFile)) {
        files.push(targetFile);
    }
    if (!files || files.length <= 0) {
        return;
    }
    const picked = await window.showQuickPick(options, {
        canPickMany: false,
        title: `确定要删除吗? ${files.length}个文件将被删除!`,
        placeHolder: options.join('/'),
    });
    if (picked === options[0]) {
        const deleteTasks: Thenable<any>[] = [];
        extensionViews.postsList?.reveal(localDraftsTreeItem);
        files.forEach(f => {
            deleteTasks.push(workspace.fs.delete(Uri.file(f.filePath), { useTrash: true }));
        });
        await Promise.all(deleteTasks);
        // notify tree view to update the ui
        postsDataProvider.fireTreeDataChangedEvent(undefined);
    }
};
