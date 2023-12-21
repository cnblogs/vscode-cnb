import { Uri } from 'vscode'
import { Post } from '@/model/post'
import { Alert } from '@/infra/alert'
import { PostService } from '@/service/post/post'
import { PostFileMapManager } from '@/service/post/post-file-map'
import { revealPostListItem } from '@/service/post/post-list-view'
import { PostCfgPanel } from '@/service/post/post-cfg-panel'
import { LocalPost } from '@/service/local-post'
import { saveFilePendingChanges } from '@/infra/save-file-pending-changes'
import { postDataProvider } from '@/tree-view/provider/post-data-provider'
import { PostTreeItem } from '@/tree-view/model/post-tree-item'
import { postCategoryDataProvider } from '@/tree-view/provider/post-category-tree-data-provider'
import { fsUtil } from '@/infra/fs/fsUtil'

export async function modifyPostSetting(input: Post | PostTreeItem | Uri) {
    let post: Post | undefined
    let postId = -1
    input = input instanceof PostTreeItem ? input.post : input

    if (input instanceof Post) {
        post = input
        postId = input.id
    } else {
        //type of input is Uri
        postId = PostFileMapManager.getPostId(input.path) ?? -1
        if (postId < 0) return Alert.fileNotLinkedToPost(input)
    }

    if (!(postId >= 0)) return

    if (post !== undefined) await revealPostListItem(post)

    const postEditDto = (await PostService.getPostEditDto(postId)).post
    const localFilePath = PostFileMapManager.getFilePath(postId)
    await PostCfgPanel.open({
        panelTitle: postEditDto.title,
        breadcrumbs: ['更新博文设置', postEditDto.title],
        post: postEditDto,
        localFileUri: localFilePath !== undefined ? Uri.file(localFilePath) : undefined,
        afterSuccess: ({ id }) => {
            void Alert.info('博文设置已更新')
            postDataProvider.fireTreeDataChangedEvent(id)
            postCategoryDataProvider.onPostUpdated({ refreshPost: false, postIds: [id] })
        },
        beforeUpdate: async post => {
            if (localFilePath !== undefined && (await fsUtil.exists(localFilePath))) {
                await saveFilePendingChanges(localFilePath)
                post.postBody = await new LocalPost(localFilePath).readAllText()
            }
            return true
        },
    })
}
