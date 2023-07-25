import { setupExtTreeView } from '@/tree-view/tree-view-register'
import { setupExtCmd } from '@/setup/setup-cmd'
import { globalCtx } from '@/service/global-ctx'
import { window, ExtensionContext } from 'vscode'
import { accountManager } from '@/auth/account-manager'
import { setupWorkspaceWatch, setupCfgWatch, setupWorkspaceFileWatch } from '@/setup/setup-watch'
import { extUriHandler } from '@/infra/uri-handler'
import { extendMarkdownIt } from '@/markdown/extend-markdownIt'
import { Settings } from '@/service/settings'
import { getIngListWebviewProvider } from '@/service/ing-list-webview-provider'
import { setupUi } from '@/setup/setup-ui'

export function activate(ctx: ExtensionContext) {
    globalCtx.extCtx = ctx

    ctx.subscriptions.push(accountManager)

    setupExtCmd()
    setupExtTreeView()

    ctx.subscriptions.push(
        window.registerWebviewViewProvider(getIngListWebviewProvider().viewId, getIngListWebviewProvider()),
        setupCfgWatch(),
        setupWorkspaceWatch(),
        setupWorkspaceFileWatch()
    )

    Settings.migrateEnablePublishSelectionToIng().catch(console.warn)

    window.registerUriHandler(extUriHandler)

    void accountManager.updateAuthStatus()

    setupUi(Settings.cfg)

    return { extendMarkdownIt }
}

export function deactivate() {
    return
}
