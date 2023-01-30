import path from 'path';
import vscode, { Uri } from 'vscode';

export class AlertService {
    static error(message: string) {
        void vscode.window.showErrorMessage(message);
    }

    static info(message: string) {
        vscode.window.showInformationMessage(message).then(undefined, undefined);
    }

    static warning(message: string) {
        vscode.window.showWarningMessage(message).then(undefined, undefined);
    }

    /**
     * alert that file not linked to the post
     * @param file the file path, could be a string or {@link Uri} object
     */
    static fileNotLinkedToPost(file: string | Uri, { trimExt = true } = {}) {
        file = file instanceof Uri ? file.fsPath : file;
        file = trimExt ? path.basename(file, path.extname(file)) : file;
        this.warning(`本地文件"${file}"未关联博客园博文`);
    }
}
