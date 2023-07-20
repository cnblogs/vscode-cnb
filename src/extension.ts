import { setupExtTreeView } from '@/tree-view-providers/tree-view-registration'
import { setupExtCmd } from '@/commands/cmd-register'
import { globalCtx } from '@/services/global-ctx'
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import vscode from 'vscode'
import { accountManager } from '@/auth/account-manager'
import {
    observeConfigurationChange,
    observeWorkspaceFolderAndFileChange as observeWorkspaceFolderChange,
} from '@/services/check-workspace'
import { extUriHandler } from '@/utils/uri-handler'
import { IngsListWebviewProvider } from 'src/services/ings-list-webview-provider'
import { extendMarkdownIt } from '@/markdown/extend-markdownIt'
import { Settings } from '@/services/settings.service'

// this method is called when your extension is activated
// your extension is activated the very first time the commands is executed
export function activate(context: vscode.ExtensionContext) {
    globalCtx.extCtx = context

    context.subscriptions.push(accountManager)

    setupExtCmd()
    setupExtTreeView()

    const timeoutId = setTimeout(() => {
        IngsListWebviewProvider.ensureRegistered()
        clearTimeout(timeoutId)
    }, 1000)

    observeConfigurationChange()
    observeWorkspaceFolderChange()

    Settings.migrateEnablePublishSelectionToIng().catch(console.warn)

    vscode.window.registerUriHandler(extUriHandler)

    return { extendMarkdownIt }
}

// this method is called when your extension is deactivated
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate() {}
