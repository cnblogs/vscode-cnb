import vscode, { TreeViewOptions } from 'vscode'

export function regTreeView<T>(id: string, opt: TreeViewOptions<T>) {
    return vscode.window.createTreeView(id, opt)
}
