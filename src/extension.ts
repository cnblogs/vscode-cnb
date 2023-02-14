import { registerTreeViews } from '@/tree-view-providers/tree-view-registration';
import { registerCommands } from '@/commands/commands-registration';
import { globalContext } from '@/services/global-state';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import vscode from 'vscode';
import { accountManager } from '@/authentication/account-manager';
import {
    observeConfigurationChange,
    observeWorkspaceFolderAndFileChange as observeWorkspaceFolderChange,
} from '@/services/check-workspace';
import extensionUriHandler from '@/utils/uri-handler';
import { IngsListWebviewProvider } from 'src/services/ings-list-webview-provider';
import { extendMarkdownIt } from '@/markdown/extend-markdownIt';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    globalContext.extensionContext = context;
    accountManager.setup();
    context.subscriptions.push(accountManager);

    registerCommands();
    registerTreeViews();
    setTimeout(() => {
        IngsListWebviewProvider.ensureRegistered();
    }, 1000);
    observeConfigurationChange();
    observeWorkspaceFolderChange();
    vscode.window.registerUriHandler(extensionUriHandler);
    return {
        extendMarkdownIt,
    };
}

// this method is called when your extension is deactivated
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate() {}
