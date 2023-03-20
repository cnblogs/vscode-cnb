import { workspace } from 'vscode';

// eslint-disable-next-line @typescript-eslint/no-misused-promises
describe('isTargetWorkspace', () => {
    const testItems: [current: string, target: string, result: boolean][] = [
        ['c:/test', 'C:/test', true],
        ['C:/test', 'c:/test', true],
        ['c:/test', 'c:/test', true],
        ['D:/test', 'D:/test', true],
        ['c:/test', 'd:/test', false],
        ['d:/test', 'd:/test/', false],
    ];
    let mockSettings: jest.Mock<any, any, any>;

    beforeAll(() => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const actualGlobalContext = jest.requireActual('./global-state.ts').globalContext;
        Object.defineProperty(actualGlobalContext, 'extensionName', {
            get: jest.fn().mockReturnValue(''),
        });
        jest.mock('./global-state', () => ({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            globalContext: actualGlobalContext,
        }));

        jest.mock('os', () => ({ platform: jest.fn().mockReturnValue('win32') }));
        mockSettings = jest.fn();
        jest.mock('./settings.service', () => ({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Settings: mockSettings,
        }));
    });

    for (const item of testItems) {
        const [current, target, isInTargetWorkspace] = item;

        it(`should${isInTargetWorkspace ? '' : ' not'} in target workspace, ${current}, ${target}`, async () => {
            const mockedWorkspace = jest.mocked(workspace);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            mockedWorkspace.workspaceFolders = [{ name: '', uri: { path: current } }];

            (mockSettings as any).workspaceUri = { path: target };

            const { isTargetWorkspace } = await import('@/services/check-workspace');
            expect(isTargetWorkspace()).toStrictEqual(isInTargetWorkspace);
        });
    }
});
