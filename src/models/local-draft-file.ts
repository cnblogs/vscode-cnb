import path = require('path');
import { TreeItem, Uri, workspace } from 'vscode';
import { PostFileMapManager } from '../services/post-file-map';
import { Settings } from '../services/settings.service';

export class LocalDraftFile {
    filePath: string = '';
    get fileName(): string {
        return path.basename(this.filePath);
    }
    get fileNameWithoutExt(): string {
        return path.basename(this.filePath, this.fileExt);
    }
    get fileExt() {
        return path.extname(this.filePath);
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

    static async read(): Promise<LocalDraftFile[]> {
        const files = await workspace.fs.readDirectory(Settings.workspaceUri);
        return files
            .map(x =>
                Object.assign(new LocalDraftFile(), {
                    filePath: path.join(`${Settings.workspaceUri.fsPath}`, x[0]),
                } as LocalDraftFile)
            )
            .filter(
                x => !PostFileMapManager.getPostId(x.filePath) && ['.md', '.html'].some(ext => x.fileName.endsWith(ext))
            );
    }
}
