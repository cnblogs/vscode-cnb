import { Alert } from '@/services/alert'
import { window } from 'vscode'
import { uploadImageFromClipboard } from './upload-clipboard-image'
import { insertImageLinkToActiveEditor, showUploadSuccessModel } from './upload-image-utils'
import { uploadLocalDiskImage } from './upload-local-disk-image'

export const uploadImage = async (autoInsertToActiveEditor = true, from?: 'local' | 'clipboard') => {
    const options = ['本地图片文件', '剪贴板图片']
    const selected = !from
        ? await Alert.info(
              '上传图片到博客园',
              {
                  modal: true,
                  detail: '选择图片来源',
              },
              ...options
          )
        : from

    let imageUrl: string | undefined
    const caughtFailedUpload = (e: unknown) =>
        void Alert.httpErr(typeof e === 'object' && e != null ? e : {}, { message: '上传图片失败' })
    switch (selected) {
        case 'local':
        case options[0]:
            imageUrl = await uploadLocalDiskImage().catch(caughtFailedUpload)
            break
        case 'clipboard':
        case options[1]:
            imageUrl = await uploadImageFromClipboard().catch(caughtFailedUpload)
            break
        default:
            break
    }

    if (imageUrl && autoInsertToActiveEditor)
        if (!(await insertImageLinkToActiveEditor(imageUrl))) await showUploadSuccessModel(imageUrl)

    return imageUrl
}
