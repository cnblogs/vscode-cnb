import fs from 'fs'
import path from 'path'
import { Uri, workspace } from 'vscode'
import { Post } from '@/model/post'
import { Alert } from '@/infra/alert'
import { PostService } from '@/service/post/post'
import { PostFileMapManager } from '@/service/post/post-file-map'
import { openPostFile } from './open-post-file'
import { PostCatService } from '@/service/post/post-category'
import sanitizeFileName from 'sanitize-filename'
import { WorkspaceCfg } from '@/ctx/cfg/workspace'
import { PostCatCfg } from '@/ctx/cfg/post-category'

export async function buildLocalPostFileUri(post: Post, includePostId = false): Promise<Uri> {
    const workspaceUri = WorkspaceCfg.getWorkspaceUri()
    const shouldCreateLocalPostFileWithCategory = PostCatCfg.isCreateLocalPostFileWithCategory()
    const ext = `.${post.isMarkdown ? 'md' : 'html'}`
    const postIdSegment = includePostId ? `.${post.id}` : ''
    const postTitle = sanitizeFileName(post.title)

    if (!shouldCreateLocalPostFileWithCategory) return Uri.joinPath(workspaceUri, `${postTitle}${postIdSegment}${ext}`)

    const firstCategoryId = post.categoryIds?.[0] ?? null
    let i = firstCategoryId !== null ? await PostCatService.getOne(firstCategoryId) : null
    let categoryTitle = ''
    while (i != null) {
        categoryTitle = path.join(
            sanitizeFileName(i.title, {
                replacement: invalidChar => (invalidChar === '/' ? '_' : ''),
            }),
            categoryTitle
        )
        i = i.parent ?? null
    }

    return Uri.joinPath(workspaceUri, categoryTitle, `${postTitle}${postIdSegment}${ext}`)
}

export async function openPostInVscode(postId: number, forceUpdateLocalPostFile = false): Promise<Uri | false> {
    let mappedPostFilePath = PostFileMapManager.getFilePath(postId)

    const isFileExist = mappedPostFilePath !== undefined && fs.existsSync(mappedPostFilePath)
    if (mappedPostFilePath !== undefined && isFileExist && !forceUpdateLocalPostFile) {
        await openPostFile(mappedPostFilePath)
        return Uri.file(mappedPostFilePath)
    }
    // 本地文件已经被删除了, 确保重新生成博文与本地文件的关联
    if (mappedPostFilePath !== undefined && !isFileExist) {
        await PostFileMapManager.updateOrCreate(postId, '')
        mappedPostFilePath = undefined
    }

    const { post } = await PostService.getPostEditDto(postId)

    const workspaceUri = WorkspaceCfg.getWorkspaceUri()
    await mkDirIfNotExist(workspaceUri)
    let fileUri = mappedPostFilePath !== undefined ? Uri.file(mappedPostFilePath) : await buildLocalPostFileUri(post)

    // 博文尚未关联到本地文件的情况
    // 本地存在和博文同名的文件, 询问用户是要覆盖还是同时保留两者
    if (mappedPostFilePath === undefined && fs.existsSync(fileUri.fsPath)) {
        const opt = ['保留本地文件并以博文 ID 为文件名新建另一个文件', '覆盖本地文件']
        const selected = await Alert.info(
            `无法建立博文与本地文件的关联, 文件名冲突`,
            { detail: `本地已存在名为 ${path.basename(fileUri.fsPath)} 的文件`, modal: true },
            ...opt
        )

        if (selected === opt[0]) fileUri = await buildLocalPostFileUri(post, true)
    }

    // 博文内容写入本地文件, 若文件不存在, 会自动创建对应的文件
    await workspace.fs.writeFile(fileUri, Buffer.from(post.postBody))
    await PostFileMapManager.updateOrCreate(postId, fileUri.fsPath)
    await openPostFile(post)
    return fileUri
}

async function mkDirIfNotExist(uri: Uri) {
    try {
        await workspace.fs.readDirectory(uri)
    } catch (e) {
        void Alert.err(`创建目录失败: ${<string>e}`)
        throw e
    }
}
