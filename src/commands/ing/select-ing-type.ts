import { CmdHandler } from '@/commands/cmd-handler'
import { IngType, IngTypesMetadata } from '@/models/ing'
import { ingListWebviewProvider } from '@/services/ings-list-webview-provider'
import { IDisposable } from '@fluentui/react'
import { QuickPickItem, window } from 'vscode'

export class SelectIngType extends CmdHandler {
    handle(): Promise<void> {
        const { ingType: curIngType } = ingListWebviewProvider
        const options: (QuickPickItem & { ingType: IngType })[] = IngTypesMetadata.map(
            ([ingType, { displayName, description }]) => ({
                label: displayName,
                ingType: ingType,
                description: description,
                picked: ingType === curIngType,
            })
        )
        const quickPick = window.createQuickPick<(typeof options)[0]>()
        quickPick.title = '闪存列表选择'
        quickPick.items = options
        quickPick.canSelectMany = false
        quickPick.selectedItems = quickPick.activeItems = options.filter(x => x.picked)
        quickPick.ignoreFocusOut = false
        const disposables: IDisposable[] = [quickPick]
        quickPick.onDidChangeSelection(
            ([selectedItem]) => {
                if (selectedItem) {
                    const { ingType: selectedIngType } = selectedItem
                    quickPick.hide()
                    return ingListWebviewProvider.refreshIngsList({
                        pageIndex: 1,
                        ingType: selectedIngType,
                    })
                }
            },
            undefined,
            disposables
        )
        quickPick.onDidHide(() => disposables.forEach(d => d.dispose()), undefined, disposables)
        quickPick.show()

        return Promise.resolve()
    }
}
