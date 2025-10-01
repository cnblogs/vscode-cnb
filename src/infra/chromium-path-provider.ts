import { window } from 'vscode'
import fs from 'fs'
import os from 'os'

export type ChromiumProviderFunc = () => Promise<string | undefined>

const selectFromLocalTitle = '选择本地Chromium'

export class ChromiumPathProvider {
    static defaultChromiumPath = {
        osx: [`${os.homedir()}/Applications/Google Chrome.app`, '/Applications/Google Chrome.app'],
        win: ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'],
    }

    static lookupExecutableFromMacApp = (path?: string) => {
        if (path === undefined) return

        if (path.endsWith('.app')) {
            path = `${path}/Contents/MacOS`
            if (!fs.existsSync(path)) return undefined

            for (const item of fs.readdirSync(path)) {
                path = `${path}/${item}`
                const flag = fs.statSync(path).mode & fs.constants.S_IXUSR
                if (flag !== 0) return path
            }
        }
        return path
    }

    static selectFromLocal: ChromiumProviderFunc = async (): Promise<string | undefined> => {
        const platform = os.platform()
        const path = (
            await window.showOpenDialog({
                canSelectMany: false,
                title: selectFromLocalTitle,
                canSelectFolders: false,
                canSelectFiles: true,
                filters: {
                    Program: [
                        ...(platform === 'darwin' ? ['app', 'exe'] : []),
                        ...(platform === 'win32' ? ['exe'] : []),
                    ],
                },
            })
        )?.pop()?.fsPath
        return ChromiumPathProvider.lookupExecutableFromMacApp(path)
    }

    static Options: [string, ChromiumProviderFunc][] = [
        [selectFromLocalTitle, ChromiumPathProvider.selectFromLocal],
    ]
}
