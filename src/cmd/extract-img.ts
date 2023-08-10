import { MessageOptions, ProgressLocation, Range, Uri, window, workspace, WorkspaceEdit } from 'vscode'
import { ImgInfo, ImgSrc, MkdImgExtractor } from '@/markdown/mkd-img-extractor'
import { Alert } from '@/infra/alert'
import { findImgLink } from '@/infra/filter/find-img-link'

export async function extractImg(arg: unknown, inputImgSrc?: ImgSrc) {
    if (!(arg instanceof Uri && arg.scheme === 'file')) return

    const editor = window.visibleTextEditors.find(x => x.document.fileName === arg.fsPath)
    const textDocument = editor?.document ?? workspace.textDocuments.find(x => x.fileName === arg.fsPath)

    if (textDocument === undefined) return
    await textDocument.save()

    const markdown = (await workspace.fs.readFile(arg)).toString()
    let imgInfoList = findImgLink(markdown)

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
            } as MessageOptions,
            ...options
        )
        selectedSrc = selected?.src
    }

    if (selectedSrc === undefined) return
    if (selectedSrc !== ImgSrc.any) imgInfoList = imgInfoList.filter(i => i.src === selectedSrc)

    const extractor = new MkdImgExtractor(arg)

    const failedImages = await window.withProgress(
        { title: '正在提取图片', location: ProgressLocation.Notification },
        async progress => {
            extractor.onProgress = (count, info) => {
                const total = info.length
                const image = info[count]
                progress.report({
                    increment: (count / total) * 50,
                    message: `[${count + 1} / ${total}] 正在提取 ${image.data}`,
                })
            }

            const extracted = await extractor.extract(imgInfoList)
            const extractedLen = extracted.length

            const we = extracted
                .filter(([, dst]) => dst != null)
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                .map(([src, dst]) => [src, dst!])
                .map(([src, dst], i) => {
                    const posL = textDocument.positionAt(src.offset)
                    const posR = textDocument.positionAt(src.offset + src.data.length)
                    const range = new Range(posL, posR)

                    // just for ts type inferring
                    const ret: [Range, ImgInfo, number] = [range, dst, i]
                    return ret
                })
                .reduce((we, [range, dst, i]) => {
                    progress.report({
                        increment: (i / extractedLen) * 20 + 80,
                        message: `正在替换图片链接 ${dst.data}`,
                    })
                    const newText = dst.data
                    we.replace(textDocument.uri, range, newText, {
                        needsConfirmation: false,
                        label: dst.data,
                    })

                    return we
                }, new WorkspaceEdit())

            await workspace.applyEdit(we)
            await textDocument.save()
            return extracted.filter(([, dst]) => dst === null).map(([src]) => src)
        }
    )

    if (failedImages.length > 0) {
        const info = failedImages
            .map(info => [info.data, extractor.errors.find(([link]) => link === info.data)?.[1] ?? ''].join(','))
            .join('\n')
        Alert.err(`${failedImages.length} 张图片提取失败: ${info}`).then(undefined, console.warn)
    }
}
