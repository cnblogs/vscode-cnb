import { homedir } from 'os';
import { Uri, workspace } from 'vscode';
import { globalState } from './global-state';

export class Settings {
    static get configuration() {
        return workspace.getConfiguration(globalState.extensionName);
    }

    static get workspaceUri() {
        const workspace = this.configuration.get<string>('workspace');
        return workspace ? Uri.file(workspace) : Uri.joinPath(Uri.file(homedir()), 'Documents', 'Cnblogs');
    }
}
