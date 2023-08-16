import path from 'path'
import fs from 'fs'
import { Uri, workspace } from 'vscode'

export class LocalPost {
    constructor(public filePath: string) {}

    get fileName(): string {
        return path.basename(this.filePath)
    }

    get fileNameWithoutExt(): string {
        return path.basename(this.filePath, this.fileExt)
    }

    get fileExt() {
        return path.extname(this.filePath)
    }

    get filePathUri() {
        return Uri.file(this.filePath)
    }

    get exist() {
        return fs.existsSync(this.filePath)
    }

    async readAllText() {
        const arr = await workspace.fs.readFile(this.filePathUri)
        const buf = Buffer.from(arr)
        return buf.toString()
    }
}
