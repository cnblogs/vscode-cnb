import { WebviewCommonCmd, WebviewCmd } from '@/model/webview-cmd'
import { getVsCodeApiSingleton } from 'share/vscode-api'
import { PostCategory } from '@/model/post-category'

let children: Map<number, PostCategory[]>
let pendingChildrenQuery: Map<number, Promise<PostCategory[]>> | undefined | null

export namespace personalCategoriesStore {
    let items: PostCategory[] = []
    export const get = (): PostCategory[] => items ?? []

    export const getByParent = async (parent: number): Promise<PostCategory[]> => {
        children ??= new Map()
        let result = children.get(parent)
        const vscode = getVsCodeApiSingleton()

        if (!result) {
            let promise = pendingChildrenQuery?.get(parent)
            if (promise == null) {
                promise = new Promise<PostCategory[]>(resolve => {
                    const timeoutId = setTimeout(() => {
                        clearTimeout(timeoutId)
                        window.removeEventListener('message', onUpdate)
                        console.warn(`timeout: personalCategoriesStore.getByParent: parent: ${parent}`)
                        resolve([])
                    }, 30 * 1000)

                    const onUpdate = ({
                        data: message,
                    }: {
                        data: WebviewCommonCmd<WebviewCmd.UpdateChildCategoriesPayload>
                    }) => {
                        console.log('onUpdate', message)
                        if (message.payload.parentId === parent) {
                            clearTimeout(timeoutId)

                            children.set(message.payload.parentId, message.payload.value)
                            window.removeEventListener('message', onUpdate)
                            resolve(message.payload.value)
                        }
                    }

                    window.addEventListener<WebviewCommonCmd<WebviewCmd.UpdateChildCategoriesPayload>>(
                        'message',
                        onUpdate
                    )
                }).finally(() => pendingChildrenQuery?.delete(parent))

                vscode.postMessage<WebviewCommonCmd<WebviewCmd.GetChildCategoriesPayload>>({
                    command: WebviewCmd.ExtCmd.getChildCategories,
                    payload: { parentId: parent },
                })
            }

            result = await promise.catch(() => [])
        }

        return result
    }

    export const set = (value: PostCategory[]) => (items = value ?? [])
}
