import { CommandHandler } from '@/commands/command-handler'
import { IngApi } from '@/services/ing.api'
import { IngsListWebviewProvider } from '@/services/ings-list-webview-provider'
import { ProgressLocation, window } from 'vscode'

export class CommentIngCommandHandler extends CommandHandler {
    private _ingApi?: IngApi
    private _content = ''

    constructor(
        private _ingId: number,
        private _ingContent: string,
        private _parentCommentId?: number,
        private _atUser?: { id: number; displayName: string }
    ) {
        super()
    }

    private get ingApi() {
        this._ingApi ??= new IngApi()
        return this._ingApi
    }

    async handle(): Promise<void> {
        if (!IngsListWebviewProvider.instance) return

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
            return window.withProgress(
                { location: ProgressLocation.Notification, title: '正在发表评论, 请稍后...' },
                p => {
                    p.report({ increment: 30 })
                    return this.ingApi
                        .comment(this._ingId, {
                            replyTo: atUserId,
                            content: atContent + this._content,
                            parentCommentId: this._parentCommentId ?? 0,
                        })
                        .then(hasCommented => (hasCommented ? this.onCommented() : undefined))
                }
            )
        }
    }

    private onCommented(): Promise<void> {
        return IngsListWebviewProvider.instance?.updateComments([this._ingId]) ?? Promise.resolve()
    }
}
