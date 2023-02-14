// reference: https://github.com/PicGo/PicGo-Core/blob/dev/src/utils/getClipboardImage.ts

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import isWsl from 'is-wsl';
import { globalContext } from '../services/global-state';
import { AlertService } from '../services/alert.service';
import { IClipboardImage } from '../models/clipboard-image';
import { format } from 'date-fns';

export type Platform = 'darwin' | 'win32' | 'win10' | 'linux' | 'wsl';

const getCurrentPlatform = (): Platform => {
    const platform = process.platform;
    if (isWsl) return 'wsl';

    if (platform === 'win32') {
        const currentOS = os.release().split('.')[0];
        if (currentOS === '10') return 'win10';
        else return 'win32';
    } else if (platform === 'darwin') {
        return 'darwin';
    } else {
        return 'linux';
    }
};

const readClipboardScript = (
    scriptName: 'mac.applescript' | 'linux.sh' | 'windows.ps1' | 'windows10.ps1' | 'wsl.sh'
) => {
    const filePath = globalContext.extensionContext.asAbsolutePath(`dist/assets/scripts/clipboard/${scriptName}`);
    return fs.readFileSync(filePath).toString();
};

const platform2ScriptContent = (): {
    [key in Platform]: string;
} => ({
    darwin: readClipboardScript('mac.applescript'),
    win32: readClipboardScript('windows.ps1'),
    win10: readClipboardScript('windows10.ps1'),
    linux: readClipboardScript('linux.sh'),
    wsl: readClipboardScript('wsl.sh'),
});
/**
 * powershell will report error if file does not have a '.ps1' extension,
 * so we should keep the extension name consistent with corresponding shell
 */
const platform2ScriptFilename: {
    [key in Platform]: string;
} = {
    darwin: 'mac.applescript',
    win32: 'windows.ps1',
    win10: 'windows10.ps1',
    linux: 'linux.sh',
    wsl: 'wsl.sh',
};

const getClipboardImage = (): Promise<IClipboardImage> => {
    const imagePath = path.join(
        globalContext.extensionContext?.asAbsolutePath('./') ?? '',
        `${format(new Date(), 'yyyyMMddHHmmss')}.png`
    );
    return new Promise<IClipboardImage>((resolve, reject): void => {
        const platform = getCurrentPlatform();
        const scriptPath = path.join(__dirname, platform2ScriptFilename[platform]);
        // If the script does not exist yet, we need to write the content to the script file
        if (!fs.existsSync(scriptPath)) fs.writeFileSync(scriptPath, platform2ScriptContent()[platform], 'utf8');

        let execution;
        if (platform === 'darwin') {
            execution = spawn('osascript', [scriptPath, imagePath]);
        } else if (platform === 'win32' || platform === 'win10') {
            execution = spawn('powershell', [
                '-noprofile',
                '-noninteractive',
                '-nologo',
                '-sta',
                '-executionpolicy',
                'unrestricted',
                // fix windows 10 native cmd crash bug when "picgo upload"
                // https://github.com/PicGo/PicGo-Core/issues/32
                // '-windowstyle','hidden',
                // '-noexit',
                '-file',
                scriptPath,
                imagePath,
            ]);
        } else {
            execution = spawn('sh', [scriptPath, imagePath]);
        }

        execution.stdout.on('data', (data: Buffer) => {
            if (platform === 'linux') {
                if (data.toString().trim() === 'no xclip') {
                    AlertService.warning('xclip not found, Please install xclip first');
                    return reject(new Error('Please install xclip first'));
                }
            }
            const imgPath = data.toString().trim();

            // if the filePath is the real file in system
            // we should keep it instead of removing
            let shouldKeepAfterUploading = false;

            // in macOS if your copy the file in system, it's basename will not equal to our default basename
            if (path.basename(imgPath) !== path.basename(imagePath)) {
                // if the path is not generate by picgo
                // but the path exists, we should keep it
                if (fs.existsSync(imgPath)) shouldKeepAfterUploading = true;
            }
            // if the imgPath is invalid
            if (imgPath !== 'no image' && !fs.existsSync(imgPath)) return reject(new Error(`Can't find ${imgPath}`));

            resolve({
                imgPath,
                shouldKeepAfterUploading,
            });
        });
    });
};

export default getClipboardImage;
