import { QuickPickItem } from 'vscode'
import { AccessPermission, Post } from '@/model/post'
import { PostCategories, PostCategory } from '@/model/post-category'
import { Alert } from '@/service/alert'
import { InputFlowAction, InputStep, MultiStepInput, QuickPickParameters } from '@/service/multi-step-input'
import { postCategoryService } from '@/service/post-category'

class CategoryPickItem implements QuickPickItem {
    label: string
    description?: string | undefined
    detail?: string | undefined
    picked?: boolean | undefined
    alwaysShow?: boolean | undefined

    constructor(name: string, public id: number) {
        this.label = name
    }

    static fromPostCategory(this: void, category: PostCategory): CategoryPickItem {
        return new CategoryPickItem(category.title, category.categoryId)
    }

    static fromPostCategories(categories: PostCategories): CategoryPickItem[] {
        return categories.map(this.fromPostCategory)
    }
}

class AccessPermissionPickItem implements QuickPickItem {
    description?: string | undefined
    detail?: string | undefined
    picked?: boolean | undefined
    alwaysShow?: boolean | undefined

    constructor(public id: AccessPermission, public label: string) {}
}

type PostSettingsType = 'categoryIds' | 'tags' | 'description' | 'password' | 'accessPermission' | 'isPublished'
type PostSettingsDto = Pick<Post, PostSettingsType>

const defaultSteps: PostSettingsType[] = [
    'accessPermission',
    'description',
    'categoryIds',
    'tags',
    'password',
    'isPublished',
]

const parseTagNames = (value: string) => value.split(/[,，]/).filter(({ length }) => length > 0)

export const inputPostSettings = (
    postTitle: string,
    source: PostSettingsDto,
    steps: PostSettingsType[] = []
): Promise<PostSettingsDto | undefined> => {
    steps = steps?.length > 0 ? steps : defaultSteps
    const configuredPost = Object.assign({}, source)
    const state = {
        title: `${postTitle} - 博文设置`,
        totalSteps: steps.length,
        step: 1,
    }
    let map: [PostSettingsType, (input: MultiStepInput) => Promise<InputStep | undefined>][] = []
    const calculateNextStep = (): undefined | InputStep =>
        state.step > steps.length ? undefined : map.find(x => x[0] === steps[state.step - 1])?.[1]
    const calculateStepNumber = (type: PostSettingsType) => {
        state.step = steps.findIndex(x => x === type) + 1
    }

    // 访问权限
    const inputAccessPermission = async (input: MultiStepInput) => {
        calculateStepNumber('accessPermission')
        const items = [
            new AccessPermissionPickItem(AccessPermission.undeclared, '公开'),
            new AccessPermissionPickItem(AccessPermission.authenticated, '仅登录用户'),
            new AccessPermissionPickItem(AccessPermission.owner, '只有我'),
        ]
        const picked = <AccessPermissionPickItem>await input.showQuickPick<
            AccessPermissionPickItem,
            QuickPickParameters<AccessPermissionPickItem>
        >({
            items: items,
            title: state.title,
            step: state.step++,
            totalSteps: state.totalSteps,
            placeholder: '<必选>请选择博文访问权限',
            activeItems: <AccessPermissionPickItem[]>(
                [items.find(x => x.id === configuredPost.accessPermission)].filter(x => !!x)
            ),
            buttons: [],
            canSelectMany: false,
            shouldResume: () => Promise.resolve(false),
        })
        if (items.includes(picked)) configuredPost.accessPermission = picked.id

        return calculateNextStep()
    }
    // 分类
    const inputCategory = async (input: MultiStepInput) => {
        calculateStepNumber('categoryIds')
        let categories: PostCategories = []
        try {
            categories = await postCategoryService.listCategories()
        } catch (err) {
            Alert.err(err instanceof Error ? err.message : JSON.stringify(err))
            // 取消
            throw InputFlowAction.cancel
        }
        const items = CategoryPickItem.fromPostCategories(categories)
        const picked = await input.showQuickPick({
            items: items,
            title: state.title,
            step: state.step++,
            totalSteps: state.totalSteps,
            placeholder: '<非必选>请选择博文分类',
            activeItems: items.filter(x => configuredPost.categoryIds?.includes(x.id)),
            buttons: [],
            canSelectMany: true,
            shouldResume: () => Promise.resolve(false),
        })
        if (Array.isArray(picked)) configuredPost.categoryIds = picked.map(p => (p as CategoryPickItem).id)

        return calculateNextStep()
    }
    // 标签
    const inputTags = async (input: MultiStepInput) => {
        calculateStepNumber('tags')
        const value = await input.showInputBox({
            title: state.title,
            step: state.step++,
            totalSteps: state.totalSteps,
            placeHolder: '<非必填>请输入博文标签, 以 ","分隔',
            shouldResume: () => Promise.resolve(false),
            prompt: '请输入博文标签, 以 ","分隔',
            validateInput: () => Promise.resolve(undefined),
            value: configuredPost.tags?.join(',') ?? '',
        })
        configuredPost.tags = parseTagNames(value)
        return calculateNextStep()
    }
    // 摘要
    const inputDescription = async (input: MultiStepInput) => {
        calculateStepNumber('description')
        const value = await input.showInputBox({
            title: state.title,
            step: state.step++,
            totalSteps: state.totalSteps,
            placeHolder: '<非必填>请输入博文摘要',
            buttons: undefined,
            shouldResume: () => Promise.resolve(false),
            prompt: '请输入博文摘要',
            validateInput: () => Promise.resolve(undefined),
            value: configuredPost.description ?? '',
        })
        configuredPost.description = value ?? ''
        return calculateNextStep()
    }
    // 密码保护
    const inputPassword = async (input: MultiStepInput) => {
        calculateStepNumber('password')
        const value = await input.showInputBox({
            title: state.title,
            step: state.step++,
            totalSteps: state.totalSteps,
            placeHolder: '<非必填>设置博文访问密码',
            shouldResume: () => Promise.resolve(false),
            prompt: '设置博文访问密码',
            validateInput: () => Promise.resolve(undefined),
            value: configuredPost.password ?? '',
            password: true,
        })
        configuredPost.password = value ?? ''
        return calculateNextStep()
    }
    // 是否发布
    const inputIsPublished = async (input: MultiStepInput) => {
        calculateStepNumber('isPublished')
        const items = [{ label: '是' } as QuickPickItem, { label: '否' } as QuickPickItem]
        const picked = await input.showQuickPick({
            items: items,
            title: state.title,
            step: state.step++,
            totalSteps: state.totalSteps,
            placeholder: '<必选>是否发布',
            activeItems: configuredPost.isPublished ? [items[0]] : [items[1]],
            buttons: [],
            canSelectMany: false,
            shouldResume: () => Promise.resolve(false),
        })
        if (picked) configuredPost.isPublished = picked === items[0]

        return calculateNextStep()
    }
    map = [
        ['accessPermission', inputAccessPermission],
        ['categoryIds', inputCategory],
        ['password', inputPassword],
        ['description', inputDescription],
        ['tags', inputTags],
        ['isPublished', inputIsPublished],
    ]

    const nextStep = calculateNextStep()
    return nextStep
        ? MultiStepInput.run(nextStep).then(() => (state.step - 1 === state.totalSteps ? configuredPost : undefined))
        : Promise.resolve(undefined)
}
