import { CmdHandler } from '@/commands/cmd-handler'
import { IngType, IngTypesMetadata } from '@/models/ing'
import { getIngListWebviewProvider } from '@/services/ing-list-webview-provider'
import { QuickPickItem, window } from 'vscode'

export class SwitchIngType implements CmdHandler {
    handle(): Promise<void> {
        const options: (QuickPickItem & { ingType: IngType })[] = IngTypesMetadata.map(
            ([ingType, { displayName, description }]) => ({
                label: displayName,
                ingType: ingType,
                description: description,
                picked: ingType === getIngListWebviewProvider().ingType,
            })
        )
        const quickPick = window.createQuickPick<(typeof options)[0]>()

        quickPick.title = '选择闪存类型'
        quickPick.items = options
        quickPick.canSelectMany = false
        quickPick.activeItems = options.filter(x => x.picked)
        quickPick.selectedItems = quickPick.activeItems
        quickPick.ignoreFocusOut = false

        const disposables = [quickPick]

        quickPick.onDidChangeSelection(
            ([selectedItem]) => {
                if (selectedItem) {
                    quickPick.hide()
                    return getIngListWebviewProvider().refreshingList({
                        pageIndex: 1,
                        ingType: selectedItem.ingType,
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
