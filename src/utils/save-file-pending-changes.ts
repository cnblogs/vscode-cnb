import { window, Uri } from 'vscode';

export const saveFilePendingChanges = async (filePath: Uri | string | undefined) => {
    const localPath = typeof filePath === 'string' ? filePath : filePath?.fsPath;
    const activeEditor = window.visibleTextEditors.find(x => x.document.uri.fsPath === localPath);
    if (activeEditor) await activeEditor.document.save();
};
