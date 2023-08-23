import format from 'date-fns/format'
import { homedir } from 'os'
import { MarkdownString, ThemeIcon, TreeItem, TreeItemCollapsibleState, Uri } from 'vscode'
import { Post } from '@/model/post'
import { PostCategory } from '@/model/post-category'
import { PostFileMapManager } from '@/service/post/post-file-map'
import { BaseTreeItemSource } from '@/tree-view/model/base-tree-item-source'
import { IconThemeCfg } from '@/ctx/cfg/icon-theme'
import { WorkspaceCfg } from '@/ctx/cfg/workspace'
import { extName } from '@/ctx/ext-const'

const contextValues = {
    post({ id }: Post) {
        return PostFileMapManager.getFilePath(id) !== undefined ? 'cnb-post-cached' : 'cnb-post'
    },
}

const categoryIcon = () => {
    const iconTheme = IconThemeCfg.getIconTheme()
    let iconId = 'folder'
    switch (iconTheme) {
        case 'vs-seti':
            iconId = 'file-directory'
            break
    }
    return new ThemeIcon(iconId)
}

export type TreeItemSource = Post | PostCategory | TreeItem | BaseTreeItemSource

type Converter<T> = (s: T) => TreeItem | Promise<TreeItem>

const postConverter: Converter<Post> = obj => {
    const descDatePublished = `  \n发布于: ${format(obj.datePublished, 'yyyy-MM-dd HH:mm')}`
    const localPath = PostFileMapManager.getFilePath(obj.id)
    const localPathForDesc = localPath !== undefined ? localPath.replace(homedir(), '~') : '未关联本地文件'
    const descLocalPath = localPath !== undefined ? `  \n本地路径: ${localPathForDesc}` : ''
    let url = obj.url
    url = url.startsWith('//') ? `https:${url}` : url
    return Object.assign<TreeItem, TreeItem>(new TreeItem(`${obj.title}`, TreeItemCollapsibleState.Collapsed), {
        tooltip: new MarkdownString(`[${url}](${url})` + descDatePublished + descLocalPath),
        command: {
            command: extName`.post.edit`,
            arguments: [obj.id],
            title: '编辑博文',
        },
        contextValue: contextValues.post(obj),
        iconPath: new ThemeIcon(obj.isMarkdown ? 'markdown' : 'file-code'),
        description: localPath !== undefined ? localPathForDesc : '',
        resourceUri: Uri.joinPath(WorkspaceCfg.getWorkspaceUri(), obj.title + (obj.isMarkdown ? '.md' : '.html')),
    })
}

const categoryConverter: Converter<PostCategory> = ({ title, count }) =>
    Object.assign<TreeItem, TreeItem>(new TreeItem(`${title}(${count})`), {
        collapsibleState: count > 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None,
        iconPath: categoryIcon(),
        contextValue: 'cnb-post-category',
    })

const baseTreeItemSourceConverter: Converter<BaseTreeItemSource> = obj => obj.toTreeItem()

export const toTreeItem = <T extends TreeItemSource>(obj: T) => {
    if (obj instanceof TreeItem) return obj
    else if (obj instanceof BaseTreeItemSource) return baseTreeItemSourceConverter(obj)
    else if (obj instanceof PostCategory) return categoryConverter(obj)
    else return postConverter(obj)
}
