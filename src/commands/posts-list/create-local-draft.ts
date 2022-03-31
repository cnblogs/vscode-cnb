import { homedir } from 'os';
import path = require('path');
import { Uri, window, workspace } from 'vscode';
import { LocalFileService } from '../../services/local-draft.service';
import { AlertService } from '../../services/alert.service';
import { Settings } from '../../services/settings.service';
import { localDraftsTreeItem, postsDataProvider } from '../../tree-view-providers/posts-data-provider';
import { extensionViews } from '../../tree-view-providers/tree-view-registration';
import { openPostFile } from './open-post-file';

export const createLocalDraft = async () => {
    let title = await window.showInputBox({
        placeHolder: '请输入标题',
        prompt: `文件将会保存到 ${Settings.workspaceUri.fsPath.replace(homedir(), '~')} 目录下`,
        title: '新建本地草稿',
        validateInput: input => {
            if (!input) {
                return '标题不能为空';
            }
            return undefined;
        },
    });
    if (!title) {
        return;
    }
    const { fsPath: workspacePath } = Settings.workspaceUri;
    title = ['.md', '.html'].some(ext => title!.endsWith(ext)) ? title : `${title}${title.endsWith('.') ? '' : '.'}md`;
    const filePath = path.join(workspacePath, title);
    try {
        await workspace.fs.stat(Uri.file(filePath));
        AlertService.error('已存在同名文件');
        return;
    } catch (e) {
        // ignore
    }

    await workspace.fs.writeFile(Uri.file(filePath), new TextEncoder().encode(''));
    await openPostFile(filePath);
    postsDataProvider.fireTreeDataChangedEvent(localDraftsTreeItem);
    const items = (await postsDataProvider.getChildren(localDraftsTreeItem)) as LocalFileService[] | undefined;
    if (items) {
        const item = items.find(x => x.filePath === filePath);
        if (item) {
            await extensionViews.postsList?.reveal(item);
        }
    }
};
