import os from 'os'
import { workspace } from 'vscode'
import { refreshPostCategoriesList } from '@/commands/post-category/refresh-post-categories-list'
import { refreshPostList } from '@/commands/post-list/refresh-post-list'
import { globalCtx } from './global-ctx'
import { PostFileMapManager } from './post-file-map'
import { execCmd } from '@/utils/cmd'
import { Settings } from './settings.service'

const diskSymbolRegex = /^(\S{1,5}:)(.*)/

export const isTargetWorkspace = (): boolean => {
    const folders = workspace.workspaceFolders
    let currentFolder = folders?.length === 1 ? folders[0].uri.path : undefined
    let targetFolder = Settings.workspaceUri.path
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

export const observeCfgUpdate = () => {
    globalCtx.extCtx?.subscriptions.push(
        workspace.onDidChangeConfiguration(ev => {
            if (ev.affectsConfiguration(Settings.cfgPrefix)) isTargetWorkspace()

            if (ev.affectsConfiguration(`${Settings.iconThemePrefix}.${Settings.iconThemeKey}`))
                refreshPostCategoriesList()

            if (ev.affectsConfiguration(`${Settings.cfgPrefix}.${Settings.postListPageSizeKey}`))
                refreshPostList({ queue: true }).catch(() => undefined)

            if (ev.affectsConfiguration(`${Settings.cfgPrefix}.markdown`))
                execCmd('markdown.preview.refresh').then(undefined, () => undefined)
        })
    )
    isTargetWorkspace()
}

export const observeWorkspaceUpdate = () =>
    void globalCtx.extCtx?.subscriptions.push(
        workspace.onDidChangeWorkspaceFolders(() => {
            isTargetWorkspace()
        })
    )

export const observeWorkspaceFileUpdate = () =>
    void globalCtx.extCtx?.subscriptions.push(
        workspace.onDidRenameFiles(e => {
            for (const item of e.files) {
                const { oldUri, newUri } = item
                const postId = PostFileMapManager.getPostId(oldUri.fsPath)
                if (postId !== undefined) void PostFileMapManager.updateOrCreate(postId, newUri.fsPath)
            }
        })
    )
