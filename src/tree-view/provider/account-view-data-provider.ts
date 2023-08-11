import { AccountManager } from '@/auth/account-manager'
import { EventEmitter, ProviderResult, ThemeIcon, TreeDataProvider, TreeItem } from 'vscode'

export class AccountViewDataProvider implements TreeDataProvider<TreeItem> {
    protected _onDidChangeTreeData = new EventEmitter<null | undefined>()

    get onDidChangeTreeData() {
        return this._onDidChangeTreeData.event
    }

    getTreeItem(element: TreeItem): TreeItem | Thenable<TreeItem> {
        return element
    }

    getChildren(element?: TreeItem): ProviderResult<TreeItem[]> {
        if (!AccountManager.isAuthed || element) return []

        const userName = AccountManager.getUserInfo()?.DisplayName
        return [
            { label: userName, tooltip: '用户名', iconPath: new ThemeIcon('account') },
            {
                label: '账户设置',
                command: {
                    title: '打开账户设置',
                    command: 'vscode-cnb.open.account-setting',
                },
                iconPath: new ThemeIcon('gear'),
            },
            {
                label: '博客后台',
                command: {
                    title: '打开博客后台',
                    command: 'vscode-cnb.open.blog-console',
                },
                iconPath: new ThemeIcon('console'),
            },
            {
                label: '我的博客',
                command: {
                    title: '打开我的博客',
                    command: 'vscode-cnb.open.my-blog',
                },
                iconPath: new ThemeIcon('window'),
            },
            {
                label: '我的主页',
                command: {
                    title: '打开我的主页',
                    command: 'vscode-cnb.open.my-home',
                },
                iconPath: new ThemeIcon('home'),
            },
            {
                label: '退出登录',
                tooltip: '',
                command: {
                    title: '退出登录',
                    command: 'vscode-cnb.logout',
                },
                iconPath: new ThemeIcon('log-out'),
            },
        ]
    }

    fireTreeDataChangedEvent() {
        this._onDidChangeTreeData.fire(undefined)
    }
}

export const accountViewDataProvider = new AccountViewDataProvider()
