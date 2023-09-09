import os from 'os'
import { workspace } from 'vscode'
import { WorkspaceCfg } from '@/ctx/cfg/workspace'
import { setCtx } from '@/ctx/global-ctx'

const diskSymbolRegex = /^(\S{1,5}:)(.*)/

export const isTargetWorkspace = (): boolean => {
    const folders = workspace.workspaceFolders
    let currentFolder = folders?.length === 1 ? folders[0].uri.path : undefined
    let targetFolder = WorkspaceCfg.getWorkspaceUri().path
    const platform = os.platform()
    if (platform === 'win32' && targetFolder !== '' && currentFolder !== undefined) {
        const replacer = (sub: string, m0?: string, m2?: string) =>
            m0 !== undefined && m2 !== undefined ? m0.toLowerCase() + m2 : sub
        currentFolder = currentFolder.replace(diskSymbolRegex, replacer)
        targetFolder = targetFolder.replace(diskSymbolRegex, replacer)
    }
    const isTarget = currentFolder === targetFolder
    void setCtx('isTargetWorkspace', isTarget)
    return isTarget
}
