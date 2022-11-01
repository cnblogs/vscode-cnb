import path from 'path';
import fs from 'fs';
import { Uri, workspace } from 'vscode';

export class LocalDraft {
    constructor(public filePath: string) {}

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

    async readAllText(): Promise<string> {
        const binary = await workspace.fs.readFile(this.filePathUri);
        return new TextDecoder().decode(binary);
    }
}
