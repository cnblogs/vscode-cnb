import { Uri, workspace } from 'vscode'

export namespace fsUtil {
    export async function exists(fsPath: string) {
        try {
            await workspace.fs.stat(Uri.file(fsPath))
            return true
        } catch (e) {
            return false
        }
    }
}
