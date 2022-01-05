import { homedir } from 'os';
import * as fs from 'fs';
import { ConfigurationTarget, Uri, workspace } from 'vscode';
import { globalState } from './global-state';

export class Settings {
    static get configuration() {
        return workspace.getConfiguration(globalState.extensionName);
    }

    static get workspaceUri(): Uri {
        const workspace = this.configuration.get<string>('workspace');
        return workspace
            ? Uri.file(workspace.replace(/^~/, homedir()))
            : Uri.joinPath(Uri.file(homedir()), 'Documents', 'Cnblogs');
    }

    static async setWorkspaceUri(value: Uri) {
        if (!value.fsPath || !(value.scheme === 'file')) {
            throw Error('Invalid uri');
        }
        if (!fs.existsSync(value.fsPath)) {
            throw Error(`Folder "${value.fsPath}" not exist`);
        }
        await this.configuration.update('workspace', value.fsPath, ConfigurationTarget.Global);
    }
}
