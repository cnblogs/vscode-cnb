import { Uri, workspace } from 'vscode'

export namespace fsUtil {
    export async function exists(path: string) {
        try {
            await workspace.fs.stat(Uri.file(path))
            return true
        } catch (e) {
            return false
        }
    }
}
