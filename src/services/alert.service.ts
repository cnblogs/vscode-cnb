import vscode from 'vscode';

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
}
