import { Alert } from '@/infra/alert'
import { window } from 'vscode'
import { pubIng } from '@/cmd/ing/pub-ing'

async function setupContent(value: string) {
    const validateInput = (value: string) => {
        if (value === '') return '闪存内容不能为空'
        if (value.length > 2000) return '内容不能超过2000个字符'
    }
    const input = await window.showInputBox({
        title: '编辑闪存 - 内容(1/3)',
        placeHolder: '你在做什么? 你在想什么?',
        value,
        validateInput,
    })

    if (input === undefined) throw Error()

    return input
}

async function setupAccess() {
    const items = [
        { label: '公开', value: false },
        { label: '仅自己', value: true },
    ]

    const selected = await window.showQuickPick(items, {
        title: '编辑闪存 - 访问权限(2/3)',
        canPickMany: false,
    })

    if (selected === undefined) throw Error()

    return selected.value
}

async function setupTag(value: string) {
    const input = await window.showInputBox({
        title: '编辑闪存 - 标签(可选)',
        prompt: '输入以 "," 分隔的标签, 例如: "Tag1,Tag2"',
        value,
    })

    if (input === undefined) throw Error()

    return input
        .split(',')
        .map(x => x.trim())
        .filter(x => x !== '')
}

function fmtIng(content: string, tags: string[]) {
    const tagPrefix = tags.map(x => `[${x}]`).join('')
    return `${tagPrefix}${content}`
}

class InteractiveState {
    private ingTags: string[] = []
    private ingContent = ''
    private ingIsPrivate = false

    async withContent(value: string) {
        try {
            this.ingContent = await setupContent(value)
            this.ingIsPrivate = await setupAccess()
            this.ingTags = await setupTag('')

            const isConfirm = await this.showConfirm()
            if (isConfirm) {
                const content = fmtIng(this.ingContent, this.ingTags)
                pubIng(content, this.ingIsPrivate)
            }
        } catch (_) {
            // pub canceled, do nothing
        }
    }

    private async showConfirm() {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const items = [
                ['确定', () => Promise.resolve(true)],
                ['编辑内容', async () => (this.ingContent = await setupContent(this.ingContent))],
                ['编辑访问权限', async () => (this.ingIsPrivate = await setupAccess())],
                ['编辑标签', async () => (this.ingTags = await setupTag(this.ingTags.join(',')))],
            ] as const

            const detail = `📝${fmtIng(this.ingContent, this.ingTags)}${this.ingIsPrivate ? '\n🔒仅自己可见' : ''}`

            const selected = await Alert.info(
                '确定要发布闪存吗?',
                {
                    modal: true,
                    detail,
                },
                ...items.map(([title]) => title)
            )

            if (selected === '确定') return true
            if (selected === '编辑内容') this.ingContent = await setupContent(this.ingContent)
            if (selected === '编辑访问权限') this.ingIsPrivate = await setupAccess()
            if (selected === '编辑标签') this.ingTags = await setupTag(this.ingTags.join(','))
            if (selected === undefined) return false
        }
    }
}

export function pubIngWithInput(value: string) {
    void new InteractiveState().withContent(value)
}
