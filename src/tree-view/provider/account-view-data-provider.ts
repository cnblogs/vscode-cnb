import { AuthManager } from '@/auth/auth-manager'
import { EventEmitter, ThemeIcon, TreeDataProvider, TreeItem } from 'vscode'
import { UserService } from '@/service/user.service'

export class AccountViewDataProvider implements TreeDataProvider<TreeItem> {
    protected _onDidChangeTreeData = new EventEmitter<null | undefined>()

    get onDidChangeTreeData() {
        return this._onDidChangeTreeData.event
    }

    getTreeItem(el: TreeItem): TreeItem | Thenable<TreeItem> {
        return el
    }

    async getChildren(el?: TreeItem) {
        if (!(await AuthManager.isAuthed()) || el !== undefined) return []

        const userName = (await UserService.getUserInfo())?.displayName
        return [
            { label: userName, tooltip: '用户名', iconPath: new ThemeIcon('account') },
            {
                label: '账号设置',
                command: {
                    title: '打开账号设置',
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
