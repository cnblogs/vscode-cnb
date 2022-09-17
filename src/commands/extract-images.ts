import { Uri, workspace, window, MessageOptions, MessageItem, ProgressLocation, Range } from 'vscode';
import { MarkdownImage, MarkdownImagesExtractor } from '../services/images-extractor.service';

export const extractImages = async (arg: unknown) => {
    if (arg instanceof Uri && arg.scheme === 'file') {
        const markdown = new TextDecoder().decode(await workspace.fs.readFile(arg));
        const extractor = new MarkdownImagesExtractor(markdown, arg);
        const images = extractor.findImages();
        if (images.length <= 0) {
            await window.showInformationMessage('没有需要提取的图片');
            return;
        }
        const messageItems: MessageItem[] = [{ title: '确定' }, { title: '取消', isCloseAffordance: true }];
        const result = await window.showInformationMessage<MessageItem>(
            '确定要提取图片吗? 此操作会替换源文件中的图片链接!',
            {
                modal: true,
                detail: `共找到 ${images.length} 张需要提取的图片`,
            } as MessageOptions,
            ...messageItems
        );
        const editor = window.visibleTextEditors.find(x => x.document.fileName === arg.fsPath);

        if (result === messageItems[0] && editor) {
            const document = editor.document;
            await document.save();
            const failedImages = await window.withProgress(
                { title: '提取图片', location: ProgressLocation.Notification },
                async progress => {
                    extractor.onProgress = (idx, images) => {
                        const total = images.length;
                        const image = images[idx];
                        progress.report({
                            increment: (idx / total) * 80,
                            message: `[${idx + 1} / ${total}] 正在提取 ${image.symbol}`,
                        });
                    };
                    const extractResults = await extractor.extract();
                    let idx = 0;
                    const total = extractResults.length;
                    await editor.edit(editBuilder => {
                        for (let [range, , extractedImage] of extractResults
                            .filter((x): x is [source: MarkdownImage, result: MarkdownImage] => x[1] != null)
                            .map(
                                ([sourceImage, result]): [
                                    range: Range | null,
                                    sourceImage: MarkdownImage,
                                    extractedImage: MarkdownImage
                                ] => {
                                    if (sourceImage.index == null) {
                                        return [null, sourceImage, result];
                                    }

                                    const endPos = document.positionAt(
                                        sourceImage.index + sourceImage.symbol.length - 1
                                    );
                                    return [
                                        new Range(
                                            document.positionAt(sourceImage.index),
                                            endPos.with({ character: endPos.character + 1 })
                                        ),
                                        sourceImage,
                                        result,
                                    ];
                                }
                            )) {
                            if (range == null) {
                                continue;
                            }
                            progress.report({
                                increment: (idx / total) * 20 + 80,
                                message: `[${idx + 1} / ${total}] 执行替换 ${extractedImage.symbol}`,
                            });

                            editBuilder.replace(range, extractedImage.symbol);
                        }
                    });
                    return extractResults.filter(x => x[1] === null).map(x => x[0]);
                }
            );
            if (failedImages && failedImages.length > 0) {
                await window.showErrorMessage(
                    `${failedImages.length}张图片提取失败\n${failedImages
                        .map(x => [x.symbol, extractor.errors.find(y => y[0] === x.symbol)?.[1] ?? ''].join(': '))
                        .join('\n')}`
                );
            }
        }
    }
};
