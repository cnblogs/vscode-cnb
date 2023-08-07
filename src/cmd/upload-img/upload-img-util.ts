import { env, MessageOptions, SnippetString, window } from 'vscode'
import { fmtImgLink } from '@/infra/fmt-img-link'
import { Alert } from '@/infra/alert'

/**
 * 显示上传成功对话框, 支持复制不同格式的图片链接
 *
 * @param {string} imgLink
 */
export async function showUploadSuccessModel(imgLink: string) {
    const options = ['复制链接', '复制链接(markdown)', '复制链接(html)']
    const selected = await Alert.info(
        '上传图片成功',
        {
            modal: true,
            detail: `图片链接: ${imgLink}`,
        } as MessageOptions,
        ...options
    )

    let text = null

    if (selected === options[0]) text = imgLink
    else if (selected === options[1]) text = fmtImgLink(imgLink, 'markdown')
    else if (selected === options[2]) text = fmtImgLink(imgLink, 'html')

    if (text !== null) await env.clipboard.writeText(text)
}

export async function insertImgLinkToActiveEditor(imgLink: string): Promise<boolean> {
    const activeEditor = window.activeTextEditor
    if (activeEditor) {
        await activeEditor.insertSnippet(new SnippetString(fmtImgLink(imgLink, 'markdown')))
        return true
    }

    return false
}
