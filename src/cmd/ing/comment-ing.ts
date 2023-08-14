import { CmdHandler } from '@/cmd/cmd-handler'
import { IngService } from '@/service/ing/ing'
import { getIngListWebviewProvider } from '@/service/ing/ing-list-webview-provider'
import { ProgressLocation, window } from 'vscode'

export class CommentIngCmdHandler implements CmdHandler {
    private _content = ''

    constructor(
        private _ingId: number,
        private _ingContent: string,
        private _parentCommentId?: number,
        private _atUser?: { id: number; displayName: string }
    ) {}

    async handle(): Promise<void> {
        const maxIngContentLength = 50
        const baseTitle = this._parentCommentId || 0 > 0 ? `回复@${this._atUser?.displayName}` : '评论闪存'
        const input = await window.showInputBox({
            title: `${baseTitle}: ${this._ingContent.substring(0, maxIngContentLength)}${
                this._ingContent.length > maxIngContentLength ? '...' : ''
            }`,
            prompt: this._atUser ? `@${this._atUser.displayName}` : '',
            ignoreFocusOut: true,
        })
        this._content = input || ''
        const { id: atUserId, displayName: atUserAlias } = this._atUser ?? {}
        const atContent = atUserAlias ? `@${atUserAlias} ` : ''

        if (this._content) {
            return window.withProgress({ location: ProgressLocation.Notification, title: '正在请求...' }, async p => {
                p.report({ increment: 30 })
                const isSuccess = await IngService.comment(
                    this._ingId,
                    atContent + this._content,
                    atUserId,
                    this._parentCommentId ?? 0
                )
                if (isSuccess) await this.onCommented()
            })
        }
    }

    private onCommented(): Promise<void> {
        return getIngListWebviewProvider().updateComments([this._ingId]) ?? Promise.resolve()
    }
}
