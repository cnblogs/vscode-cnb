import { CmdHandler } from '@/commands/cmd-handler'
import { globalCtx } from '@/services/global-ctx'
import { execCmd } from '@/utils/cmd'
import { Uri } from 'vscode'

export class OpenIngInBrowser extends CmdHandler {
    async handle(): Promise<void> {
        await execCmd('vscode.open', Uri.parse(globalCtx.config.ingSite))
    }
}
