import vscode from 'vscode';

export class AlertService {
    static error(message: string) {
        vscode.window.showErrorMessage(message);
    }

    static info(message: string) {
        vscode.window.showInformationMessage(message);
    }

    static warning(message: string) {
        vscode.window.showWarningMessage(message);
    }
}
