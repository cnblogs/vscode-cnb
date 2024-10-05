import { Alert } from '@/infra/alert'
import { imageService } from '@/service/upload-img/image.service'
import fs from 'fs'

export function uploadImgFromPath(path: string) {
    try {
        const readStream = fs.createReadStream(path)
        return imageService.upload(readStream)
    } catch (e) {
        console.log(`上传图片失败: ${<string>e}`)
        void Alert.err(`上传图片失败: ${<string>e}`)
    }
}
