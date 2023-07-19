import { accountManager } from '@/auth/account-manager'
import { EventEmitter, ProviderResult, ThemeIcon, TreeDataProvider, TreeItem } from 'vscode'

export class AccountViewDataProvider implements TreeDataProvider<TreeItem> {
    private static _instance?: AccountViewDataProvider
    protected _onDidChangeTreeData = new EventEmitter<null | undefined>()

    protected constructor() {}

    static get instance() {
        if (!this._instance) this._instance = new AccountViewDataProvider()

        return this._instance
    }

    get onDidChangeTreeData() {
        return this._onDidChangeTreeData.event
    }

    getTreeItem(element: TreeItem): TreeItem | Thenable<TreeItem> {
        return element
    }

    getChildren(element?: TreeItem): ProviderResult<TreeItem[]> {
        if (!accountManager.isAuthorized || element) return []

        const u = accountManager.currentUser
        return [
            { label: u.name, tooltip: '用户名', iconPath: new ThemeIcon('account') },
            {
                label: '账户设置',
                tooltip: '账户设置',
                command: {
                    title: '打开账户设置',
                    command: 'vscode-cnb.open-my-account-settings',
                    tooltip: '浏览器中打开我的账户设置',
                },
                iconPath: new ThemeIcon('gear'),
            },
            {
                label: '博客后台',
                tooltip: '博客后台',
                command: {
                    title: '打开博客后台',
                    command: 'vscode-cnb.open-my-blog-management-background',
                    tooltip: '浏览器中打开我的博客后台',
                },
                iconPath: new ThemeIcon('console'),
            },
            {
                label: '我的博客',
                tooltip: '点击在浏览器中打开我的主页',
                command: {
                    title: '打开我的博客',
                    command: 'vscode-cnb.open-my-blog',
                    tooltip: '浏览器中打开我的博客',
                },
                iconPath: new ThemeIcon('window'),
            },
            {
                label: '我的主页',
                tooltip: '点击在浏览器中打开我的主页',
                command: {
                    title: '打开我的主页',
                    command: 'vscode-cnb.open-my-home-page',
                    tooltip: '浏览器中打开我的博客',
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

export const accountViewDataProvider = AccountViewDataProvider.instance
