import { QuickPickItem } from 'vscode';
import { AccessPermission, BlogPost } from '../models/blog-post';
import { PostCategories, PostCategory } from '../models/post-category';
import { AlertService } from '../services/alert.service';
import { InputFlowAction, InputStep, MultiStepInput, QuickPickParameters } from '../services/multi-step-input';
import { postCategoryService } from '../services/post-category.service';

class CategoryPickItem implements QuickPickItem {
    label: string;
    description?: string | undefined;
    detail?: string | undefined;
    picked?: boolean | undefined;
    alwaysShow?: boolean | undefined;

    constructor(name: string, public id: number) {
        this.label = name;
    }

    static fromPostCategory(category: PostCategory): CategoryPickItem {
        return new CategoryPickItem(category.title, category.categoryId);
    }

    static fromPostCategories(categories: PostCategories): CategoryPickItem[] {
        return categories.map(this.fromPostCategory);
    }
}

class AccessPermissionPickItem implements QuickPickItem {
    description?: string | undefined;
    detail?: string | undefined;
    picked?: boolean | undefined;
    alwaysShow?: boolean | undefined;

    constructor(public id: AccessPermission, public label: string) {}
}

type PostConfigurationType = 'categoryIds' | 'tags' | 'description' | 'password' | 'accessPermission';
type PostConfigureDto = Pick<BlogPost, PostConfigurationType>;

const defaultSteps: PostConfigurationType[] = ['accessPermission', 'description', 'categoryIds', 'tags', 'password'];

const parseTagNames = (value: string) => {
    return value.split(/[,，]/).filter(t => !!t);
};

export const inputPostConfiguration = async (
    source: PostConfigureDto,
    steps: PostConfigurationType[] = []
): Promise<PostConfigureDto | undefined> => {
    steps = steps?.length > 0 ? steps : defaultSteps;
    const configuredPost = Object.assign({}, source);
    const state = {
        title: '博文设置',
        totalSteps: steps.length,
        step: 1,
    };
    let map: [PostConfigurationType, (input: MultiStepInput) => Promise<any>][] = [];
    const calculateNextStep = (): void | InputStep =>
        state.step > steps.length ? undefined : map.find(x => x[0] === steps[state.step - 1])![1];
    const calculateStepNumber = (type: PostConfigurationType) => {
        state.step = steps.findIndex(x => x === type) + 1;
    };

    // 访问权限
    const inputAccessPermission = async (input: MultiStepInput) => {
        calculateStepNumber('accessPermission');
        const items = [
            new AccessPermissionPickItem(AccessPermission.undeclared, '公开'),
            new AccessPermissionPickItem(AccessPermission.authenticated, '仅登录用户'),
            new AccessPermissionPickItem(AccessPermission.owner, '只有我'),
        ];
        const picked = <AccessPermissionPickItem>await input.showQuickPick<
            AccessPermissionPickItem,
            QuickPickParameters<AccessPermissionPickItem>
        >({
            items: items,
            title: state.title,
            step: state.step++,
            totalSteps: state.totalSteps,
            placeholder: '<必选>请选择博文访问权限',
            activeItem: items.find(x => x.id === configuredPost.accessPermission),
            buttons: [],
            canSelectMany: false,
            shouldResume: () => Promise.resolve(false),
        });
        if (items.includes(picked)) {
            configuredPost.accessPermission = picked.id;
        }

        return calculateNextStep();
    };
    // 分类
    const inputCategory = async (input: MultiStepInput) => {
        calculateStepNumber('categoryIds');
        let categories: PostCategories = [];
        try {
            categories = await postCategoryService.fetchCategories();
        } catch (err) {
            AlertService.error(err instanceof Error ? err.message : JSON.stringify(err));
            // 取消
            throw InputFlowAction.cancel;
        }
        const items = CategoryPickItem.fromPostCategories(categories);
        const picked = await input.showQuickPick({
            items: items,
            title: state.title,
            step: state.step++,
            totalSteps: state.totalSteps,
            placeholder: '<非必选>请选择博文分类',
            activeItem: items[0],
            buttons: [],
            canSelectMany: true,
            shouldResume: () => Promise.resolve(false),
        });
        if (picked instanceof CategoryPickItem) {
            configuredPost.categoryIds = [picked.id];
        }
        return calculateNextStep();
    };
    // 标签
    const inputTags = async (input: MultiStepInput) => {
        calculateStepNumber('tags');
        let value = await input.showInputBox({
            title: state.title,
            step: state.step++,
            totalSteps: state.totalSteps,
            placeHolder: '<非必填>请输入博文标签, 以 ","分隔',
            buttons: [],
            shouldResume: () => Promise.resolve(false),
            prompt: '',
            validateInput: () => Promise.resolve(undefined),
            value: configuredPost.tags?.join(',') ?? '',
        });
        configuredPost.tags = parseTagNames(value);
        return calculateNextStep();
    };
    // 摘要
    const inputDescription = async (input: MultiStepInput) => {
        calculateStepNumber('description');
        let value = await input.showInputBox({
            title: state.title,
            step: state.step++,
            totalSteps: state.totalSteps,
            placeHolder: '<非必填>请输入博文摘要',
            buttons: [],
            shouldResume: () => Promise.resolve(false),
            prompt: '',
            validateInput: () => Promise.resolve(undefined),
            value: configuredPost.description ?? '',
        });
        configuredPost.description = value ?? '';
        return calculateNextStep();
    };
    // 密码保护
    const inputPassword = async (input: MultiStepInput) => {
        calculateStepNumber('password');
        let value = await input.showInputBox({
            title: state.title,
            step: state.step++,
            totalSteps: state.totalSteps,
            placeHolder: '<非必填>设置博文访问密码',
            buttons: [],
            shouldResume: () => Promise.resolve(false),
            prompt: '',
            validateInput: () => Promise.resolve(undefined),
            value: configuredPost.password ?? '',
            password: true,
        });
        configuredPost.password = value ?? '';
        return calculateNextStep();
    };
    map = [
        ['accessPermission', inputAccessPermission],
        ['categoryIds', inputCategory],
        ['password', inputPassword],
        ['description', inputDescription],
        ['tags', inputTags],
    ];

    await MultiStepInput.run(calculateNextStep()!);
    return state.step - 1 === state.totalSteps ? configuredPost : undefined;
};
