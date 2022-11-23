import { commands } from 'vscode';
import { RefreshIngsList } from 'src/commands/ing/refresh-ings-list';
import { globalState } from 'src/services/global-state';
import { IDisposable } from '@fluentui/react';
import {
    GotoIngsListFirstPage,
    GotoIngsListNextPage,
    GotoIngsListPreviousPage,
} from 'src/commands/ing/goto-ings-list-page';
import { SelectIngType } from '@/commands/ing/select-ing-type';
import { OpenIngInBrowser } from '@/commands/ing/open-ing-in-browser';

export const registerCommandsForIngsList = (disposables: IDisposable[]) => {
    const appName = globalState.extensionName;

    disposables.push(
        ...[
            commands.registerCommand(`${appName}.ings-list.refresh`, () => new RefreshIngsList().handle()),
            commands.registerCommand(`${appName}.ings-list.next`, () => new GotoIngsListNextPage().handle()),
            commands.registerCommand(`${appName}.ings-list.previous`, () => new GotoIngsListPreviousPage().handle()),
            commands.registerCommand(`${appName}.ings-list.first`, () => new GotoIngsListFirstPage().handle()),
            commands.registerCommand(`${appName}.ings-list.select-type`, () => new SelectIngType().handle()),
            commands.registerCommand(`${appName}.ings-list.open-in-browser`, () => new OpenIngInBrowser().handle()),
        ]
    );
};
