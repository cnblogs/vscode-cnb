import vscode from 'vscode';

export class AlertService {
    static error(message: string) {
        void vscode.window.showErrorMessage(message);
    }

    static info(message: string) {
        void vscode.window.showInformationMessage(message);
    }

    static warning(message: string) {
        void vscode.window.showWarningMessage(message);
    }
}
