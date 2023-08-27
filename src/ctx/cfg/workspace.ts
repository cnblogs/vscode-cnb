import { PlatformCfg } from '@/ctx/cfg/platform'
import getPlatformCfg = PlatformCfg.getPlatformCfg
import os from 'os'
import { ConfigurationTarget, Uri, workspace } from 'vscode'
import { Alert } from '@/infra/alert'

export namespace WorkspaceCfg {
    export function getWorkspaceUri() {
        const path = getPlatformCfg().get<string>('workspace') ?? '~/Documents/Cnblogs'
        const absPath = path.replace('~', os.homedir())
        return Uri.file(absPath)
    }

    export async function setWorkspaceUri(uri: Uri): Promise<void> {
        const fsPath = uri.fsPath

        if (uri.scheme !== 'file') throw Error(`Invalid Uri: ${uri.path}`)

        try {
            await workspace.fs.stat(uri)
        } catch (e) {
            void Alert.err(`Invalid Uri: ${uri.path}`)
            throw e
        }

        const cfgTarget = ConfigurationTarget.Global
        await getPlatformCfg()?.update('workspace', fsPath, cfgTarget)
    }
}
