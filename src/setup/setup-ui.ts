import { WorkspaceConfiguration as WorkspaceCfg } from 'vscode'
import { getIngListWebviewProvider } from '@/service/ing-list-webview-provider'
import { extTreeViews } from '@/tree-view/tree-view-register'

export function setupUi(cfg: WorkspaceCfg) {
    void getIngListWebviewProvider().refreshingList()
    applyTreeViewTitleStyle(cfg)
}

export const isEnableTextIngStar = (cfg: WorkspaceCfg) => cfg.get<boolean>('ui.textIngStar')

export const isDisableIngUserAvatar = (cfg: WorkspaceCfg) => cfg.get<boolean>('ui.disableIngUserAvatar')

export function applyTreeViewTitleStyle(cfg: WorkspaceCfg) {
    type Enum = 'normal' | 'short'
    const option = cfg.get<Enum>('ui.treeViewTitleStyle')
    if (option === 'normal') {
        extTreeViews.postList.title = '随笔列表'
        extTreeViews.anotherPostList.title = '随笔列表'
        extTreeViews.account.title = '账户信息'
        extTreeViews.postCategoriesList.title = '分类列表'
        extTreeViews.blogExport.title = '博客备份'
        extTreeViews.navi.title = '博客园导航'
        return
    }
    if (option === 'short') {
        extTreeViews.postList.title = '随笔'
        extTreeViews.anotherPostList.title = '随笔'
        extTreeViews.account.title = '账户'
        extTreeViews.postCategoriesList.title = '分类'
        extTreeViews.blogExport.title = '备份'
        extTreeViews.navi.title = '导航'
        return
    }
}

/*
// TODO: Wait for VSC API support
"cnblogsClient.ui.fakeExtIcon": {
    "order": 18,
    "type": "boolean",
    "scope": "application",
    "default": false,
    "markdownDescription": "伪装扩展图标"
}
export function applyFakeExtIcon(cfg: WorkspaceCfg) {
    const isEnable = cfg.get<boolean>('ui.fakeExtIcon')
    console.log(isEnable)
}
*/
