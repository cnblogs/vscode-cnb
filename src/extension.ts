import { registerTreeViews } from '@/tree-view-providers/tree-view-registration';
import { registerCommands } from '@/commands/commands-registration';
import { globalState } from '@/services/global-state';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import vscode from 'vscode';
import { accountService } from '@/services/account.service';
import {
    observeConfigurationChange,
    observeWorkspaceFolderAndFileChange as observeWorkspaceFolderChange,
} from '@/services/check-workspace';
import { EditPostUriHandler } from '@/services/edit-post-uri-handler';
import { IngWebviewProvider } from '@/services/ing-webview-provider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    globalState.extensionContext = context;
    void accountService.setIsAuthorizedToContext();
    context.subscriptions.push(accountService);

    registerCommands();
    registerTreeViews();
    IngWebviewProvider.ensureRegistered();
    observeConfigurationChange();
    observeWorkspaceFolderChange();
    vscode.window.registerUriHandler(new EditPostUriHandler());
}

// this method is called when your extension is deactivated
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate() {}
