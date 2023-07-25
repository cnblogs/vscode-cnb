import { MessageItem, MessageOptions, ProgressLocation, Range, Uri, window, workspace, WorkspaceEdit } from 'vscode'
import { ImageInfo, ImageSrc, MkdImgExtractor, newImageSrcFilter } from '@/service/mkd-img-extractor'
import { Alert } from '@/service/alert'

type ExtractOption = MessageItem & Partial<{ imageSrc: ImageSrc }>

export async function extractImages(arg: unknown, inputImageSrc?: ImageSrc) {
    if (!(arg instanceof Uri && arg.scheme === 'file')) return

    const editor = window.visibleTextEditors.find(x => x.document.fileName === arg.fsPath)
    const textDocument = editor?.document ?? workspace.textDocuments.find(x => x.fileName === arg.fsPath)

    if (!textDocument) return
    await textDocument.save()

    const markdown = (await workspace.fs.readFile(arg)).toString()
    const extractor = new MkdImgExtractor(markdown, arg)

    const images = extractor.findImages()
    if (images.length <= 0) {
        if (inputImageSrc !== undefined) void Alert.info('没有找到可以提取的图片')
        return
    }

    const webImgCount = images.filter(newImageSrcFilter(ImageSrc.web)).length
    const dataUrlImgCount = images.filter(newImageSrcFilter(ImageSrc.dataUrl)).length
    const fsImgCount = images.filter(newImageSrcFilter(ImageSrc.fs)).length

    const displayOptions: ExtractOption[] = [
        { title: '提取全部', imageSrc: ImageSrc.any },
        { title: '提取网络图片', imageSrc: ImageSrc.web },
        { title: '提取 Data Url 图片', imageSrc: ImageSrc.dataUrl },
        { title: '提取本地图片', imageSrc: ImageSrc.fs },
        { title: '取消', imageSrc: undefined, isCloseAffordance: true },
    ]

    let selectedSrc

    if (inputImageSrc !== undefined) {
        selectedSrc = displayOptions.find(ent => ent.imageSrc === inputImageSrc)?.imageSrc
    } else {
        // if src is not specified:
        const selectedOption = await Alert.info<ExtractOption>(
            '要提取哪些图片? 此操作会替换源文件中的图片链接!',
            {
                modal: true,
                detail:
                    '共找到:\n' +
                    `${webImgCount} 张可以提取的网络图片\n` +
                    `${dataUrlImgCount} 张可以提取的 Data Url 图片\n` +
                    `${fsImgCount} 张可以提取的本地图片`,
            } as MessageOptions,
            ...displayOptions
        )
        selectedSrc = selectedOption?.imageSrc
    }

    if (selectedSrc === undefined) return

    extractor.imageSrc = selectedSrc

    const failedImages = await window.withProgress(
        { title: '正在提取图片', location: ProgressLocation.Notification },
        async progress => {
            extractor.onProgress = (count, info) => {
                const total = info.length
                const image = info[count]
                progress.report({
                    increment: (count / total) * 80,
                    message: `[${count + 1} / ${total}] 正在提取 ${image.data}`,
                })
            }

            const extracted = await extractor.extract()
            const extractedLen = extracted.length
            const idx = 0

            const we = extracted
                .filter(([, dst]) => dst != null)
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                .map(([src, dst]) => [src, dst!])
                .map(([src, dst]) => {
                    const posL = textDocument.positionAt(src.startOffset)
                    const posR = textDocument.positionAt(
                        src.startOffset + src.prefix.length + src.data.length + src.postfix.length
                    )
                    const range = new Range(posL, posR)

                    // just for ts type inferring
                    const ret: [Range, ImageInfo] = [range, dst]
                    return ret
                })
                .reduce((we, [range, dst]) => {
                    if (range) {
                        progress.report({
                            increment: (idx / extractedLen) * 20 + 80,
                            message: `[${idx + 1} / ${extractedLen}] 正在替换图片链接 ${dst.data}`,
                        })
                        const newText = dst.prefix + dst.data + dst.postfix
                        we.replace(textDocument.uri, range, newText, {
                            needsConfirmation: false,
                            label: dst.data,
                        })
                    }

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
