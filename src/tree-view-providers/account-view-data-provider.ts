import { globalManager } from '../models/global-manager';
import { accountService } from '../services/account.service';
import { Event, ProviderResult, TreeDataProvider, TreeItem, Uri } from 'vscode';

export class AccountViewDataProvider implements TreeDataProvider<TreeItem> {
    constructor() {}
    onDidChangeTreeData?: Event<void | TreeItem | null | undefined> | undefined;
    getTreeItem(element: TreeItem): TreeItem | Thenable<TreeItem> {
        return element;
    }
    getChildren(element?: TreeItem): ProviderResult<TreeItem[]> {
        if (!accountService.isAuthorized || element) {
            return [];
        }
        const u = accountService.curUser;
        const extensionPath = globalManager.extensionContext?.extensionPath;
        return [
            { label: u.name, tooltip: '用户名', iconPath: Uri.parse(`${extensionPath}/dist/assets/icon-avatar.svg`) },
            {
                label: '账户设置',
                tooltip: '账户设置',
                command: {
                    title: '打开账户设置',
                    command: 'vscode-cnb.open-my-account-settings',
                    tooltip: '浏览器中打开我的账户设置',
                },
                iconPath: Uri.parse(`${extensionPath}/dist/assets/icon-account-settings.svg`),
            },
            {
                label: '博客后台',
                tooltip: '博客后台',
                command: {
                    title: '打开博客后台',
                    command: 'vscode-cnb.open-my-blog-management-background',
                    tooltip: '浏览器中打开我的博客后台',
                },
                iconPath: Uri.parse(`${extensionPath}/dist/assets/icon-blog-management.svg`),
            },
            {
                label: '我的博客',
                tooltip: '点击在浏览器中打开我的主页',
                command: {
                    title: '打开我的博客',
                    command: 'vscode-cnb.open-my-blog',
                    tooltip: '浏览器中打开我的博客',
                },
                iconPath: Uri.parse(`${extensionPath}/dist/assets/icon-blog.svg`),
            },
            {
                label: '我的主页',
                tooltip: '点击在浏览器中打开我的主页',
                command: {
                    title: '打开我的主页',
                    command: 'vscode-cnb.open-my-home-page',
                    tooltip: '浏览器中打开我的博客',
                },
                iconPath: Uri.parse(`${extensionPath}/dist/assets/icon-home.svg`),
            },
        ];
    }
}
