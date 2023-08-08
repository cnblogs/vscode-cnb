import { window } from 'vscode'
import { Alert } from '@/infra/alert'
import { pubIngWithInput } from '@/cmd/ing/pub-ing-with-input'

export function pubIngWithSelect() {
    const text = window.activeTextEditor?.document.getText(window.activeTextEditor?.selection)
    if (text === undefined) {
        void Alert.warn(`当前没有选中任何内容`)
        return
    }

    pubIngWithInput(text)
}
