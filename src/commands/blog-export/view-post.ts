import { TreeViewCommandHandler } from '@/commands/command-handler';
import { DownloadedBlogExport } from '@/models/blog-export';
import { ExportPost } from '@/models/blog-export/export-post';
import { ExportPostTreeItem } from '@/tree-view-providers/models/blog-export/post';
import { URLSearchParams } from 'url';
import { languages, TextDocumentContentProvider, Uri, window, workspace } from 'vscode';

export class ViewPostCommandHandler extends TreeViewCommandHandler<ExportPostTreeItem> {
    static readonly commandName = 'vscode-cnb.blog-export.view-post';
    static readonly schema = 'vscode-cnb.blog-export.post';

    constructor(private _input: unknown) {
        super();
    }

    parseInput(): ExportPostTreeItem | null | undefined {
        return this._input instanceof ExportPostTreeItem ? this._input : null;
    }

    async handle(): Promise<void> {
        const input = this.parseInput();
        if (input == null) return;
        const {
            parent: { downloadedExport },
            post,
        } = input;
        if (downloadedExport == null) return;

        await this.provide(downloadedExport, post);
    }

    private async provide(downloadedExport: DownloadedBlogExport, { id: postId, title, isMarkdown }: ExportPost) {
        const schema = `${ViewPostCommandHandler.schema}-${postId}`;

        const matchedEditor = window.visibleTextEditors.find(({ document }) => {
            if (document.uri.scheme === schema && !document.isClosed) {
                const query = new URLSearchParams(document.uri.query);
                const parsedId = Number.parseInt(query.get('postId') ?? '-1');
                if (parsedId > 0 && parsedId === postId) return true;
            }

            return false;
        });
        if (matchedEditor) {
            await window.showTextDocument(matchedEditor.document, { preview: false, preserveFocus: true });
            return;
        }

        const disposable = workspace.registerTextDocumentContentProvider(
            schema,
            new (class implements TextDocumentContentProvider {
                async provideTextDocumentContent(): Promise<string> {
                    const { ExportPostStore } = await import('@/services/blog-export-post.store');
                    const store = new ExportPostStore(downloadedExport);
                    return store.getBody(postId).finally(() => store.dispose());
                }
            })()
        );

        const document = await workspace
            .openTextDocument(Uri.parse(`${schema}:(只读) ${title}.${isMarkdown ? 'md' : 'html'}?postId=${postId}`))
            .then(x => x, console.warn);
        if (document) {
            await window.showTextDocument(document).then(undefined, console.warn);
            await languages
                .setTextDocumentLanguage(document, isMarkdown ? 'markdown' : 'html')
                .then(undefined, console.warn);
        }

        disposable.dispose();
    }
}
