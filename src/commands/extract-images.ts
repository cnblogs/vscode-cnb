import { Uri, workspace, window, MessageOptions, MessageItem, ProgressLocation, Range, WorkspaceEdit } from 'vscode'
import { ImageInformation, MarkdownImagesExtractor } from '@/services/images-extractor.service'

type ExtractOption = MessageItem & Partial<Pick<MarkdownImagesExtractor, 'imageType'>>
const extractOptions: readonly ExtractOption[] = [
    { title: '提取本地图片', imageType: 'local' },
    { title: '提取网络图片', imageType: 'web' },
    { title: '提取全部', imageType: 'all' },
    { title: '取消', imageType: undefined, isCloseAffordance: true },
]

export const extractImages = async (
    arg: unknown,
    inputImageType: MarkdownImagesExtractor['imageType'] | null | undefined
): Promise<void> => {
    if (arg instanceof Uri && arg.scheme === 'file') {
        const shouldIgnoreWarnings = inputImageType != null
        const markdown = (await workspace.fs.readFile(arg)).toString()
        const extractor = new MarkdownImagesExtractor(markdown, arg)
        const images = extractor.findImages()
        const availableWebImagesCount = images.filter(extractor.createImageTypeFilter('web')).length
        const availableLocalImagesCount = images.filter(extractor.createImageTypeFilter('local')).length
        const warnNoImages = (): void =>
            void (shouldIgnoreWarnings ? null : window.showWarningMessage('没有可以提取的图片'))
        if (images.length <= 0) return warnNoImages()

        let result = extractOptions.find(x => inputImageType != null && x.imageType === inputImageType)
        result = result
            ? result
            : await window.showInformationMessage<ExtractOption>(
                  '请选择要提取哪些图片? 注意! 此操作会替换源文件中的图片链接!',
                  {
                      modal: true,
                      detail:
                          `共找到 ${availableWebImagesCount} 张可以提取的网络图片\n` +
                          `${availableLocalImagesCount} 张可以提取的本地图片`,
                  } as MessageOptions,
                  ...extractOptions
              )
        const editor = window.visibleTextEditors.find(x => x.document.fileName === arg.fsPath)
        const textDocument = editor?.document ?? workspace.textDocuments.find(x => x.fileName === arg.fsPath)

        if (result && result.imageType && textDocument) {
            if (extractor.findImages().length <= 0) return warnNoImages()
            extractor.imageType = result.imageType

            await textDocument.save()
            const failedImages = await window.withProgress(
                { title: '提取图片', location: ProgressLocation.Notification },
                async progress => {
                    extractor.onProgress = (idx, images) => {
                        const total = images.length
                        const image = images[idx]
                        progress.report({
                            increment: (idx / total) * 80,
                            message: `[${idx + 1} / ${total}] 正在提取 ${image.symbol}`,
                        })
                    }
                    const extractResults = await extractor.extract()
                    const idx = 0
                    const total = extractResults.length

                    await workspace.applyEdit(
                        extractResults
                            .filter((x): x is [source: ImageInformation, result: ImageInformation] => x[1] != null)
                            .map(
                                ([sourceImage, result]): [
                                    range: Range | null,
                                    sourceImage: ImageInformation,
                                    extractedImage: ImageInformation
                                ] => {
                                    if (sourceImage.index == null) return [null, sourceImage, result]

                                    const endPos = textDocument.positionAt(
                                        sourceImage.index + sourceImage.symbol.length - 1
                                    )
                                    return [
                                        new Range(
                                            textDocument.positionAt(sourceImage.index),
                                            endPos.with({ character: endPos.character + 1 })
                                        ),
                                        sourceImage,
                                        result,
                                    ]
                                }
                            )
                            .reduce((workspaceEdit, [range, , extractedImage]) => {
                                if (range) {
                                    progress.report({
                                        increment: (idx / total) * 20 + 80,
                                        message: `[${idx + 1} / ${total}] 正在替换图片链接 ${extractedImage.symbol}`,
                                    })
                                    workspaceEdit.replace(textDocument.uri, range, extractedImage.symbol, {
                                        needsConfirmation: false,
                                        label: extractedImage.symbol,
                                    })
                                }

                                return workspaceEdit
                            }, new WorkspaceEdit())
                    )

                    await textDocument.save()
                    return extractResults.filter(x => x[1] === null).map(x => x[0])
                }
            )
            if (failedImages && failedImages.length > 0) {
                window
                    .showErrorMessage(
                        `${failedImages.length}张图片提取失败\n${failedImages
                            .map(x => [x.symbol, extractor.errors.find(y => y[0] === x.symbol)?.[1] ?? ''].join(': '))
                            .join('\n')}`
                    )
                    .then(undefined, console.warn)
            }
        }
    }
}
