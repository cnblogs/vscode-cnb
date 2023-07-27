import { ProgressLocation, window } from 'vscode'
import { ImgService } from '@/service/img'
import fs from 'fs'

export async function uploadFsImage() {
    const uriList = await window.showOpenDialog({
        title: '选择要上传的图片(图片最大不能超过20M)',
        canSelectMany: false,
        canSelectFolders: false,
        filters: {
            images: ['png', 'jpg', 'bmp', 'jpeg', 'webp', 'svg', 'gif'],
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
            p.report({
                increment: 10,
            })
            const readStream = fs.createReadStream(imageFilePath)
            try {
                return await ImgService.upload(readStream)
            } finally {
                p.report({
                    increment: 100,
                })
            }
        }
    )
}
