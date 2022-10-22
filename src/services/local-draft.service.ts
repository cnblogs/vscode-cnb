import path from 'path';
import fs from 'fs';
import { Uri, workspace } from 'vscode';
import { PostFileMapManager } from './post-file-map';
import { Settings } from './settings.service';

export class LocalDraft {
    get fileName(): string {
        return path.basename(this.filePath);
    }
    get fileNameWithoutExt(): string {
        return path.basename(this.filePath, this.fileExt);
    }
    get fileExt() {
        return path.extname(this.filePath);
    }
    get filePathUri() {
        return Uri.file(this.filePath);
    }
    get exist() {
        return fs.existsSync(this.filePath);
    }

    constructor(public filePath: string) {}

    async readAllText(): Promise<string> {
        const binary = await workspace.fs.readFile(this.filePathUri);
        return new TextDecoder().decode(binary);
    }

    static async readDrafts(): Promise<LocalDraft[]> {
        const files = await workspace.fs.readDirectory(Settings.workspaceUri);
        return files
            .map(x => Object.assign(new LocalDraft(path.join(`${Settings.workspaceUri.fsPath}`, x[0]))))
            .filter(
                x => !PostFileMapManager.getPostId(x.filePath) && ['.md', '.html'].some(ext => x.fileName.endsWith(ext))
            );
    }
}
