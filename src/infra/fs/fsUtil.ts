import { Uri, workspace } from 'vscode'

export class fsUtil {
    static async exists(fsPath: string) {
        try {
            await workspace.fs.stat(Uri.file(fsPath))
            return true
        } catch (e) {
            return false
        }
    }
}
