import { homedir } from 'os'
import path from 'path'
import { Uri, window, workspace } from 'vscode'
import { osOpenActiveFile } from '@/cmd/open/os-open-active-file'
import { WorkspaceCfg } from '@/ctx/cfg/workspace'
import { saveLocalPost } from '@/cmd/post-list/upload-post'
import { openPostFile } from '@/cmd/post-list/open-post-file'
import { LocalPost } from '@/service/local-post'
import fs from 'fs'

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
    if (title === undefined) return

    const filePath = path.join(workspacePath, `${title}.md`)

    if (!fs.existsSync(filePath)) await workspace.fs.writeFile(Uri.file(filePath), Buffer.from('# Hello World\n'))

    await openPostFile(filePath)
    await osOpenActiveFile()
    // 设置中关闭了 `autoReveal` 的情况下, 需要两次调用 `workbench.files.action.showActiveFileInExplorer` 命令, 才能正确 `reveal`
    if (workspace.getConfiguration('explorer').get<boolean>('autoReveal') === false) await osOpenActiveFile()

    const focusEditor = async () => {
        const editor = window.activeTextEditor
        if (editor !== undefined)
            await window.showTextDocument(editor.document, { preview: false, preserveFocus: false })
    }
    await focusEditor()
    // 确保能 focus 到编辑器(不这么做, 有时会聚焦到 explorer 处)
    await new Promise<void>(resolve => {
        const innerTimeout = setTimeout(() => {
            clearTimeout(innerTimeout)
            void focusEditor().finally(() => resolve())
        }, 50)
    })

    await saveLocalPost(new LocalPost(filePath))
}
