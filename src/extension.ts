import { setupExtTreeView } from '@/tree-view/tree-view-register'
import { setupCmd } from '@/setup/setup-cmd'
import { globalCtx } from '@/ctx/global-ctx'
import { window, ExtensionContext } from 'vscode'
import { AuthManager } from '@/auth/auth-manager'
import { setupWorkspaceWatch, setupCfgWatch, setupWorkspaceFileWatch } from '@/setup/setup-watch'
import { extUriHandler } from '@/infra/uri-handler'
import { extendMarkdownIt } from '@/markdown/extend-markdownIt'
import { getIngListWebviewProvider } from '@/service/ing/ing-list-webview-provider'
import { setupUi } from '@/setup/setup-ui'
import { LocalState } from '@/ctx/local-state'
import { setupState } from '@/setup/setup-state'
import { Alert } from './infra/alert'

export async function activate(ctx: ExtensionContext) {
    globalCtx.extCtx = ctx

    // WRN: For old version compatibility, NEVER remove this line
    void LocalState.delSecret('user')

    try {
        await setupState()
        await AuthManager.updateAuthStatus()
        setupCmd()
        setupExtTreeView()
    } catch (e) {
        void Alert.err(`扩展激活失败，[立即反馈](https://github.com/cnblogs/vscode-cnb/issues)，错误信息：${e as string}`)
        throw e
    }

    ctx.subscriptions.push(
        window.registerWebviewViewProvider(getIngListWebviewProvider().viewId, getIngListWebviewProvider()),
        setupCfgWatch(),
        setupWorkspaceWatch(),
        setupWorkspaceFileWatch()
    )

    window.registerUriHandler(extUriHandler)

    setupUi(LocalState.getExtCfg())

    return { extendMarkdownIt }
}

export function deactivate() {
    return
}
