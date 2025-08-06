import { Uri, workspace } from 'vscode'

// eslint-disable-next-line @typescript-eslint/no-namespace
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
