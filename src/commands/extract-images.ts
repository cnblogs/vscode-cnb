import { MessageItem, MessageOptions, ProgressLocation, Range, Uri, window, workspace, WorkspaceEdit } from 'vscode'
import { ImageSrc, MarkdownImagesExtractor, ImageInfo, newImageSrcFilter } from '@/services/images-extractor.service'

type ExtractOption = MessageItem & Partial<{ imageSrc: ImageSrc }>
const extractOptions: readonly ExtractOption[] = [
    { title: '提取本地图片', imageSrc: ImageSrc.local },
    { title: '提取网络图片', imageSrc: ImageSrc.web },
    { title: '提取全部', imageSrc: ImageSrc.any },
    { title: '取消', imageSrc: undefined, isCloseAffordance: true },
]

export async function extractImages(arg: unknown, inputImageSrc: ImageSrc | undefined) {
    if (!(arg instanceof Uri && arg.scheme === 'file')) return

    const editor = window.visibleTextEditors.find(x => x.document.fileName === arg.fsPath)
    const textDocument = editor?.document ?? workspace.textDocuments.find(x => x.fileName === arg.fsPath)

    if (!textDocument) return
    await textDocument.save()

    const markdown = (await workspace.fs.readFile(arg)).toString()
    const extractor = new MarkdownImagesExtractor(markdown, arg)

    const images = extractor.findImages()
    if (images.length <= 0)
        void (!inputImageSrc != null ? window.showWarningMessage('没有找到可以提取的图片') : undefined)

    const availableWebImagesCount = images.filter(newImageSrcFilter(ImageSrc.web)).length
    const availableLocalImagesCount = images.filter(newImageSrcFilter(ImageSrc.local)).length
    const result =
        extractOptions.find(x => inputImageSrc != null && x.imageSrc === inputImageSrc) ??
        (await window.showInformationMessage<ExtractOption>(
            '要提取哪些图片? 此操作会替换源文件中的图片链接!',
            {
                modal: true,
                detail:
                    `共找到 ${availableWebImagesCount} 张可以提取的网络图片\n` +
                    `${availableLocalImagesCount} 张可以提取的本地图片`,
            } as MessageOptions,
            ...extractOptions
        ))

    if (!(result && result.imageSrc !== undefined)) return

    extractor.imageSrc = result.imageSrc

    const failedImages = await window.withProgress(
        { title: '提取图片', location: ProgressLocation.Notification },
        async progress => {
            extractor.onProgress = (idx, images) => {
                const total = images.length
                const image = images[idx]
                progress.report({
                    increment: (idx / total) * 80,
                    message: `[${idx + 1} / ${total}] 正在提取 ${image.link}`,
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
                    const startPos = textDocument.positionAt(src.startOffset)
                    const endPos = textDocument.positionAt(
                        src.startOffset + src.prefix.length + src.link.length + src.postfix.length
                    )
                    const range = new Range(startPos, endPos)

                    const ret: [Range, ImageInfo] = [range, dst]
                    return ret
                })
                .reduce((we, [range, dst]) => {
                    if (range) {
                        progress.report({
                            increment: (idx / extractedLen) * 20 + 80,
                            message: `[${idx + 1} / ${extractedLen}] 正在替换图片链接 ${dst.link}`,
                        })
                        const newText = dst.prefix + dst.link + dst.postfix
                        we.replace(textDocument.uri, range, newText, {
                            needsConfirmation: false,
                            label: dst.link,
                        })
                    }

                    return we
                }, new WorkspaceEdit())

            await workspace.applyEdit(we)
            await textDocument.save()
            return extracted.filter(([, dst]) => dst === null).map(([src]) => src)
        }
    )

    if (failedImages && failedImages.length > 0) {
        const info = failedImages
            .map(x => [x.link, extractor.errors.find(([link]) => link === x.link)?.[1] ?? ''].join(','))
            .join('\n')
        window.showErrorMessage(`${failedImages.length}张图片提取失败: ${info}`).then(undefined, console.warn)
    }
}
