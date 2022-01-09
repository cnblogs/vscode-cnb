import { ProgressLocation, window } from 'vscode';
import { imageService } from '../../services/image.service';
import * as fs from 'fs';
import { insertImageLinkToActiveEditor, showUploadSuccessModel } from './upload-image-utils';

export const uploadLocalDiskImage = async () => {
    const imageFileUri = ((await window.showOpenDialog({
        title: '选择要上传的图片(图片最大不能超过20M)',
        canSelectMany: false,
        canSelectFolders: false,
        filters: {
            images: ['png', 'jpg', 'bmp', 'jpeg', 'webp', 'svg', 'gif'],
        },
    })) ?? [])[0];
    if (!imageFileUri) {
        return;
    }
    const imageFilePath = imageFileUri.fsPath;
    const imageLink = await window.withProgress(
        {
            title: '正在上传图片',
            location: ProgressLocation.Notification,
        },
        async p => {
            p.report({
                increment: 10,
            });
            const readStream = fs.createReadStream(imageFilePath);
            try {
                return await imageService.upload(readStream);
            } finally {
                p.report({
                    increment: 100,
                });
            }
        }
    );
    if (!(await insertImageLinkToActiveEditor(imageLink))) {
        await showUploadSuccessModel(imageLink);
    }
};
