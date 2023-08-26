import { WebviewCommonCmd, Webview } from '@/model/webview-cmd'
import { getVsCodeApiSingleton } from 'share/vscode-api'
import { PostCat } from '@/model/post-cat'

let children: Map<number, PostCat[]>
let pendingChildrenQuery: Map<number, Promise<PostCat[]>> | undefined | null
let items: PostCat[] = []

export namespace UserCatStore {
    export const get = () => items

    export function set(value: PostCat[]) {
        items = value
    }

    export const getByParent = async (parent: number): Promise<PostCat[]> => {
        children ??= new Map()
        let result = children.get(parent)
        const vscode = getVsCodeApiSingleton()

        if (result === undefined) {
            let promise = pendingChildrenQuery?.get(parent)
            if (promise == null) {
                promise = new Promise<PostCat[]>(resolve => {
                    const timeoutId = setTimeout(() => {
                        clearTimeout(timeoutId)
                        window.removeEventListener('message', onUpdate)
                        console.warn(`timeout: UserCatStore.getByParent: parent: ${parent}`)
                        resolve([])
                    }, 30 * 1000)

                    const onUpdate = ({
                        data: message,
                    }: {
                        data: WebviewCommonCmd<Webview.Cmd.UpdateChildCategoriesPayload>
                    }) => {
                        if (message.payload.parentId === parent) {
                            clearTimeout(timeoutId)

                            children.set(message.payload.parentId, message.payload.value)
                            window.removeEventListener('message', onUpdate)
                            resolve(message.payload.value)
                        }
                    }

                    window.addEventListener('message', onUpdate)
                }).finally(() => pendingChildrenQuery?.delete(parent))

                vscode.postMessage<WebviewCommonCmd<Webview.Cmd.GetChildCategoriesPayload>>({
                    command: Webview.Cmd.Ext.getChildCategories,
                    payload: { parentId: parent },
                })
            }

            result = await promise.catch(() => [])
        }

        return result
    }
}
