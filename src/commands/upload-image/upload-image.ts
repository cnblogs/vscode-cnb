import { MessageOptions, window } from 'vscode';
import { uploadImageFromClipboard } from './upload-clipboard-image';
import { uploadLocalDiskImage } from './upload-local-disk-image';

export const uploadImage = async () => {
    const options = ['本地图片文件', '剪贴板图片'];
    const selected = await window.showInformationMessage(
        '上传图片到博客园',
        {
            modal: true,
            detail: '选择图片来源',
        } as MessageOptions,
        ...options
    );

    switch (selected) {
        case options[0]:
            uploadLocalDiskImage();
            break;
        case options[1]:
            uploadImageFromClipboard();
            break;
        default:
            break;
    }
};
