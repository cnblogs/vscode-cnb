import { PostCat, PostCatAddDto } from '@/model/post-cat'
import { window } from 'vscode'

async function setupTitle(parentTitle: string, oldVal: string) {
    const title = await window.showInputBox({
        title: `分类标题 - ${parentTitle}(1/3)`,
        value: oldVal,
        placeHolder: '<必须>请输入分类标题',
        validateInput: input => {
            if (input === '') return '请输入分类标题'
        },
    })

    if (title === undefined) throw Error()

    return title
}

async function setupVisible(parentTitle: string) {
    const isVisible = await window.showQuickPick(['可见', '不可见'], {
        title: `分类可见性 - ${parentTitle}(2/3)`,
        canPickMany: false,
    })

    if (isVisible === undefined) throw Error()

    return isVisible === '可见'
}

async function setupDescription(parentTitle: string, oldVal: string) {
    const description = await window.showInputBox({
        title: `分类描述 - ${parentTitle}(3/3)`,
        value: oldVal,
        placeHolder: '<可选>请输入分类描述',
    })

    if (description === undefined) throw Error()

    return description
}

export async function inputPostCat(parentTitle: string, cat?: PostCat) {
    try {
        const title = await setupTitle(parentTitle, cat?.title ?? '')
        const isVisible = await setupVisible(title)
        const description = await setupDescription(title, cat?.description ?? '')
        return <PostCatAddDto>{
            title,
            visible: isVisible,
            description,
        }
    } catch (_) {
        // input canceled, do nothing
    }
}
