import { homedir } from 'os'
import path from 'path'
import { Uri, window, workspace } from 'vscode'
import { osOpenActiveFile } from '@/cmd/open/os-open-active-file'
import { openPostFile } from './open-post-file'
import { WorkspaceCfg } from '@/ctx/cfg/workspace'

export async function createLocal() {
    const dir = WorkspaceCfg.getWorkspaceUri().fsPath.replace(homedir(), '~')
    let title = await window.showInputBox({
        placeHolder: '请输入标题',
        prompt: `文件将会保存到 ${dir}`,
        title: '新建博文',
        validateInput: input => {
            if (!input) return '标题不能为空'

            return undefined
        },
    })
    if (title === undefined) return

    const { fsPath: workspacePath } = WorkspaceCfg.getWorkspaceUri()
    if (!['.md', '.html'].some(ext => title !== undefined && title.endsWith(ext)))
        title = `${title}${title.endsWith('.') ? '' : '.'}md`

    const filePath = path.join(workspacePath, title)

    try {
        await workspace.fs.stat(Uri.file(filePath))
    } catch (e) {
        // 文件不存在
        await workspace.fs.writeFile(Uri.file(filePath), Buffer.from(''))
    }

    await openPostFile(filePath)
    await osOpenActiveFile()
    // 设置中关闭了 `autoReveal` 的情况下, 需要两次调用 `workbench.files.action.showActiveFileInExplorer` 命令, 才能正确 `reveal`
    if (workspace.getConfiguration('explorer').get<boolean>('autoReveal') === false) await osOpenActiveFile()

    const focusEditor = async () => {
        const { activeTextEditor } = window
        if (activeTextEditor)
            await window.showTextDocument(activeTextEditor.document, { preview: false, preserveFocus: false })
    }
    await focusEditor()
    // 确保能 focus 到编辑器(不这么做, 有时会聚焦到 explorer 处)
    await new Promise<void>(resolve => {
        const innerTimeout = setTimeout(() => {
            clearTimeout(innerTimeout)
            void focusEditor().finally(() => resolve())
        }, 50)
    })
}
