import { setupExtTreeView } from '@/tree-view-providers/tree-view-registration'
import { setupExtCmd } from '@/commands/cmd-register'
import { globalCtx } from '@/services/global-ctx'
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { window, ExtensionContext } from 'vscode'
import { accountManager } from '@/auth/account-manager'
import { watchCfgUpdate, watchWorkspaceFileUpdate, watchWorkspaceUpdate } from '@/services/check-workspace'
import { extUriHandler } from '@/utils/uri-handler'
import { extendMarkdownIt } from '@/markdown/extend-markdownIt'
import { Settings } from '@/services/settings.service'
import { getIngListWebviewProvider } from '@/services/ing-list-webview-provider'

// this method is called when your extension is activated
// your extension is activated the very first time the commands is executed
export function activate(ctx: ExtensionContext) {
    globalCtx.extCtx = ctx

    ctx.subscriptions.push(accountManager)

    setupExtCmd()
    setupExtTreeView()

    ctx.subscriptions.push(
        window.registerWebviewViewProvider(getIngListWebviewProvider().viewId, getIngListWebviewProvider())
    )

    watchCfgUpdate()
    watchWorkspaceUpdate()
    watchWorkspaceFileUpdate()

    Settings.migrateEnablePublishSelectionToIng().catch(console.warn)

    window.registerUriHandler(extUriHandler)

    void accountManager.updateAuthStatus()

    return { extendMarkdownIt }
}

// this method is called when your extension is deactivated
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate() {}
