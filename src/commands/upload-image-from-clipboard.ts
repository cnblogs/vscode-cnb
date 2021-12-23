import * as fs from 'fs';
import { env, MessageOptions, SnippetString, Uri, window, workspace } from 'vscode';
import { AlertService } from '../services/alert.service';
import { imageService } from '../services/image.service';
import { formatImageLink } from '../utils/format-image-link';
import getClipboardImage from '../utils/get-clipboard-image';

const noImagePath = 'no image';

/**
 * 显示上传成功对话框, 支持复制不同格式的图片链接
 *
 * @param {string} imgLink
 * @returns {*}  {Promise<void>}
 */
const showUploadSuccessModel = async (imgLink: string): Promise<void> => {
    const copyOptions = ['复制链接', '复制链接(markdown)', '复制链接(html)'];
    const option = await window.showInformationMessage(
        '上传图片成功',
        {
            modal: true,
            detail: `🔗图片链接: ${imgLink}`,
        } as MessageOptions,
        ...copyOptions
    );
    let formattedImageLink = '';
    switch (option) {
        case copyOptions[0]:
            formattedImageLink = imgLink;
            break;
        case copyOptions[1]:
            formattedImageLink = formatImageLink(imgLink, 'markdown');
            break;
        case copyOptions[2]:
            formattedImageLink = formatImageLink(imgLink, 'html');
            break;
    }
    if (formattedImageLink) {
        env.clipboard.writeText(formattedImageLink);
    }
};

export const uploadImageFromClipboard = async () => {
    const clipboardImage = await getClipboardImage();
    if (clipboardImage.imgPath === noImagePath) {
        AlertService.warning('剪贴板中没有找到图片');
        return;
    }

    try {
        const imgUri = await imageService.upload(fs.createReadStream(clipboardImage.imgPath));
        const activeEditor = window.activeTextEditor;
        if (activeEditor) {
            await activeEditor.insertSnippet(new SnippetString(formatImageLink(imgUri, 'markdown')));
        } else {
            await showUploadSuccessModel(imgUri);
        }
    } finally {
        if (!clipboardImage.shouldKeepAfterUploading) {
            workspace.fs.delete(Uri.file(clipboardImage.imgPath));
        }
    }
};
