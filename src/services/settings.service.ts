import os, { homedir } from 'os'
import fs from 'fs'
import { ConfigurationTarget, Uri, workspace } from 'vscode'
import { ImageSrc } from './mkd-img-extractor.service'
import { isNumber } from 'lodash-es'
import { untildify } from '@/utils/untildify'

export class Settings {
    static postListPageSizeKey = 'pageSize.postList'
    static cfgPrefix = `cnblogsClient`
    static iconThemePrefix = 'workbench'
    static iconThemeKey = 'iconTheme'
    static chromiumPathKey = 'chromiumPath'
    static workspaceUriKey = 'workspace'

    private static readonly _defaultWorkspaceUri = Uri.joinPath(Uri.file(homedir()), 'Documents', 'Cnblogs')
    private static _adaptLegacyWorkspaceTask?: Thenable<void> | null

    static get platformPrefix() {
        switch (os.platform()) {
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
        return workspace.getConfiguration(Settings.iconThemePrefix).get<string>(Settings.iconThemeKey)
    }

    static get cfg() {
        return workspace.getConfiguration(Settings.cfgPrefix)
    }

    static get platformCfg() {
        if (this.platformPrefix != null)
            return workspace.getConfiguration(`${Settings.cfgPrefix}.${this.platformPrefix}`)
        return null
    }

    static get workspaceUri(): Uri {
        const legacy = this.legacyWorkspaceUri

        this._adaptLegacyWorkspaceTask ??= this.removeLegacyWorkspaceUri().then(
            () => (legacy ? this.setWorkspaceUri(legacy) : Promise.resolve()),
            () => undefined
        )

        if (legacy) return legacy

        const workspace = this.platformCfg?.get<string>(Settings.workspaceUriKey)
        return workspace ? Uri.file(untildify(workspace)) : this._defaultWorkspaceUri
    }

    static get chromiumPath(): string {
        return this.platformCfg?.get(Settings.chromiumPathKey) ?? ''
    }

    static get createLocalPostFileWithCategory(): boolean {
        return Settings.cfg.get<boolean>('createLocalPostFileWithCategory') ?? false
    }

    static get autoExtractImgSrc(): ImageSrc | undefined {
        const cfg = Settings.cfg.get<'disable' | 'web' | 'dataUrl' | 'fs' | 'any'>('autoExtractImages')

        if (cfg === 'disable') return
        if (cfg === 'fs') return ImageSrc.fs
        if (cfg === 'dataUrl') return ImageSrc.dataUrl
        if (cfg === 'web') return ImageSrc.web
        if (cfg === 'any') return ImageSrc.any
    }

    static get postListPageSize() {
        const size = Settings.cfg.get<number>(Settings.postListPageSizeKey)
        return isNumber(size) ? size : 30
    }

    static get showConfirmMsgWhenUploadPost() {
        return Settings.cfg.get<boolean>('markdown.showConfirmMsgWhenUploadPost') ?? true
    }

    static get showConfirmMsgWhenPullPost() {
        return Settings.cfg.get<boolean>('markdown.showConfirmMsgWhenPullPost') ?? true
    }

    static get enableMarkdownEnhancement() {
        return Settings.cfg.get<boolean>('markdown.enableEnhancement') ?? true
    }

    static get enableMarkdownFenceBlockquote() {
        return Settings.cfg.get<boolean>('markdown.enableFenceQuote') ?? true
    }

    static get enableMarkdownHighlightCodeLines() {
        return Settings.cfg.get<boolean>('markdown.enableHighlightCodeLines')
    }

    private static get legacyWorkspaceUri() {
        const path = this.platformCfg?.get<string>(Settings.workspaceUriKey)?.replace('~', os.homedir())

        if (path === undefined) return undefined

        return Uri.file(path)
    }

    static async setWorkspaceUri(uri: Uri) {
        if (!uri.fsPath || uri.scheme !== 'file') throw Error('Invalid URI')

        if (!fs.existsSync(uri.fsPath)) throw Error(`Path not exist: ${uri.fsPath}`)

        await this.platformCfg?.update(Settings.workspaceUriKey, uri.fsPath, ConfigurationTarget.Global)
    }

    static async setChromiumPath(value: string) {
        await this.platformCfg?.update(Settings.chromiumPathKey, value, ConfigurationTarget.Global)
    }

    static async setCreateLocalPostFileWithCategory(value: boolean) {
        await Settings.cfg.update('createLocalPostFileWithCategory', value, ConfigurationTarget.Global)
    }

    static async migrateEnablePublishSelectionToIng() {
        const oldKey = 'ing.enablePublishSelectionToIng'
        const enablePublishSelectionToIng = Settings.cfg.get(oldKey)
        if (enablePublishSelectionToIng === true) {
            const isOk = await Settings.cfg
                .update('menus.context.editor', { 'ing:publish-selection': true }, ConfigurationTarget.Global)
                .then(
                    () => true,
                    () => false
                )

            if (isOk) await Settings.cfg.update(oldKey, undefined, ConfigurationTarget.Global)
        }
    }

    private static removeLegacyWorkspaceUri() {
        return Settings.cfg.update(Settings.workspaceUriKey, undefined, ConfigurationTarget.Global)
    }
}
