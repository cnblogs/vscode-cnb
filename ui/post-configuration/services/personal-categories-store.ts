import { PostCategories } from '@/models/post-category'
import { WebviewCommonCommand, webviewCommands } from '@models/webview-commands'
import { vsCodeApi } from 'share/vscode-api'

let children: Map<number, PostCategories>
let pendingChildrenQuery: Map<number, Promise<PostCategories>> | undefined | null

export namespace personalCategoriesStore {
    let items: PostCategories = []
    export const get = (): PostCategories => items ?? []

    export const getByParent = async (parent: number): Promise<PostCategories> => {
        children ??= new Map()
        let result = children.get(parent)
        const vscode = vsCodeApi.getInstance()

        if (!result) {
            let promise = pendingChildrenQuery?.get(parent)
            if (promise == null) {
                promise = new Promise<PostCategories>(resolve => {
                    const timeoutId = setTimeout(() => {
                        clearTimeout(timeoutId)
                        window.removeEventListener('message', onUpdate)
                        console.warn(`timeout: personalCategoriesStore.getByParent: parent: ${parent}`)
                        resolve([])
                    }, 30 * 1000)

                    const onUpdate = ({
                        data: message,
                    }: {
                        data: WebviewCommonCommand<webviewCommands.UpdateChildCategoriesPayload>
                    }) => {
                        console.log('onUpdate', message)
                        if (message.payload.parentId === parent) {
                            clearTimeout(timeoutId)

                            children.set(message.payload.parentId, message.payload.value)
                            window.removeEventListener('message', onUpdate)
                            resolve(message.payload.value)
                        }
                    }

                    window.addEventListener<WebviewCommonCommand<webviewCommands.UpdateChildCategoriesPayload>>(
                        'message',
                        onUpdate
                    )
                }).finally(() => pendingChildrenQuery?.delete(parent))

                vscode.postMessage<WebviewCommonCommand<webviewCommands.GetChildCategoriesPayload>>({
                    command: webviewCommands.ExtensionCommands.getChildCategories,
                    payload: { parentId: parent },
                })
            }

            result = await promise.catch(() => [])
        }

        return result
    }

    export const set = (value: PostCategories) => (items = value ?? [])
}
