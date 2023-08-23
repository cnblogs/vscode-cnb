import { IngService } from '@/service/ing/ing'
import { getIngListWebviewProvider } from '@/service/ing/ing-list-webview-provider'
import { ProgressLocation, window } from 'vscode'

export async function handleCommentIng(
    ingId: number,
    ingContent: string,
    parentCommentId?: number,
    atUser?: { id: number; displayName: string }
) {
    let content = ''

    const maxIngContentLength = 50
    const baseTitle = parentCommentId !== undefined ? `回复@${atUser?.displayName}` : '评论闪存'
    const input = await window.showInputBox({
        title: `${baseTitle}: ${ingContent.substring(0, maxIngContentLength)}${
            ingContent.length > maxIngContentLength ? '...' : ''
        }`,
        prompt: atUser !== undefined ? `@${atUser.displayName}` : '',
        ignoreFocusOut: true,
    })
    content = input ?? ''
    const { id: atUserId, displayName: atUserAlias } = atUser ?? {}
    const atContent = atUserAlias !== undefined ? `@${atUserAlias} ` : ''

    if (content !== '') {
        return window.withProgress({ location: ProgressLocation.Notification, title: '正在请求...' }, async p => {
            p.report({ increment: 30 })
            const isSuccess = await IngService.comment(ingId, atContent + content, atUserId, parentCommentId ?? 0)
            if (isSuccess) await getIngListWebviewProvider().updateComments([ingId])
        })
    }
}
