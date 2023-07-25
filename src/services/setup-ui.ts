import { WorkspaceConfiguration as WorkspaceCfg } from 'vscode'
import { extTreeViews } from '@/tree-view-providers/tree-view-registration'
import { getIngListWebviewProvider } from '@/services/ing-list-webview-provider'

/*
"cnblogsClient.ui.textIngStar": {
    "order": 15,
    "type": "boolean",
    "scope": "application",
    "default": false,
    "markdownDescription": "符号化闪存表情"
},
"cnblogsClient.ui.disableIngUserAvatar": {
    "order": 16,
    "type": "boolean",
    "scope": "application",
    "default": false,
    "markdownDescription": "禁用闪存头像"
},
"cnblogsClient.ui.treeViewTitleStyle": {
    "order": 17,
    "scope": "application",
    "default": "normal",
    "markdownDescription": "侧栏标题风格",
    "enum": [
        "normal",
        "short",
        "short-english"
    ],
    "enumItemLabels": [
        "正常",
        "简洁",
        "英文简洁"
    ]
},
"cnblogsClient.ui.fakeExtIcon": {
    "order": 18,
    "type": "boolean",
    "scope": "application",
    "default": false,
    "markdownDescription": "伪装扩展图标"
}
* */

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
