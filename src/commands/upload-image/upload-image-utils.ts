import { env, MessageOptions, SnippetString, window } from 'vscode';
import { formatImageLink } from '../../utils/format-image-link';

/**
 * 显示上传成功对话框, 支持复制不同格式的图片链接
 *
 * @param {string} imgLink
 * @returns {*}  {Promise<void>}
 */
export const showUploadSuccessModel = async (imgLink: string): Promise<void> => {
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

export const insertImageLinkToActiveEditor = async (imageLink: string): Promise<boolean> => {
    const activeEditor = window.activeTextEditor;
    if (activeEditor) {
        await activeEditor.insertSnippet(new SnippetString(formatImageLink(imageLink, 'markdown')));
        return true;
    }

    return false;
};
