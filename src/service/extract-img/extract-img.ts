import { ProgressLocation, window } from 'vscode'
import { ImgSrc } from '@/service/extract-img/get-replace-list'
import { Alert } from '@/infra/alert'
import { findImgLink } from '@/service/extract-img/find-img-link'
import { getReplaceList } from '@/service/extract-img/get-replace-list'
import { applyReplaceList } from '@/service/extract-img/apply-replace-list'

export async function extractImg(text: string, fileDir: string, inputImgSrc?: ImgSrc) {
    let imgInfoList = findImgLink(text)

    if (imgInfoList.length <= 0) {
        if (inputImgSrc === undefined) void Alert.info('没有找到可以提取的图片')
        return
    }

    const webImgCount = imgInfoList.filter(i => i.src === ImgSrc.web).length
    const dataUrlImgCount = imgInfoList.filter(i => i.src === ImgSrc.dataUrl).length
    const fsImgCount = imgInfoList.filter(i => i.src === ImgSrc.fs).length

    const options = [
        { title: '提取全部', src: ImgSrc.any },
        { title: '取消', src: undefined, isCloseAffordance: true },
    ]
    const detail = ['共找到:']

    if (webImgCount > 0) {
        options.push({ title: '提取网络图片', src: ImgSrc.web })
        detail.push(`${webImgCount} 张可以提取的网络图片`)
    }
    if (dataUrlImgCount > 0) {
        options.push({ title: '提取 Data Url 图片', src: ImgSrc.dataUrl })
        detail.push(`${dataUrlImgCount} 张可以提取的 Data Url 图片`)
    }
    if (fsImgCount > 0) {
        options.push({ title: '提取本地图片', src: ImgSrc.fs })
        detail.push(`${fsImgCount} 张可以提取的本地图片`)
    }

    let selectedSrc: ImgSrc | undefined

    if (inputImgSrc !== undefined) {
        selectedSrc = inputImgSrc
    } else {
        // if src is not specified:
        const selected = await Alert.info(
            '要提取哪些图片? 此操作会替换源文件中的图片链接!',
            {
                modal: true,
                detail: detail.join('\n'),
            },
            ...options
        )
        selectedSrc = selected?.src
    }

    if (selectedSrc === undefined) return
    if (selectedSrc !== ImgSrc.any) imgInfoList = imgInfoList.filter(i => i.src === selectedSrc)

    const replaceList = await window.withProgress(
        {
            title: '提取图片',
            location: ProgressLocation.Notification,
        },
        p =>
            getReplaceList(fileDir, imgInfoList, oldData =>
                p.report({
                    message: `正在提取: ${oldData}`,
                })
            )
    )

    const replaceListLen = replaceList.length

    return window.withProgress(
        {
            title: '替换连接',
            location: ProgressLocation.Notification,
        },
        p => {
            let i = 1
            const extracted = applyReplaceList(text, replaceList, oldData => {
                p.report({
                    increment: (i / replaceListLen) * 20 + 80,
                    message: `正在替换: ${oldData}`,
                })
                i += 1
            })
            return Promise.resolve(extracted)
        }
    )
}
