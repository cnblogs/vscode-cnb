import { commands, workspace } from 'vscode';
import { globalState } from './global-state';
import { PostFileMapManager } from './post-file-map';
import { Settings } from './settings.service';

export const isTargetWorkspace = (): boolean => {
    const folders = workspace.workspaceFolders;
    const result = !!folders && folders.length === 1 && folders[0].uri.path === Settings.workspaceUri.path;
    commands.executeCommand('setContext', `${globalState.extensionName}.isTargetWorkspace`, result);
    return result;
};

export const observeConfigurationChange = () => {
    globalState.extensionContext?.subscriptions.push(
        workspace.onDidChangeConfiguration(ev =>
            ev.affectsConfiguration(globalState.extensionName) ? isTargetWorkspace() : false
        )
    );
    isTargetWorkspace();
};

export const beginListenWorkspaceFolderChangeEvent = () => {
    globalState.extensionContext?.subscriptions.push(
        workspace.onDidRenameFiles(e => {
            for (const item of e.files) {
                const { oldUri, newUri } = item;
                const postId = PostFileMapManager.getPostId(oldUri.fsPath);
                if (postId !== undefined) {
                    PostFileMapManager.updateOrCreate(postId, newUri.fsPath);
                }
            }
        }),
        workspace.onDidChangeWorkspaceFolders(() => {
            isTargetWorkspace();
        })
    );
};
