import { window } from 'vscode'
import { postDataProvider } from '@/tree-view/provider/post-data-provider'

export const searchPost = async () => {
    const searchKey = await window.showInputBox({
        ignoreFocusOut: true,
        title: '搜索博文',
        prompt: '输入关键词搜索博文',
        placeHolder: '在此输入关键词',
        validateInput: value => (value.length <= 30 ? null : '最多输入30个字符'),
    })
    if (!searchKey) return

    await postDataProvider.search({ key: searchKey })
}

export const clearPostSearchResults = () => postDataProvider.clearSearch()

export const refreshPostSearchResults = () => postDataProvider.refreshSearch()
