import { window, ProgressLocation } from 'vscode';
import fs from 'fs';
import os from 'os';
import path from 'path';
const download = require('download-chromium');

namespace chromiumPathProvider {
    export const defaultChromiumPath = {
        osx: [`${os.homedir()}/Applications/Google Chrome.app`, '/Applications/Google Chrome.app'],
        win: ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'],
    };
    export type ChromiumProviderFunc = () => Promise<string | undefined>;
    const selectFromLocalTitle = '选择本地Chromium';
    export const lookupExecutableFromMacApp = (path?: string) => {
        if (path?.endsWith('.app')) {
            path = `${path}/Contents/MacOS`;
            if (!fs.existsSync(path)) {
                return undefined;
            }
            for (let item of fs.readdirSync(path)) {
                path = `${path}/${item}`;
                if (fs.statSync(path).mode & fs.constants.S_IXUSR) {
                    return path;
                }
            }
        }

        return path;
    };
    export const selectFromLocal: ChromiumProviderFunc = async (): Promise<string | undefined> => {
        const platform = os.platform();
        let path = (
            await window.showOpenDialog({
                canSelectMany: false,
                title: selectFromLocalTitle,
                canSelectFolders: false,
                canSelectFiles: true,
                filters: {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    Program: [
                        ...(platform === 'darwin' ? ['app', 'exe'] : []),
                        ...(platform === 'win32' ? ['exe'] : []),
                    ],
                },
            })
        )?.pop()?.fsPath;
        return lookupExecutableFromMacApp(path);
    };
    const downloadFromInternetTitle = '帮我下载Chromium';
    export const downloadFromInternet: ChromiumProviderFunc = async (): Promise<string | undefined> => {
        const installPath = path.join(os.homedir(), `Downloads`);
        fs.mkdirSync(installPath, { recursive: true });
        const chromiumPath = await window.withProgress(
            { title: '正在下载Chromium', location: ProgressLocation.Notification },
            async progress => {
                progress.report({ increment: 0 });
                try {
                    let percentCache = 0;
                    return <string>await download({
                        log: false,
                        revision: 983122,
                        installPath,
                        onProgress: (arg: any) => {
                            let { percent } = arg;
                            percent *= 100;
                            percent = Math.floor(percent);
                            progress.report({
                                message: `${percent}%`,
                                increment: percent - percentCache,
                            });
                            percentCache = percent;
                        },
                    });
                } catch {
                    return undefined;
                }
            }
        );
        if (chromiumPath) {
            window.showInformationMessage(`Chromium已下载至${chromiumPath}`);
        }

        return chromiumPath;
    };
    export const options: [string, chromiumPathProvider.ChromiumProviderFunc][] = [
        [selectFromLocalTitle, chromiumPathProvider.selectFromLocal],
        [downloadFromInternetTitle, chromiumPathProvider.downloadFromInternet],
    ];
}

export { chromiumPathProvider };
