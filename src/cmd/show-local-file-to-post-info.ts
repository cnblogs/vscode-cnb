import path from 'path'
import { Uri } from 'vscode'
import { Alert } from '@/infra/alert'
import { PostService } from '@/service/post/post'
import { PostFileMapManager } from '@/service/post/post-file-map'
import { searchPostByTitle } from '@/service/post/search-post-by-title'
import { viewPostOnline } from './view-post-online'
import format from 'date-fns/format'
import { PostCateStore } from '@/stores/post-cate-store'

/**
 * 本地文件所关联的博文信息
 *
 * @param {(Uri | number)} input
 * @returns {*}  {Promise<void>}
 */
export async function showLocalFileToPostInfo(input: Uri | number): Promise<number | undefined> {
    let filePath: string | undefined
    let postId: number | undefined
    if (input instanceof Uri && input.scheme === 'file') {
        postId = PostFileMapManager.getPostId(input.path)
        filePath = input.fsPath
        if (postId == null) {
            const options = ['现在去关联']
            const selected = await Alert.info(
                '本地文件尚未关联到博文',
                {
                    modal: true,
                    detail: filePath,
                },
                ...options
            )
            if (selected === options[0]) {
                const filenName = path.basename(filePath, path.extname(filePath))
                postId = PostFileMapManager.extractPostId(filenName)
                if (postId == null) {
                    const selectedPost = await searchPostByTitle(filenName, '搜索要关联的博文')

                    if (selectedPost == null) {
                        void Alert.info('未选择要关联的博文')
                        return
                    }
                    postId = selectedPost.id
                }

                const dto = await PostService.getPostEditDto(postId)
                if (dto == null) {
                    void Alert.err(`对应的博文不存在(Id: ${postId})`)
                    return
                }

                await PostFileMapManager.updateOrCreate(postId, input.path)
                void Alert.info(`本地文件已与博文(Id: ${postId})建立关联`)
                return postId
            }
            return
        }
    } else if (typeof input === 'number') {
        filePath = PostFileMapManager.getFilePath(input)
        postId = input
    }

    if (filePath === undefined || postId === undefined || postId < 0) return

    const { post } = await PostService.getPostEditDto(postId)

    let categories = (await PostCateStore.createAsync()).getFlatAll()
    categories = categories.filter(x => post.categoryIds?.includes(x.categoryId))
    const categoryDesc = categories.length > 0 ? `博文分类: ${categories.map(c => c.title).join(', ')}\n` : ''
    const tagsDesc = (post.tags?.length ?? 0) > 0 ? `博文标签: ${post.tags?.join(', ')}\n` : ''
    const options = ['在线查看博文', '取消关联']
    const postUrl = post.url.startsWith('//') ? `https:${post.url}` : post.url
    const selected = await Alert.info(
        `关联博文 - ${post.title}(Id: ${post.id})`,
        {
            modal: true,
            detail: `🔗博文链接: ${postUrl}\n博文发布时间: ${format(
                post.datePublished ?? new Date(),
                'yyyy-MM-dd HH:mm'
            )}\n博文发布状态: ${post.isPublished ? '已发布' : '未发布'}\n博文访问权限: ${post.accessPermissionDesc
                }\n${categoryDesc}${tagsDesc}`.replace(/\n$/, ''),
        },
        ...options
    )
    if (selected === options[0]) {
        await viewPostOnline(post)
    } else if (selected === options[1]) {
        await PostFileMapManager.updateOrCreate(postId, '')
        void Alert.info(`本地文件已与博文(Id: ${postId})取消关联`)
    }
}
