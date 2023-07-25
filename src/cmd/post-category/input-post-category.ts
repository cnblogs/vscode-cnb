import { QuickPickItem } from 'vscode'
import { PostCategory, PostCategoryAddDto } from '@/model/post-category'
import { InputStep, MultiStepInput } from '@/service/multi-step-input'

class InputOption {
    title = '编辑分类'
    category?: PostCategory
    steps: PostCategoryInputStep[] = defaultSteps
}

const defaultSteps: PostCategoryInputStep[] = ['title', 'description', 'visible']

export type PostCategoryInputStep = keyof PostCategoryAddDto

export const inputPostCategory = ({
    title,
    category,
    steps = defaultSteps,
}: Partial<InputOption>): Promise<PostCategoryAddDto | undefined> => {
    title = title ? title : '编辑分类'
    const result: PostCategoryAddDto = {
        title: '',
        visible: false,
        description: '',
    }
    const state = {
        totalSteps: steps.length,
        step: 1,
    }
    const calculateNextStep = () =>
        state.step > steps.length ? undefined : inputStepToActionDict.find(x => x[0] === steps[state.step - 1])?.[1]
    const calculateStepNumber = (type: PostCategoryInputStep) => {
        state.step = steps.findIndex(x => x === type) + 1
    }

    const inputCategoryTitle = async (input: MultiStepInput): Promise<void | InputStep> => {
        calculateStepNumber('title')
        const categoryTitle = await input.showInputBox({
            title: `分类标题 - ${title}`,
            value: category?.title ?? '',
            step: state.step++,
            totalSteps: state.totalSteps,
            placeHolder: '<必填>请输入分类标题',
            validateInput: value => Promise.resolve(value ? undefined : '请输入分类标题'),
            shouldResume: () => Promise.resolve(false),
        })
        result.title = categoryTitle ?? ''

        return calculateNextStep()
    }
    const inputCategoryVisible = async (input: MultiStepInput): Promise<void | InputStep> => {
        calculateStepNumber('visible')

        const items: QuickPickItem[] = [
            {
                label: '是',
            },
            {
                label: '否',
            },
        ]
        let selectedItem = category?.visible ?? true ? items[0] : items[1]
        selectedItem = (await input.showQuickPick({
            step: state.step++,
            totalSteps: state.totalSteps,
            shouldResume: () => Promise.resolve(false),
            title: `分类是否可见 - ${title}`,
            placeholder: '',
            items: items,
            canSelectMany: false,
            activeItems: [selectedItem],
        })) as QuickPickItem
        result.visible = selectedItem === items[0]

        return calculateNextStep()
    }
    const inputCategoryDescription = async (input: MultiStepInput): Promise<void | InputStep> => {
        calculateStepNumber('description')
        const categoryTitle = await input.showInputBox({
            title: `分类描述 - ${title}`,
            value: category?.description ?? '',
            step: state.step++,
            totalSteps: state.totalSteps,
            placeHolder: '<选填>请输入分类描述',
            validateInput: () => Promise.resolve(undefined),
            shouldResume: () => Promise.resolve(false),
        })
        result.description = categoryTitle ?? ''

        return calculateNextStep()
    }

    const inputStepToActionDict: [PostCategoryInputStep, InputStep][] = [
        ['title', inputCategoryTitle],
        ['description', inputCategoryDescription],
        ['visible', inputCategoryVisible],
    ]

    return Promise.resolve(calculateNextStep())
        .then(nextStep => (nextStep ? MultiStepInput.run(nextStep) : Promise.reject()))
        .catch()
        .then(() => (state.step - 1 === state.totalSteps ? result : undefined))
}
