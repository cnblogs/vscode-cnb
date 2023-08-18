// -------------------------------------------------------
// reference: https://github.com/microsoft/vscode-extension-samples/blob/752fa4d8039b9456e8d4723eb0ca6e4caa333380/quickinput-sample/src/multiStepInput.ts#L45
// Helper code that wraps the API for the multi-step case.
// -------------------------------------------------------

import {
    Disposable,
    InputBoxOptions,
    QuickInput,
    QuickInputButton,
    QuickInputButtons,
    QuickPick,
    QuickPickItem,
    window,
} from 'vscode'

export class InputFlowAction {
    static back = new InputFlowAction()
    static cancel = new InputFlowAction()
    static resume = new InputFlowAction()
}

export type InputStep = (input: MultiStepInput) => Thenable<InputStep | void>

export type QuickPickParameters<T extends QuickPickItem> = {
    title: string
    step: number
    totalSteps: number
    items: T[]
    activeItems?: T[]
    placeholder: string
    buttons?: QuickInputButton[]
    canSelectMany: boolean
    ignoreFocusOut?: boolean
    shouldResume: () => Thenable<boolean>
    onValueChange?: (input: QuickPick<T>) => Thenable<void>
    onSelectionChange?: (input: QuickPick<T>) => Thenable<void>
}

interface InputBoxParameters extends InputBoxOptions {
    step: number
    totalSteps: number
    buttons?: QuickInputButton[]
    validateInput: (value: string) => Promise<string | undefined>
    shouldResume: () => Thenable<boolean>
}

export class MultiStepInput {
    private current?: QuickInput
    private steps: InputStep[] = []

    static run(this: void, start: InputStep) {
        const input = new MultiStepInput()
        return input.stepThrough(start)
    }

    async showQuickPick<T extends QuickPickItem, TParameters extends QuickPickParameters<T>>({
        title,
        step,
        totalSteps,
        items,
        activeItems,
        placeholder,
        buttons,
        canSelectMany,
        shouldResume,
        onValueChange,
        onSelectionChange,
        ignoreFocusOut: ignoreFocusout,
    }: TParameters) {
        const disposables: Disposable[] = []

        const input = window.createQuickPick<T>()
        input.title = title
        input.step = step
        input.totalSteps = totalSteps
        input.placeholder = placeholder
        input.items = items
        input.canSelectMany = canSelectMany
        if (activeItems) {
            input.activeItems = activeItems
            input.selectedItems = activeItems
        }
        input.buttons = [...(this.steps.length > 1 ? [QuickInputButtons.Back] : []), ...(buttons || [])]
        input.ignoreFocusOut = ignoreFocusout ?? false

        try {
            return await new Promise<
                T | T[] | QuickInputButton | (TParameters extends { buttons: (infer I)[] } ? I : never)
            >((resolve, reject) => {
                disposables.push(
                    input.onDidTriggerButton(item => {
                        if (item === QuickInputButtons.Back) reject(InputFlowAction.back)
                        else resolve(item)
                    }),
                    input.onDidChangeValue(() => {
                        if (onValueChange) void onValueChange(input)
                    }),
                    input.onDidChangeSelection(() => {
                        if (onSelectionChange) void onSelectionChange(input)
                    }),
                    input.onDidHide(() => {
                        ;(async () => {
                            reject(
                                shouldResume !== undefined && (await shouldResume())
                                    ? InputFlowAction.resume
                                    : InputFlowAction.cancel
                            )
                        })().catch(reject)
                    }),
                    input.onDidAccept(() => {
                        resolve(canSelectMany ? Array.from(input.selectedItems) : input.selectedItems[0])
                    })
                )
                if (this.current) this.current.dispose()

                this.current = input
                this.current.show()
            })
        } finally {
            disposables.forEach(d => void d.dispose())
        }
    }

    async showInputBox<TParameters extends InputBoxParameters>({
        title,
        step,
        totalSteps,
        value,
        prompt,
        validateInput,
        buttons,
        shouldResume,
        placeHolder,
        password,
        ignoreFocusOut,
    }: TParameters): Promise<
        | string
        | (TParameters extends {
              buttons: any[]
          }
              ? QuickInputButton
              : string)
    > {
        const disposables: Disposable[] = []

        const input = window.createInputBox()
        input.title = title
        input.step = step
        input.placeholder = placeHolder
        input.password = password ?? false
        input.totalSteps = totalSteps
        input.value = value ?? ''
        input.prompt = prompt
        input.ignoreFocusOut = ignoreFocusOut ?? false
        input.buttons = [...(this.steps.length > 1 ? [QuickInputButtons.Back] : []), ...(buttons || [])]
        let validating = validateInput('')

        try {
            return await new Promise((resolve, reject) => {
                disposables.push(
                    input.onDidTriggerButton(item => {
                        if (item === QuickInputButtons.Back) reject(InputFlowAction.back)
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                        else resolve(item as any)
                    }),
                    input.onDidAccept(async () => {
                        const value = input.value
                        input.enabled = false
                        input.busy = true
                        if ((await validateInput(value)) === undefined) resolve(value)

                        input.enabled = true
                        input.busy = false
                    }),
                    input.onDidChangeValue(async text => {
                        const current = validateInput(text)
                        validating = current
                        const validationMessage = await current
                        if (current === validating) input.validationMessage = validationMessage
                    }),
                    input.onDidHide(() => {
                        ;(async () => {
                            reject(
                                shouldResume !== undefined && (await shouldResume())
                                    ? InputFlowAction.resume
                                    : InputFlowAction.cancel
                            )
                        })().catch(reject)
                    })
                )
                if (this.current) this.current.dispose()

                this.current = input
                this.current.show()
            })
        } finally {
            disposables.forEach(d => void d.dispose())
        }
    }

    private async stepThrough(start: InputStep) {
        let step: InputStep | void = start
        while (step) {
            this.steps.push(step)
            if (this.current) {
                this.current.enabled = false
                this.current.busy = true
            }
            try {
                step = await step(this)
            } catch (err) {
                if (err === InputFlowAction.back) {
                    this.steps.pop()
                    step = this.steps.pop()
                } else if (err === InputFlowAction.resume) {
                    step = this.steps.pop()
                } else if (err === InputFlowAction.cancel) {
                    step = undefined
                } else {
                    throw err
                }
            }
        }
        if (this.current) this.current.dispose()
    }
}
