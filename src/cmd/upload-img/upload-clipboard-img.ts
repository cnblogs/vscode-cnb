import fs from 'fs'
import { ProgressLocation, Uri, window, workspace } from 'vscode'
import { Alert } from '@/infra/alert'
import { ImgService } from '@/service/img'
import getClipboardImage from '@/infra/get-clipboard-img'

const noImagePath = 'no image'

export async function uploadClipboardImg() {
    const clipboardImage = await getClipboardImage()

    if (clipboardImage.imgPath === noImagePath) {
        void Alert.warn('剪贴板中没有找到图片')
        return
    }

    return window.withProgress({ title: '正在上传图片', location: ProgressLocation.Notification }, async p => {
        p.report({ increment: 20 })
        const stream = fs.createReadStream(clipboardImage.imgPath)
        p.report({ increment: 60 })
        const result = await ImgService.upload(stream)
        p.report({ increment: 80 })
        if (!clipboardImage.shouldKeepAfterUploading) {
            const url = Uri.file(clipboardImage.imgPath)
            await workspace.fs.delete(url)
        }
        p.report({ increment: 100 })
        return result
    })
}
