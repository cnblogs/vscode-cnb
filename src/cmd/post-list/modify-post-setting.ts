import { Uri } from 'vscode'
import { Post } from '@/model/post'
import { Alert } from '@/infra/alert'
import { PostService } from '@/service/post/post'
import { PostFileMapManager } from '@/service/post/post-file-map'
import { revealPostListItem } from '@/service/post/post-list-view'
import { PostCfgPanel } from '@/service/post/post-cfg-panel'
import fs from 'fs'
import { LocalDraft } from '@/service/local-draft'
import { saveFilePendingChanges } from '@/infra/save-file-pending-changes'
import { postDataProvider } from '@/tree-view/provider/post-data-provider'
import { PostTreeItem } from '@/tree-view/model/post-tree-item'
import { postCategoryDataProvider } from '@/tree-view/provider/post-category-tree-data-provider'

export async function modifyPostSetting(input: Post | PostTreeItem | Uri) {
    let post: Post | undefined
    let postId = -1
    input = input instanceof PostTreeItem ? input.post : input

    if (input instanceof Post) {
        post = input
        postId = input.id
    } else if (input instanceof Uri) {
        postId = PostFileMapManager.getPostId(input.fsPath) ?? -1
        if (postId < 0) return Alert.fileNotLinkedToPost(input)
    }

    if (!(postId >= 0)) return

    if (post) await revealPostListItem(post)

    const editDto = await PostService.fetchPostEditDto(postId)
    if (!editDto) return

    const postEditDto = editDto.post
    const localFilePath = PostFileMapManager.getFilePath(postId)
    await PostCfgPanel.open({
        panelTitle: '',
        breadcrumbs: ['更新博文设置', editDto.post.title],
        post: postEditDto,
        localFileUri: localFilePath ? Uri.file(localFilePath) : undefined,
        successCallback: ({ id }) => {
            void Alert.info('博文已更新')
            postDataProvider.fireTreeDataChangedEvent(id)
            postCategoryDataProvider.onPostUpdated({ refreshPost: false, postIds: [id] })
        },
        beforeUpdate: async post => {
            if (localFilePath && fs.existsSync(localFilePath)) {
                await saveFilePendingChanges(localFilePath)
                post.postBody = await new LocalDraft(localFilePath).readAllText()
            }
            return true
        },
    })
}
