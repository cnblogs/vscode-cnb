export namespace webviewCommand {
    export enum UiCommands {
        editPostConfiguration = 'editPostConfiguration',
        showErrorResponse = 'showErrorResponse',
        updateBreadcrumbs = 'updateBreadcrumbs',
        updateImageUploadStatus = 'updateImageUploadStatus',
        setFluentIconBaseUrl = 'setFluentIconBaseUrl',
    }

    export enum ExtensionCommands {
        savePost = 'savePost',
        disposePanel = 'disposePanel',
        uploadImage = 'uploadImage',
    }
}
