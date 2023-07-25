import fs from 'fs'
import { ProgressLocation, Uri, window, workspace } from 'vscode'
import { Alert } from '@/infra/alert'
import { ImgService } from '@/service/img'
import getClipboardImage from '@/infra/get-clipboard-img'

const noImagePath = 'no image'

export const uploadImgFromClipboard = async () => {
    const clipboardImage = await getClipboardImage()
    if (clipboardImage.imgPath === noImagePath) {
        void Alert.warn('剪贴板中没有找到图片')
        return
    }

    try {
        return await window.withProgress({ title: '正在上传图片', location: ProgressLocation.Notification }, p => {
            p.report({ increment: 10 })
            return ImgService.upload(fs.createReadStream(clipboardImage.imgPath))
        })
    } finally {
        if (!clipboardImage.shouldKeepAfterUploading) await workspace.fs.delete(Uri.file(clipboardImage.imgPath))
    }
}
