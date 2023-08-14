import path from 'path'
import { ProgressLocation, Uri, window } from 'vscode'
import { isDevEnv } from '@/model/config'

export namespace Alert {
    export const err = window.showErrorMessage

    export const info = window.showInformationMessage

    export const warn = window.showWarningMessage

    export function infoWithTimeout(info: string, sec: number) {
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

    export function dev(log: string) {
        if (isDevEnv()) console.log(log)
    }

    /**
     * alert that file not linked to the post
     * @param file the file path, could be a string or {@link Uri} object
     * @param trimExt
     */
    export function fileNotLinkedToPost(file: string | Uri, { trimExt = true } = {}) {
        file = file instanceof Uri ? file.fsPath : file
        file = trimExt ? path.basename(file, path.extname(file)) : file
        void Alert.warn(`本地文件 ${file} 未关联博客园博文`)
    }
}
