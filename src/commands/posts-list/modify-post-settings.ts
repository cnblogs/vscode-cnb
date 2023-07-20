import { Post } from '@/models/post'
import { Alert } from '@/services/alert.service'
import { LocalDraft } from '@/services/local-draft.service'
import { PostCfgPanel } from '@/services/post-cfg-panel.service'
import { PostFileMapManager } from '@/services/post-file-map'
import { PostService } from '@/services/post.service'
import { revealPostsListItem } from '@/services/posts-list-view'
import { PostTreeItem } from '@/tree-view-providers/models/post-tree-item'
import { postCategoriesDataProvider } from '@/tree-view-providers/post-categories-tree-data-provider'
import { postsDataProvider } from '@/tree-view-providers/posts-data-provider'
import { saveFilePendingChanges } from '@/utils/save-file-pending-changes'
import fs from 'fs'
import { Uri } from 'vscode'

export const modifyPostSettings = async (input: Post | PostTreeItem | Uri) => {
    let post: Post | undefined
    let postId: number
    input = input instanceof PostTreeItem ? input.post : input

    if (input instanceof Post) {
        post = input
        postId = input.id
    } else {
        // input is Uri
        postId = PostFileMapManager.getPostId(input.fsPath) ?? -1
        if (postId < 0) return void Alert.fileNotLinkedToPost(input)
    }

    if (!(postId >= 0)) return

    if (post) await revealPostsListItem(post)

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
            postsDataProvider.fireTreeDataChangedEvent(id)
            postCategoriesDataProvider.onPostUpdated({ refreshPosts: false, postIds: [id] })
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
