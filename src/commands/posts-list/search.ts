import { window } from 'vscode';
import { postsDataProvider } from '../../tree-view-providers/posts-data-provider';

export const searchPosts = async () => {
    const searchKey = await window.showInputBox({
        ignoreFocusOut: true,
        title: '搜索博文',
        prompt: '输入关键词搜索博文',
        placeHolder: '在此输入关键词',
        validateInput: value => (value.length <= 30 ? null : '最多输入30个字符'),
    });
    if (!searchKey) {
        return;
    }

    await postsDataProvider.search({ key: searchKey });
};

export const clearPostsSearchResults = () => postsDataProvider.clearSearch();
