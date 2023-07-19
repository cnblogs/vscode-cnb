import os from 'os'
import { commands, workspace } from 'vscode'
import { refreshPostCategoriesList } from '@/commands/post-category/refresh-post-categories-list'
import { refreshPostsList } from '@/commands/posts-list/refresh-posts-list'
import { globalCtx } from './global-state'
import { PostFileMapManager } from './post-file-map'
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
    void commands.executeCommand('setContext', `${globalCtx.extensionName}.isTargetWorkspace`, isTarget)
    return isTarget
}

export const observeConfigurationChange = () => {
    globalCtx.extensionContext?.subscriptions.push(
        workspace.onDidChangeConfiguration(ev => {
            if (ev.affectsConfiguration(Settings.prefix)) isTargetWorkspace()

            if (ev.affectsConfiguration(`${Settings.iconThemePrefix}.${Settings.iconThemeKey}`))
                refreshPostCategoriesList()

            if (ev.affectsConfiguration(`${Settings.prefix}.${Settings.postsListPageSizeKey}`))
                refreshPostsList({ queue: true }).catch(() => undefined)

            if (ev.affectsConfiguration(`${Settings.prefix}.markdown`))
                commands.executeCommand('markdown.preview.refresh').then(undefined, () => undefined)
        })
    )
    isTargetWorkspace()
}

export const observeWorkspaceFolderAndFileChange = () => {
    globalCtx.extensionContext?.subscriptions.push(
        workspace.onDidRenameFiles(e => {
            for (const item of e.files) {
                const { oldUri, newUri } = item
                const postId = PostFileMapManager.getPostId(oldUri.fsPath)
                if (postId !== undefined) void PostFileMapManager.updateOrCreate(postId, newUri.fsPath)
            }
        }),
        workspace.onDidChangeWorkspaceFolders(() => {
            isTargetWorkspace()
        })
    )
}
