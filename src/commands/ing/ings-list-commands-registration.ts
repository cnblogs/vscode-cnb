import { commands } from 'vscode';
import { RefreshIngsList } from 'src/commands/ing/refresh-ings-list';
import { globalState } from 'src/services/global-state';
import { IDisposable } from '@fluentui/react';
import { GotoNextIngsList, GotoPreviousIngsList } from 'src/commands/ing/goto-ings-list-page';

export const registerCommandsForIngsList = (disposables: IDisposable[]) => {
    const appName = globalState.extensionName;

    disposables.push(
        ...[
            commands.registerCommand(`${appName}.ings-list.refresh`, () => new RefreshIngsList().handle()),
            commands.registerCommand(`${appName}.ings-list.next`, () => new GotoNextIngsList().handle()),
            commands.registerCommand(`${appName}.ings-list.previous`, () => new GotoPreviousIngsList().handle()),
        ]
    );
};
