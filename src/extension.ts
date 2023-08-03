import { setupExtTreeView } from '@/tree-view/tree-view-register'
import { setupExtCmd } from '@/setup/setup-cmd'
import { globalCtx } from '@/ctx/global-ctx'
import { window, ExtensionContext } from 'vscode'
import { accountManager, AccountManagerNg } from '@/auth/account-manager'
import { setupWorkspaceWatch, setupCfgWatch, setupWorkspaceFileWatch } from '@/setup/setup-watch'
import { extUriHandler } from '@/infra/uri-handler'
import { extendMarkdownIt } from '@/markdown/extend-markdownIt'
import { getIngListWebviewProvider } from '@/service/ing/ing-list-webview-provider'
import { setupUi } from '@/setup/setup-ui'
import { LocalState } from '@/ctx/local-state'

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

    window.registerUriHandler(extUriHandler)

    void AccountManagerNg.updateAuthStatus()

    setupUi(LocalState.getExtCfg())

    return { extendMarkdownIt }
}

export function deactivate() {
    return
}
