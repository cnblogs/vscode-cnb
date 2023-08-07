import { ProgressLocation, window } from 'vscode'
import { ImgService } from '@/service/img'
import fs from 'fs'

export async function uploadFsImage() {
    const uriList = await window.showOpenDialog({
        title: '选择要上传的图片(图片不能超过20M)',
        canSelectMany: false,
        canSelectFolders: false,
        filters: {
            images: ['png', 'jpg', 'jpeg', 'bmp', 'webp', 'svg', 'gif'],
        },
    })
    if (uriList === undefined) return

    const imageFileUri = uriList[0]

    const imageFilePath = imageFileUri.fsPath
    return window.withProgress(
        {
            title: '正在上传图片',
            location: ProgressLocation.Notification,
        },
        async p => {
            p.report({ increment: 20 })
            const stream = fs.createReadStream(imageFilePath)
            p.report({ increment: 60 })
            const result = await ImgService.upload(stream)
            p.report({ increment: 100 })
            return result
        }
    )
}
