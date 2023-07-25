import { PlatformCfg } from '@/ctx/cfg/platform'
import getPlatformCfg = PlatformCfg.getPlatformCfg
import os from 'os'
import fs from 'fs'
import { ConfigurationTarget, Uri } from 'vscode'

export namespace WorkspaceCfg {
    export function getWorkspaceUri() {
        const path = getPlatformCfg().get<string>('workspace') ?? '~/Documents/Cnblogs'
        const absPath = path.replace('~', os.homedir())

        return Uri.file(absPath)
    }

    export function setWorkspaceUri(uri: Uri) {
        const fsPath = uri.fsPath
        if (fs.existsSync(fsPath) || uri.scheme !== 'file') throw Error('Invalid Uri')

        const cfgTarget = ConfigurationTarget.Global
        return getPlatformCfg()?.update('workspace', fsPath, cfgTarget)
    }
}
