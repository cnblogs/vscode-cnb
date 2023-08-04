import { Alert } from '@/infra/alert'
import { uploadClipboardImg } from './upload-clipboard-img'
import { showUploadSuccessModel } from './upload-img-util'
import { uploadFsImage } from './upload-fs-img'

export async function uploadImg() {
    const options = ['本地图片', '剪贴板图片']
    const selected = await Alert.info(
        '上传图片到博客园',
        {
            modal: true,
            detail: '选择图片来源',
        },
        ...options
    )
    if (selected === undefined) return

    let imageUrl: string | undefined

    try {
        if (selected === options[0]) imageUrl = await uploadFsImage()
        else if (selected === options[1]) imageUrl = await uploadClipboardImg()

        if (imageUrl === undefined) return

        await showUploadSuccessModel(imageUrl)

        return imageUrl
    } catch (e) {
        void Alert.err(`上传图片失败: ${<string>e}`)
    }
}
