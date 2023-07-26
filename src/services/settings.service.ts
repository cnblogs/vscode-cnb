import os, { homedir } from 'os'
import fs from 'fs'
import { ConfigurationTarget, Uri, workspace } from 'vscode'
import { ImageSrc } from './images-extractor.service'
import { isNumber } from 'lodash-es'
import { untildify } from '@/utils/untildify'

export class Settings {
    static readonly postsListPageSizeKey = 'pageSize.postsList'
    static readonly platform = os.platform()
    static readonly prefix = `cnblogsClientForVSCode`
    static readonly iconThemePrefix = 'workbench'
    static readonly iconThemeKey = 'iconTheme'
    static readonly chromiumPathKey = 'chromiumPath'
    static readonly workspaceUriKey = 'workspace'

    private static readonly _defaultWorkspaceUri = Uri.joinPath(Uri.file(homedir()), 'Documents', 'Cnblogs')
    private static _adaptLegacyWorkspaceTask?: Thenable<void> | null

    static get platformPrefix() {
        const { platform } = this
        switch (platform) {
            case 'darwin':
                return 'macos'
            case 'win32':
                return 'windows'
            case 'linux':
                return 'linux'
            default:
                return null
        }
    }

    static get iconTheme() {
        return workspace.getConfiguration(this.iconThemePrefix).get<string>(this.iconThemeKey)
    }

    static get configuration() {
        return workspace.getConfiguration(this.prefix)
    }

    static get platformConfiguration() {
        const { platformPrefix, prefix } = this

        if (platformPrefix != null) return workspace.getConfiguration(`${prefix}.${platformPrefix}`)

        return null
    }

    static get workspaceUri(): Uri {
        if (this.legacyWorkspaceUri != null) {
            const legacy = this.legacyWorkspaceUri
            if (this._adaptLegacyWorkspaceTask == null) {
                try {
                    this._adaptLegacyWorkspaceTask = this.removeLegacyWorkspaceUri().then(
                        () => (legacy ? this.setWorkspaceUri(Uri.file(legacy)) : Promise.resolve()),
                        () => undefined
                    )
                } finally {
                    this._adaptLegacyWorkspaceTask = null
                }
            }

            if (legacy) return Uri.file(legacy)
        }

        const workspace = this.platformConfiguration?.get<string>(this.workspaceUriKey)
        return workspace ? Uri.file(untildify(workspace)) : this._defaultWorkspaceUri
    }

    static get chromiumPath(): string {
        return this.platformConfiguration?.get(this.chromiumPathKey) ?? ''
    }

    static get createLocalPostFileWithCategory(): boolean {
        return this.configuration.get<boolean>('createLocalPostFileWithCategory') ?? false
    }

    static get automaticallyExtractImagesType(): ImageSrc | null {
        const cfg = this.configuration.get<'disable' | 'web' | 'local' | 'any'>('automaticallyExtractImages') ?? null

        if (cfg === 'local') return ImageSrc.local
        if (cfg === 'any') return ImageSrc.any
        if (cfg === 'web') return ImageSrc.web

        return null // 'disable' case
    }

    static get postsListPageSize() {
        const size = this.configuration.get<number>(this.postsListPageSizeKey)
        return isNumber(size) ? size : 30
    }

    static get showConfirmMsgWhenUploadPost() {
        return this.configuration.get<boolean>('markdown.showConfirmMsgWhenUploadPost') ?? true
    }

    static get showConfirmMsgWhenPullPost() {
        return this.configuration.get<boolean>('markdown.showConfirmMsgWhenPullPost') ?? true
    }

    static get isEnableMarkdownEnhancement() {
        return this.configuration.get<boolean>('markdown.enableEnhancement') ?? true
    }

    static get isEnableMarkdownFenceBlockquote() {
        return this.configuration.get<boolean>('markdown.enableFenceQuote') ?? true
    }

    static get isEnableMarkdownHighlightCodeLines() {
        return this.configuration.get<boolean>('markdown.enableHighlightCodeLines')
    }

    private static get legacyWorkspaceUri(): string | null | undefined {
        return this.configuration.get<string>(this.workspaceUriKey)
    }

    static async setWorkspaceUri(value: Uri) {
        if (!value.fsPath || !(value.scheme === 'file')) throw Error('Invalid uri')

        if (!fs.existsSync(value.fsPath)) throw Error(`Folder "${value.fsPath}" not exist`)

        await this.platformConfiguration?.update(this.workspaceUriKey, value.fsPath, ConfigurationTarget.Global)
    }

    static async setChromiumPath(value: string) {
        await this.platformConfiguration?.update(this.chromiumPathKey, value, ConfigurationTarget.Global)
    }

    static async setCreateLocalPostFileWithCategory(value: boolean) {
        await this.configuration.update('createLocalPostFileWithCategory', value, ConfigurationTarget.Global)
    }

    static async migrateEnablePublishSelectionToIng() {
        const oldKey = 'ing.enablePublishSelectionToIng'
        const isEnablePublishSelectionToIng = this.configuration.get(oldKey)
        if (isEnablePublishSelectionToIng === true) {
            const isOk = await this.configuration
                .update('menus.context.editor', { 'ing:publish-selection': true }, ConfigurationTarget.Global)
                .then(
                    () => true,
                    () => false
                )

            if (isOk) await this.configuration.update(oldKey, undefined, ConfigurationTarget.Global)
        }
    }

    private static removeLegacyWorkspaceUri() {
        return this.configuration.update(this.workspaceUriKey, undefined, ConfigurationTarget.Global)
    }
}
