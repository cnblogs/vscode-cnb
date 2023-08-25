import { ProgressLocation, Uri, window, workspace } from 'vscode'
import { Alert } from '@/infra/alert'
import getClipboardImage from '@/infra/get-clipboard-img'
import { uploadImgFromPath } from '@/cmd/upload-img/upload-img-from-path'

const noImagePath = 'no image'

export async function uploadClipboardImg() {
    const img = await getClipboardImage()

    if (img.imgPath === noImagePath) {
        void Alert.warn('剪贴板中没有找到图片')
        return
    }
    const path = img.imgPath
    const opt = {
        title: '正在上传图片',
        location: ProgressLocation.Notification,
    }

    return window.withProgress(opt, async p => {
        p.report({ increment: 30 })
        const url = await uploadImgFromPath(path)

        p.report({ increment: 80 })
        if (!img.shouldKeepAfterUploading) {
            const url = Uri.file(path)
            await workspace.fs.delete(url)
        }

        p.report({ increment: 100 })
        return url
    })
}
