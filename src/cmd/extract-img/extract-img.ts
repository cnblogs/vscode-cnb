import { ProgressLocation, Range, Uri, window, workspace, WorkspaceEdit } from 'vscode'
import { ImgSrc } from '@/cmd/extract-img/convert-img-info'
import { Alert } from '@/infra/alert'
import { RsText } from '@/wasm'
import { findImgLink } from '@/cmd/extract-img/find-img-link'
import { convertImgInfo } from '@/cmd/extract-img/convert-img-info'
import { dirname } from 'path'

export async function extractImg(arg: unknown, inputImgSrc?: ImgSrc) {
    if (!(arg instanceof Uri && arg.scheme === 'file')) return

    const editor = window.visibleTextEditors.find(x => x.document.fileName === arg.fsPath)
    const textDocument = editor?.document ?? workspace.textDocuments.find(x => x.fileName === arg.fsPath)

    if (textDocument === undefined) return

    let imgInfoList = findImgLink(textDocument.getText())

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

    const opt = { title: '提取图片', location: ProgressLocation.Notification }
    await window.withProgress(opt, async p => {
        const fileDir = dirname(textDocument.uri.fsPath)
        console.log(fileDir)
        const extracted = await convertImgInfo(fileDir, imgInfoList, p)
        const extractedCount = extracted.length
        let text = textDocument.getText()

        extracted
            // replace from end
            .sort((a, b) => b[0].byteOffset - a[0].byteOffset)
            .forEach(([src, newLink], i) => {
                p.report({
                    increment: (i / extractedCount) * 20 + 80,
                    message: `正在替换: ${newLink}`,
                })
                const start = src.byteOffset
                const end = src.byteOffset + Buffer.from(src.data).length
                text = RsText.replaceWithByteOffset(text, start, end, newLink)
            })

        const firstLine = textDocument.lineAt(0)
        const lastLine = textDocument.lineAt(textDocument.lineCount - 1)
        const range = new Range(firstLine.range.start, lastLine.range.end)
        const we = new WorkspaceEdit()
        we.replace(textDocument.uri, range, text, {
            label: '',
            needsConfirmation: false,
        })

        await workspace.applyEdit(we)
    })
}
