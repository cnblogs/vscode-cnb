import { commands, workspace } from 'vscode';
import { refreshPostCategoriesList } from '../commands/post-category/refresh-post-categories-list';
import { refreshPostsList } from '../commands/posts-list/refresh-posts-list';
import { globalContext } from './global-state';
import { PostFileMapManager } from './post-file-map';
import { Settings } from './settings.service';

export const isTargetWorkspace = (): boolean => {
    const folders = workspace.workspaceFolders;
    const isTarget = !!folders && folders.length === 1 && folders[0].uri.path === Settings.workspaceUri.path;
    void commands.executeCommand('setContext', `${globalContext.extensionName}.isTargetWorkspace`, isTarget);
    return isTarget;
};

export const observeConfigurationChange = () => {
    globalContext.extensionContext?.subscriptions.push(
        workspace.onDidChangeConfiguration(ev => {
            if (ev.affectsConfiguration(Settings.prefix)) isTargetWorkspace();

            if (ev.affectsConfiguration(`${Settings.iconThemePrefix}.${Settings.iconThemeKey}`))
                refreshPostCategoriesList();

            if (ev.affectsConfiguration(`${Settings.prefix}.${Settings.postsListPageSizeKey}`))
                refreshPostsList({ queue: true }).catch(() => undefined);

            if (ev.affectsConfiguration(`${Settings.prefix}.markdown`))
                commands.executeCommand('markdown.preview.refresh').then(undefined, () => undefined);
        })
    );
    isTargetWorkspace();
};

export const observeWorkspaceFolderAndFileChange = () => {
    globalContext.extensionContext?.subscriptions.push(
        workspace.onDidRenameFiles(e => {
            for (const item of e.files) {
                const { oldUri, newUri } = item;
                const postId = PostFileMapManager.getPostId(oldUri.fsPath);
                if (postId !== undefined) void PostFileMapManager.updateOrCreate(postId, newUri.fsPath);
            }
        }),
        workspace.onDidChangeWorkspaceFolders(() => {
            isTargetWorkspace();
        })
    );
};
