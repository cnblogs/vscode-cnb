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
} from 'vscode';

export class InputFlowAction {
    static back = new InputFlowAction();
    static cancel = new InputFlowAction();
    static resume = new InputFlowAction();
}

export type InputStep = (input: MultiStepInput) => Thenable<InputStep | void>;

export interface QuickPickParameters<T extends QuickPickItem> {
    title: string;
    step: number;
    totalSteps: number;
    items: T[];
    activeItems?: T[];
    placeholder: string;
    buttons?: QuickInputButton[];
    canSelectMany: boolean;
    shouldResume: () => Thenable<boolean>;
    onValueChange?: (input: QuickPick<T>) => Thenable<void>;
    onSelectionChange?: (input: QuickPick<T>) => Thenable<void>;
}

interface InputBoxParameters extends InputBoxOptions {
    step: number;
    totalSteps: number;
    buttons?: QuickInputButton[];
    validateInput: (value: string) => Promise<string | undefined>;
    shouldResume: () => Thenable<boolean>;
}

export class MultiStepInput {
    static run(start: InputStep) {
        const input = new MultiStepInput();
        return input.stepThrough(start);
    }

    private current?: QuickInput;
    private steps: InputStep[] = [];

    private async stepThrough(start: InputStep) {
        let step: InputStep | void = start;
        while (step) {
            this.steps.push(step);
            if (this.current) {
                this.current.enabled = false;
                this.current.busy = true;
            }
            try {
                step = await step(this);
            } catch (err) {
                if (err === InputFlowAction.back) {
                    this.steps.pop();
                    step = this.steps.pop();
                } else if (err === InputFlowAction.resume) {
                    step = this.steps.pop();
                } else if (err === InputFlowAction.cancel) {
                    step = undefined;
                } else {
                    throw err;
                }
            }
        }
        if (this.current) {
            this.current.dispose();
        }
    }

    async showQuickPick<T extends QuickPickItem, P extends QuickPickParameters<T>>({
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
    }: P) {
        const disposables: Disposable[] = [];
        try {
            return await new Promise<T | T[] | (P extends { buttons: (infer I)[] } ? I : never)>((resolve, reject) => {
                const input = window.createQuickPick<T>();
                input.title = title;
                input.step = step;
                input.totalSteps = totalSteps;
                input.placeholder = placeholder;
                input.items = items;
                input.canSelectMany = canSelectMany;
                if (activeItems) {
                    input.activeItems = activeItems;
                    input.selectedItems = activeItems;
                }
                input.buttons = [...(this.steps.length > 1 ? [QuickInputButtons.Back] : []), ...(buttons || [])];
                disposables.push(
                    input.onDidTriggerButton(item => {
                        if (item === QuickInputButtons.Back) {
                            reject(InputFlowAction.back);
                        } else {
                            resolve(<any>item);
                        }
                    }),
                    input.onDidChangeValue(() => {
                        if (onValueChange) {
                            onValueChange(input);
                        }
                    }),
                    input.onDidChangeSelection(() => {
                        if (onSelectionChange) {
                            onSelectionChange(input);
                        }
                    }),
                    input.onDidHide(() => {
                        (async () => {
                            reject(
                                shouldResume && (await shouldResume()) ? InputFlowAction.resume : InputFlowAction.cancel
                            );
                        })().catch(reject);
                    }),
                    input.onDidAccept(() => {
                        resolve(canSelectMany ? Array.from(input.selectedItems) : input.selectedItems[0]);
                    })
                );
                if (this.current) {
                    this.current.dispose();
                }
                this.current = input;
                this.current.show();
            });
        } finally {
            disposables.forEach(d => d.dispose());
        }
    }

    async showInputBox<P extends InputBoxParameters>({
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
    }: P) {
        const disposables: Disposable[] = [];
        try {
            return await new Promise<string | (P extends { buttons: (infer I)[] } ? I : never)>((resolve, reject) => {
                const input = window.createInputBox();
                input.title = title;
                input.step = step;
                input.placeholder = placeHolder;
                input.password = password ?? false;
                input.totalSteps = totalSteps;
                input.value = value || '';
                input.prompt = prompt;
                input.buttons = [...(this.steps.length > 1 ? [QuickInputButtons.Back] : []), ...(buttons || [])];
                let validating = validateInput('');
                disposables.push(
                    input.onDidTriggerButton(item => {
                        if (item === QuickInputButtons.Back) {
                            reject(InputFlowAction.back);
                        } else {
                            resolve(<any>item);
                        }
                    }),
                    input.onDidAccept(async () => {
                        const value = input.value;
                        input.enabled = false;
                        input.busy = true;
                        if (!(await validateInput(value))) {
                            resolve(value);
                        }
                        input.enabled = true;
                        input.busy = false;
                    }),
                    input.onDidChangeValue(async text => {
                        const current = validateInput(text);
                        validating = current;
                        const validationMessage = await current;
                        if (current === validating) {
                            input.validationMessage = validationMessage;
                        }
                    }),
                    input.onDidHide(() => {
                        (async () => {
                            reject(
                                shouldResume && (await shouldResume()) ? InputFlowAction.resume : InputFlowAction.cancel
                            );
                        })().catch(reject);
                    })
                );
                if (this.current) {
                    this.current.dispose();
                }
                this.current = input;
                this.current.show();
            });
        } finally {
            disposables.forEach(d => d.dispose());
        }
    }
}
