export namespace webviewCommand {
    export enum UiCommands {
        editPostConfiguration = 'editPostConfiguration',
        showErrorResponse = 'showErrorResponse',
        updateBreadcrumbs = 'updateBreadcrumbs',
        updateImageUploadStatus = 'updateImageUploadStatus',
        setFluentIconBaseUrl = 'setFluentIconBaseUrl',
        changeTheme = 'changeTheme',
    }

    export enum ExtensionCommands {
        savePost = 'savePost',
        disposePanel = 'disposePanel',
        uploadImage = 'uploadImage',
    }

    export const ingCommands = {
        extensionCommands: { listIngs: 'listIngs' },
        uiCommands: { updateIngsList: 'updateIngsList' },
    };
}
