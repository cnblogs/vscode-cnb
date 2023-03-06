import { Settings } from '@/services/settings.service';
import { workspace, WorkspaceConfiguration } from 'vscode';

describe('Settings', () => {
    let mockSetWorkspaceUri: jest.Mock<any, any, any>;
    let mockedWorkspace: jest.MockedObjectDeep<typeof workspace>;

    beforeEach(() => {
        mockedWorkspace = jest.mocked(workspace);

        mockSetWorkspaceUri = jest.fn().mockReturnValue(Promise.resolve());
        Settings.setWorkspaceUri = mockSetWorkspaceUri;
    });

    it('should adapt old configured workspace uri', async () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const mockedConfiguration = {
            get: jest.fn().mockReturnValue('path/fake'),
            update: jest.fn().mockReturnValue(Promise.resolve()),
        } as Partial<WorkspaceConfiguration>;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        mockedWorkspace.getConfiguration.mockReturnValue(mockedConfiguration as any);

        console.log(Settings.workspaceUri);
        // eslint-disable-next-line @typescript-eslint/unbound-method
        await new Promise(process.nextTick);

        // old workspace configuration should be removed
        expect(mockedConfiguration.update).toHaveBeenCalled();
        // old workspace configuration should be saved to new place
        expect(mockSetWorkspaceUri).toHaveBeenCalled();

        expect(mockedConfiguration.get).toHaveBeenCalled();
    });
});
