import type { HTTPError } from 'got';
import { isArray } from 'lodash-es';
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

    static httpError(httpError: Partial<HTTPError>, { message = '' } = {}) {
        const body = httpError.response?.body as
            | { errors: (string | unknown)[] | undefined | unknown }
            | undefined
            | null;
        let parsedError = '';
        const errors = body?.errors;
        if (isArray(errors)) {
            parsedError = errors.filter(i => typeof i === 'string' && i.length > 0).join(', ');
        } else if (httpError.message) {
            parsedError = httpError.message;
        } else {
            parsedError = '未知网络错误';
        }

        AlertService.warning((message ? message + (parsedError ? ', ' : '') : '') + parsedError);
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

    static async alertUnauthenticated({ onLoginActionHook }: { onLoginActionHook?: () => unknown } = {}) {
        const options = ['立即登录'];
        const input = await vscode.window.showWarningMessage(
            '登录状态已过期, 请重新登录',
            { modal: true } as vscode.MessageOptions,
            ...options
        );
        if (input === options[0]) onLoginActionHook?.();
    }
}
