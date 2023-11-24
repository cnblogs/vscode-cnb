import { ProgressLocation, window } from 'vscode'
import { uploadImgFromPath } from '@/cmd/upload-img/upload-img-from-path'

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

    const path = uriList[0].fsPath

    return window.withProgress(
        {
            title: '正在上传图片',
            location: ProgressLocation.Notification,
        },
        async p => {
            p.report({ increment: 30 })
            const url = await uploadImgFromPath(path)
            p.report({ increment: 100 })
            return url
        }
    )
}
