import os, { homedir } from 'os'
import fs from 'fs'
import { ConfigurationTarget, Uri, workspace } from 'vscode'
import { ImgSrc } from '@/service/mkd-img-extractor'
import { isNumber } from 'lodash-es'
import { untildify } from '@/infra/untildify'

export class ExtCfg {
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
        return workspace.getConfiguration(ExtCfg.iconThemePrefix).get<string>(ExtCfg.iconThemeKey)
    }

    static get cfg() {
        return workspace.getConfiguration(ExtCfg.cfgPrefix)
    }

    static get platformCfg() {
        if (this.platformPrefix != null) return workspace.getConfiguration(`${ExtCfg.cfgPrefix}.${this.platformPrefix}`)
        return null
    }

    static get workspaceUri(): Uri {
        const legacy = this.legacyWorkspaceUri

        this._adaptLegacyWorkspaceTask ??= this.removeLegacyWorkspaceUri().then(
            () => (legacy ? this.setWorkspaceUri(legacy) : Promise.resolve()),
            () => undefined
        )

        if (legacy) return legacy

        const workspace = this.platformCfg?.get<string>(ExtCfg.workspaceUriKey)
        return workspace ? Uri.file(untildify(workspace)) : this._defaultWorkspaceUri
    }

    static get chromiumPath(): string {
        return this.platformCfg?.get(ExtCfg.chromiumPathKey) ?? ''
    }

    static get createLocalPostFileWithCategory(): boolean {
        return ExtCfg.cfg.get<boolean>('createLocalPostFileWithCategory') ?? false
    }

    static get autoExtractImgSrc(): ImgSrc | undefined {
        const cfg = ExtCfg.cfg.get<'disable' | 'web' | 'dataUrl' | 'fs' | 'any'>('autoExtractImages')

        if (cfg === 'disable') return
        if (cfg === 'fs') return ImgSrc.fs
        if (cfg === 'dataUrl') return ImgSrc.dataUrl
        if (cfg === 'web') return ImgSrc.web
        if (cfg === 'any') return ImgSrc.any
    }

    static get postListPageSize() {
        const size = ExtCfg.cfg.get<number>(ExtCfg.postListPageSizeKey)
        return isNumber(size) ? size : 30
    }

    static get showConfirmMsgWhenUploadPost() {
        return ExtCfg.cfg.get<boolean>('markdown.showConfirmMsgWhenUploadPost') ?? true
    }

    static get showConfirmMsgWhenPullPost() {
        return ExtCfg.cfg.get<boolean>('markdown.showConfirmMsgWhenPullPost') ?? true
    }

    static get enableMarkdownEnhancement() {
        return ExtCfg.cfg.get<boolean>('markdown.enableEnhancement') ?? true
    }

    static get enableMarkdownFenceBlockquote() {
        return ExtCfg.cfg.get<boolean>('markdown.enableFenceQuote') ?? true
    }

    static get enableMarkdownHighlightCodeLines() {
        return ExtCfg.cfg.get<boolean>('markdown.enableHighlightCodeLines')
    }

    private static get legacyWorkspaceUri() {
        const path = this.platformCfg?.get<string>(ExtCfg.workspaceUriKey)?.replace('~', os.homedir())

        if (path === undefined) return undefined

        return Uri.file(path)
    }

    static async setWorkspaceUri(uri: Uri) {
        if (!uri.fsPath || uri.scheme !== 'file') throw Error('Invalid URI')

        if (!fs.existsSync(uri.fsPath)) throw Error(`Path not exist: ${uri.fsPath}`)

        await this.platformCfg?.update(ExtCfg.workspaceUriKey, uri.fsPath, ConfigurationTarget.Global)
    }

    static async setChromiumPath(value: string) {
        await this.platformCfg?.update(ExtCfg.chromiumPathKey, value, ConfigurationTarget.Global)
    }

    static async setCreateLocalPostFileWithCategory(value: boolean) {
        await ExtCfg.cfg.update('createLocalPostFileWithCategory', value, ConfigurationTarget.Global)
    }

    static async migrateEnablePublishSelectionToIng() {
        const oldKey = 'ing.enablePublishSelectionToIng'
        const enablePublishSelectionToIng = ExtCfg.cfg.get(oldKey)
        if (enablePublishSelectionToIng === true) {
            const isOk = await ExtCfg.cfg
                .update('menus.context.editor', { 'ing:publish-select': true }, ConfigurationTarget.Global)
                .then(
                    () => true,
                    () => false
                )

            if (isOk) await ExtCfg.cfg.update(oldKey, undefined, ConfigurationTarget.Global)
        }
    }

    private static removeLegacyWorkspaceUri() {
        return ExtCfg.cfg.update(ExtCfg.workspaceUriKey, undefined, ConfigurationTarget.Global)
    }
}
