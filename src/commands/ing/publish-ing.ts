import { CommandHandler } from '@/commands/command-handler'
import { IngPublishModel, IngType } from '@/models/ing'
import { AlertService } from '@/services/alert.service'
import { globalCtx } from '@/services/global-ctx'
import { IngApi } from '@/services/ing.api'
import { IngsListWebviewProvider } from '@/services/ings-list-webview-provider'
import { InputStep, MultiStepInput, QuickPickParameters } from '@/services/multi-step-input'
import { commands, MessageOptions, ProgressLocation, QuickPickItem, Uri, window } from 'vscode'

export class PublishIngCommandHandler extends CommandHandler {
    readonly maxLength = 0
    readonly operation = '发布闪存'
    readonly editingText = '编辑闪存'
    readonly inputStep: Record<'content' | 'access' | 'tags', InputStep> = {
        content: async input => {
            this.currentStep = 1
            this.inputContent = await input.showInputBox({
                title: this.editingText + ' - 内容',
                value: this.inputContent,
                prompt: '你在做什么? 你在想什么?',
                totalSteps: Object.keys(this.inputStep).length,
                step: this.currentStep,
                ignoreFocusOut: true,
                validateInput: v => Promise.resolve(v.length > 2000 ? '最多输入2000个字符' : undefined),
                shouldResume: () => Promise.resolve(false),
            })
        },
        access: async input => {
            this.currentStep = 2
            const items = [
                { label: '公开', value: false },
                { label: '仅自己', value: true },
            ]
            const activeItem = items.filter(x => x.value === this.inputIsPrivate)
            const result = <QuickPickItem & { value: boolean }>await input.showQuickPick<
                QuickPickItem & { value: boolean },
                QuickPickParameters<QuickPickItem & { value: boolean }>
            >({
                title: this.editingText + ' - 访问权限',
                placeholder: '',
                step: this.currentStep,
                totalSteps: Object.keys(this.inputStep).length,
                items: items,
                activeItems: activeItem,
                canSelectMany: false,
                ignoreFocusOut: true,
                shouldResume: () => Promise.resolve(false),
            })
            if (result && result.value != null) this.inputIsPrivate = result.value
        },
        tags: async input => {
            this.currentStep = 3
            const value = await input.showInputBox({
                title: this.editingText + '标签(非必填)',
                step: this.currentStep,
                totalSteps: Object.keys(this.inputStep).length,
                placeHolder: '在此输入标签',
                shouldResume: () => Promise.resolve(false),
                prompt: '输入标签, 以 "," 分隔',
                validateInput: () => Promise.resolve(undefined),
                value: this.inputTags.join(', '),
                ignoreFocusOut: true,
            })
            this.inputTags = value
                .split(/, ?/)
                .map(x => x.trim())
                .filter(x => !!x)
        },
    }
    inputTags: string[] = []
    inputContent = ''
    inputIsPrivate = false
    currentStep = 0

    constructor(public readonly contentSource: 'selection' | 'input' = 'selection') {
        super()
    }

    private get formattedIngContent() {
        return `${this.inputTags.map(x => `[${x}]`).join('')}${this.inputContent}`
    }

    async handle(): Promise<void> {
        const content = await this.getContent()
        return content ? this.publish(content) : Promise.resolve()
    }

    private async publish(model: IngPublishModel): Promise<void> {
        const api = new IngApi()

        return this.onPublished(
            await window.withProgress({ location: ProgressLocation.Notification, title: '正在发闪, 请稍候...' }, p => {
                p.report({ increment: 30 })
                return api.publishIng(model).then(isPublished => {
                    p.report({ increment: 70 })
                    return isPublished
                })
            })
        )
    }

    private getContent(): Promise<IngPublishModel | false> {
        switch (this.contentSource) {
            case 'selection':
                return this.getContentFromSelection()
            case 'input':
                return this.acquireInputContent()
        }
    }

    private getContentFromSelection(): Promise<IngPublishModel | false> {
        const text = window.activeTextEditor?.document.getText(window.activeTextEditor?.selection)
        if (!text) {
            this.warnNoSelection()
            return Promise.resolve(false)
        }
        this.inputContent = text
        return this.acquireInputContent()
    }

    private async acquireInputContent(step = this.inputStep.content): Promise<IngPublishModel | false> {
        await MultiStepInput.run(step)
        return this.inputContent && (await this.confirmPublish())
            ? {
                  content: this.formattedIngContent,
                  isPrivate: this.inputIsPrivate,
              }
            : false
    }

    private async confirmPublish(): Promise<boolean> {
        const items = [
            ['确定', () => Promise.resolve(true)],
            ['编辑内容', async () => (await this.acquireInputContent(this.inputStep.content)) !== false],
            ['编辑访问权限', async () => (await this.acquireInputContent(this.inputStep.access)) !== false],
            ['编辑标签', async () => (await this.acquireInputContent(this.inputStep.tags)) !== false],
        ] as const
        const selected = await window.showInformationMessage(
            '确定要发布闪存吗?',
            {
                modal: true,
                detail: '📝' + this.formattedIngContent + (this.inputIsPrivate ? '\n\n🔒仅自己可见' : ''),
            } as MessageOptions,
            ...items.map(([title]) => title)
        )
        return (await items.find(x => x[0] === selected)?.[1].call(null)) ?? false
    }

    private warnNoSelection() {
        AlertService.warn(`无法${this.operation}, 当前没有选中的内容`)
    }

    private async onPublished(isPublished: boolean): Promise<void> {
        const ingsListProvider = IngsListWebviewProvider.instance
        if (isPublished) {
            if (ingsListProvider) {
                return ingsListProvider.refreshIngsList({
                    ingType: this.inputIsPrivate ? IngType.my : IngType.all,
                    pageIndex: 1,
                })
            }

            const options = [
                [
                    '打开闪存',
                    (): Thenable<void> => commands.executeCommand('vscode.open', Uri.parse(globalCtx.config.ingSite)),
                ],
                [
                    '我的闪存',
                    (): Thenable<void> =>
                        commands.executeCommand('vscode.open', Uri.parse(globalCtx.config.ingSite + '/#my')),
                ],
                [
                    '新回应',
                    (): Thenable<void> =>
                        commands.executeCommand('vscode.open', Uri.parse(globalCtx.config.ingSite + '/#recentcomment')),
                ],
                [
                    '提到我',
                    (): Thenable<void> =>
                        commands.executeCommand('vscode.open', Uri.parse(globalCtx.config.ingSite + '/#mention')),
                ],
            ] as const
            const option = await window.showInformationMessage(
                '闪存已发布, 快去看看吧',
                { modal: false },
                ...options.map(v => ({ title: v[0], id: v[0] }))
            )
            if (option) return options.find(x => x[0] === option.id)?.[1].call(null)
        }
    }
}
