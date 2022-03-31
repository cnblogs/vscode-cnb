import path from 'path';
import fs from 'fs';
import { TreeItem, Uri, workspace } from 'vscode';
import { PostFileMapManager } from './post-file-map';
import { Settings } from './settings.service';

export class LocalFileService {
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

    toTreeItem(): TreeItem {
        return Object.assign(new TreeItem(this.fileName), {
            resourceUri: Uri.file(this.filePath),
            command: {
                command: `vscode.open`,
                arguments: [Uri.file(this.filePath), { preview: false }],
                title: '编辑博文',
            },
            contextValue: 'cnb-local-draft-file',
        } as TreeItem);
    }

    static async readDrafts(): Promise<LocalFileService[]> {
        const files = await workspace.fs.readDirectory(Settings.workspaceUri);
        return files
            .map(x => Object.assign(new LocalFileService(path.join(`${Settings.workspaceUri.fsPath}`, x[0]))))
            .filter(
                x => !PostFileMapManager.getPostId(x.filePath) && ['.md', '.html'].some(ext => x.fileName.endsWith(ext))
            );
    }
}
