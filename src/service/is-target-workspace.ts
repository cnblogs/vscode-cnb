import os from 'os'
import { workspace } from 'vscode'
import { globalCtx } from '@/ctx/global-ctx'
import { execCmd } from '@/infra/cmd'
import { WorkspaceCfg } from '@/ctx/cfg/workspace'

const diskSymbolRegex = /^(\S{1,5}:)(.*)/

export const isTargetWorkspace = (): boolean => {
    const folders = workspace.workspaceFolders
    let currentFolder = folders?.length === 1 ? folders[0].uri.path : undefined
    let targetFolder = WorkspaceCfg.getWorkspaceUri().path
    const platform = os.platform()
    if (platform === 'win32' && targetFolder && currentFolder) {
        const replacer = (sub: string, m0: string | null | undefined, m2: string | null | undefined) =>
            m0 && m2 ? m0.toLowerCase() + m2 : sub
        currentFolder = currentFolder.replace(diskSymbolRegex, replacer)
        targetFolder = targetFolder.replace(diskSymbolRegex, replacer)
    }
    const isTarget = !!currentFolder && currentFolder === targetFolder
    void execCmd('setContext', `${globalCtx.extName}.isTargetWorkspace`, isTarget)
    return isTarget
}
