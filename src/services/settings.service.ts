import { homedir, platform } from 'os';
import * as fs from 'fs';
import { ConfigurationTarget, Uri, workspace } from 'vscode';

export class Settings {
    static get prefix() {
        return `cnblogsClientForVSCode`;
    }

    static get configuration() {
        return workspace.getConfiguration(this.prefix);
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

    static get chromiumPathConfigurationKey() {
        let key = '';
        const p = platform();
        if (p === 'darwin') {
            key = `macos.chromiumPath`;
        }

        if (p === 'win32') {
            key = `windows.chromiumPath`;
        }

        return key;
    }

    static get chromiumPath(): string {
        return this.configuration.get<string>(this.chromiumPathConfigurationKey) ?? '';
    }

    static async setChromiumPath(value: string) {
        if (!value) {
            return;
        }
        await this.configuration.update(this.chromiumPathConfigurationKey, value, ConfigurationTarget.Global);
    }
}
