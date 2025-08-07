import { ProviderResult, TreeItem, TreeDataProvider, ThemeIcon } from 'vscode'

export class NaviViewDataProvider implements TreeDataProvider<TreeItem> {
    getTreeItem(el: TreeItem): TreeItem | Thenable<TreeItem> {
        return el
    }

    getChildren(el?: TreeItem): ProviderResult<TreeItem[]> {
        return [
            {
                label: '首页',
                command: {
                    title: '打开博客园首页',
                    command: 'vscode-cnb.open.cnb-home',
                },
                iconPath: new ThemeIcon('home'),
            },
            {
                label: '新闻',
                command: {
                    title: '打开博客园新闻',
                    command: 'vscode-cnb.open.cnb-news',
                },
                iconPath: new ThemeIcon('preview'),
            },
            {
                label: '博问',
                command: {
                    title: '打开博问',
                    command: 'vscode-cnb.open.cnb-q',
                },
                iconPath: new ThemeIcon('question'),
            },
            {
                label: '闪存',
                command: {
                    title: '打开闪存',
                    command: 'vscode-cnb.open.cnb-ing',
                },
                iconPath: new ThemeIcon('comment'),
            },
        ]
    }
}

export const naviViewDataProvider = new NaviViewDataProvider()
