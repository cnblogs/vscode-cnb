import type { HTTPError } from 'got'
import { isArray } from 'lodash-es'
import path from 'path'
import vscode, { ProgressLocation, Uri, window } from 'vscode'
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

    export function httpErr(httpError: Partial<HTTPError>, { message = '' } = {}) {
        const body = httpError.response?.body as
            | { errors: (string | unknown)[] | undefined | unknown }
            | undefined
            | null
        let parsedError = ''
        const errors = body?.errors
        if (isArray(errors)) parsedError = errors.filter(i => typeof i === 'string' && i.length > 0).join(', ')
        else if (httpError.message) parsedError = httpError.message
        else parsedError = '未知网络错误'

        void Alert.warn((message ? message + (parsedError ? ', ' : '') : '') + parsedError)
    }

    /**
     * alert that file not linked to the post
     * @param file the file path, could be a string or {@link Uri} object
     * @param trimExt
     */
    export function fileNotLinkedToPost(file: string | Uri, { trimExt = true } = {}) {
        file = file instanceof Uri ? file.fsPath : file
        file = trimExt ? path.basename(file, path.extname(file)) : file
        void Alert.warn(`本地文件"${file}"未关联博客园博文`)
    }

    export async function alertUnAuth({ onLoginActionHook }: { onLoginActionHook?: () => unknown } = {}) {
        const options = ['立即登录']
        const input = await Alert.warn(
            '登录状态已过期, 请重新登录',
            { modal: true } as vscode.MessageOptions,
            ...options
        )
        if (input === options[0]) onLoginActionHook?.()
    }
}
