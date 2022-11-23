import { CommandHandler } from '@/commands/command-handler';
import { globalState } from '@/services/global-state';
import { commands, Uri } from 'vscode';

export class OpenIngInBrowser extends CommandHandler {
    async handle(): Promise<void> {
        await commands.executeCommand('vscode.open', Uri.parse(globalState.config.ingSite));
    }
}
