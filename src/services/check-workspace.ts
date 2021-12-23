import { commands, workspace } from 'vscode';
import { globalState } from './global-state';
import { Settings } from './settings.service';

export const isTargetWorkspace = (): boolean => {
    const folders = workspace.workspaceFolders;
    const result = !!folders && folders.length === 1 && folders[0].uri.path === Settings.workspaceUri.path;
    commands.executeCommand('setContext', `${globalState.extensionName}.isTargetWorkspace`, result);
    return result;
};

export const beginListenConfigurationChangeEvent = () => {
    workspace.onDidChangeConfiguration(ev =>
        ev.affectsConfiguration(globalState.extensionName) ? isTargetWorkspace() : false
    );
    isTargetWorkspace();
};

export const beginListenWorkspaceFolderChangeEvent = () => {
    workspace.onDidChangeWorkspaceFolders(() => {
        isTargetWorkspace();
    });
};
