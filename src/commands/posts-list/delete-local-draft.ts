import { Uri, window, workspace } from 'vscode';
import { LocalFileService } from '../../services/local-draft.service';
import { postsDataProvider } from '../../tree-view-providers/posts-data-provider';
import { extensionViews } from '../../tree-view-providers/tree-view-registration';

const options = ['确定', '取消'];

export const deleteLocalDraft = async (targetFile: LocalFileService) => {
    const files =
        extensionViews.postsList?.selection
            .filter(s => s instanceof LocalFileService)
            .map(x => x as LocalFileService) ?? [];
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
        const deleteTasks: Thenable<unknown>[] = [];
        void extensionViews.postsList?.reveal();
        files.forEach(f => {
            deleteTasks.push(workspace.fs.delete(Uri.file(f.filePath), { useTrash: true }));
        });
        await Promise.all(deleteTasks);
        // notify tree view to update the ui
        postsDataProvider.fireTreeDataChangedEvent(undefined);
    }
};
