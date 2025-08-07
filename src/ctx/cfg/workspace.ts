import { PlatformCfg } from '@/ctx/cfg/platform'
import os from 'os'
import { ConfigurationTarget, Uri, workspace } from 'vscode'
import { Alert } from '@/infra/alert'
import { PostFileMapManager } from '@/service/post/post-file-map'

export class WorkspaceCfg {
    static getWorkspaceUri() {
        const path = PlatformCfg.getPlatformCfg().get<string>('workspace') ?? '~/Documents/Cnblogs'
        const absPath = path.replace('~', os.homedir())
        return Uri.file(absPath)
    }

    static async setWorkspaceUri(uri: Uri): Promise<void> {
        const fsPath = uri.fsPath

        if (uri.scheme !== 'file') throw Error(`Invalid Uri: ${uri.path}`)

        try {
            await workspace.fs.stat(uri)
        } catch (e) {
            void Alert.err(`Invalid Uri: ${uri.path}`)
            throw e
        }

        const oldWorkspaceUri = WorkspaceCfg.getWorkspaceUri()
        const cfgTarget = ConfigurationTarget.Global
        await PlatformCfg.getPlatformCfg()?.update('workspace', fsPath, cfgTarget)
        PostFileMapManager.updateWithWorkspace(oldWorkspaceUri)
    }
}
