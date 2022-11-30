import { homedir, platform } from 'os';
import fs from 'fs';
import { ConfigurationTarget, Uri, workspace } from 'vscode';
import { MarkdownImagesExtractor } from './images-extractor.service';
import { isNumber } from 'lodash-es';

export class Settings {
    static readonly postsListPageSizeKey = 'pageSize.postsList';

    static get prefix() {
        return `cnblogsClientForVSCode`;
    }

    static get iconThemePrefix() {
        return 'workbench';
    }

    static get iconThemeKey() {
        return `iconTheme`;
    }

    static get iconTheme() {
        return workspace.getConfiguration(this.iconThemePrefix).get<string>(this.iconThemeKey);
    }

    static get configuration() {
        return workspace.getConfiguration(this.prefix);
    }

    static get workspaceUri(): Uri {
        const workspace = this.configuration.get<string>('workspace');
        return workspace
            ? Uri.file(workspace.replace(/^~/, homedir()))
            : Uri.joinPath(Uri.file(homedir()), 'Documents', 'Cnblogs');
    }

    static get chromiumPathConfigurationKey() {
        let key = '';
        const p = platform();
        if (p === 'darwin') key = `macos.chromiumPath`;

        if (p === 'win32') key = `windows.chromiumPath`;

        return key;
    }

    static get chromiumPath(): string {
        return this.configuration.get<string>(this.chromiumPathConfigurationKey) ?? '';
    }

    static get createLocalPostFileWithCategory(): boolean {
        return this.configuration.get<boolean>('createLocalPostFileWithCategory') ?? false;
    }

    static get automaticallyExtractImagesType(): MarkdownImagesExtractor['imageType'] | null {
        const value =
            this.configuration.get<MarkdownImagesExtractor['imageType']>('automaticallyExtractImages') ?? null;
        return value?.startsWith('---') ? null : value;
    }

    static get postsListPageSize() {
        const size = this.configuration.get<number>(this.postsListPageSizeKey);
        return isNumber(size) ? size : 30;
    }

    static get isEnableMarkdownEnhancement() {
        return this.configuration.get<boolean>('markdown.enableEnhancement') ?? true;
    }

    static get isEnableMarkdownFenceBlockquote() {
        return this.configuration.get<boolean>('markdown.enableFenceQuote') ?? true;
    }

    static get isEnableMarkdownHighlightCodeLines() {
        return this.configuration.get<boolean>('markdown.enableHighlightCodeLines');
    }

    static async setWorkspaceUri(value: Uri) {
        if (!value.fsPath || !(value.scheme === 'file')) throw Error('Invalid uri');

        if (!fs.existsSync(value.fsPath)) throw Error(`Folder "${value.fsPath}" not exist`);

        await this.configuration.update('workspace', value.fsPath, ConfigurationTarget.Global);
    }

    static async setChromiumPath(value: string) {
        if (!value) return;

        await this.configuration.update(this.chromiumPathConfigurationKey, value, ConfigurationTarget.Global);
    }

    static async setCreateLocalPostFileWithCategory(value: boolean) {
        await this.configuration.update('createLocalPostFileWithCategory', value, ConfigurationTarget.Global);
    }
}
