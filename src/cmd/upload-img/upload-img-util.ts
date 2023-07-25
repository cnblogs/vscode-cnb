import { env, MessageOptions, SnippetString, window } from 'vscode'
import { fmtImgLink } from '@/infra/fmt-img-link'
import { Alert } from '@/service/alert'

/**
 * 显示上传成功对话框, 支持复制不同格式的图片链接
 *
 * @param {string} imgLink
 */
export async function showUploadSuccessModel(imgLink: string) {
    const copyOptions = ['复制链接', '复制链接(markdown)', '复制链接(html)']
    const option = await Alert.info(
        '上传图片成功',
        {
            modal: true,
            detail: `🔗图片链接: ${imgLink}`,
        } as MessageOptions,
        ...copyOptions
    )

    let newImgLink
    switch (option) {
        case copyOptions[0]:
            newImgLink = imgLink
            break
        case copyOptions[1]:
            newImgLink = fmtImgLink(imgLink, 'markdown')
            break
        case copyOptions[2]:
            newImgLink = fmtImgLink(imgLink, 'html')
            break
    }
    if (newImgLink) await env.clipboard.writeText(newImgLink)
}

export const insertImgLinkToActiveEditor = async (imgLink: string): Promise<boolean> => {
    const activeEditor = window.activeTextEditor
    if (activeEditor) {
        await activeEditor.insertSnippet(new SnippetString(fmtImgLink(imgLink, 'markdown')))
        return true
    }

    return false
}
