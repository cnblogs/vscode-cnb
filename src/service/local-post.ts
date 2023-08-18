import path from 'path'
import { Uri, workspace } from 'vscode'

export class LocalPost {
    constructor(public filePath: string) {}

    get fileNameWithoutExt(): string {
        return path.basename(this.filePath, this.fileExt)
    }

    get fileExt() {
        return path.extname(this.filePath)
    }

    async readAllText() {
        const arr = await workspace.fs.readFile(Uri.file(this.filePath))
        const buf = Buffer.from(arr)
        return buf.toString()
    }
}
