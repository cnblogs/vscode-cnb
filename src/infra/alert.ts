import path from 'path'
import { ProgressLocation, Uri, window } from 'vscode'

export class Alert {
    public static err = window.showErrorMessage

    public static info = window.showInformationMessage

    public static warn = window.showWarningMessage

    infoWithTimeout(info: string, sec: number) {
        return window.withProgress(
            {
                title: info,
                location: ProgressLocation.Notification,
            },
            () =>
                new Promise(resolve => {
                    setTimeout(resolve, sec * 1000)
                })
        )
    }

    /**
     * alert that file not linked to the post
     * @param file the file path, could be a string or {@link Uri} object
     * @param trimExt
     */
    fileNotLinkedToPost(file: string | Uri, { trimExt = true } = {}) {
        file = file instanceof Uri ? file.fsPath : file
        file = trimExt ? path.basename(file, path.extname(file)) : file
        void Alert.warn(`本地文件 ${file} 未关联博客园博文`)
    }

    static throwWithWarn(message: string): never {
        void Alert.warn(message)
        throw Error(message)
    }
}
