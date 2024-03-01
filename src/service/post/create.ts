import { homedir } from 'os'
import { window } from 'vscode'
import { WorkspaceCfg } from '@/ctx/cfg/workspace'
import { openPostFile } from '@/cmd/post-list/open-post-file'
import { Post, PostType } from '@/model/post'
import { PostService } from './post'
import { Alert } from '@/infra/alert'
import { PostListView } from '@/cmd/post-list/post-list-view'

export async function createPost() {
    const workspacePath = WorkspaceCfg.getWorkspaceUri().fsPath
    const dir = workspacePath.replace(homedir(), '~')
    const title = await window.showInputBox({
        placeHolder: '请输入标题',
        prompt: `文件将会保存至 ${dir}`,
        title: '新建博文',
        validateInput: input => {
            if (input === '') return '标题不能为空'
            return
        },
    })

    if (title == null) return

    const post = new Post()
    post.title = title
    post.postBody = '# Hello World\n'
    post.isMarkdown = true
    post.isDraft = true
    post.displayOnHomePage = true
    post.postType = PostType.blogPost
    const postId = (await PostService.update(post)).id
    if (postId > 0) {
        post.id = postId
        await PostListView.refresh()
        await openPostFile(post, undefined, true)
    } else {
        void Alert.err('创建博文失败，postId: ' + postId)
    }
}
