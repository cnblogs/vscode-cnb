import { CommandHandler } from '@/commands/command-handler';
import { AlertService } from '@/services/alert.service';
import { BlogExportApi } from '@/services/blog-export.api';
import { BlogExportProvider } from '@/tree-view-providers/blog-export-provider';

export class CreateBlogExportCommandHandler extends CommandHandler {
    static readonly commandName = 'vscode-cnb.blog-export.create';

    private _blogExportApi?: BlogExportApi | null;

    protected get blogExportApi() {
        return (this._blogExportApi ??= new BlogExportApi());
    }

    async handle(): Promise<void> {
        await this._blogExportApi?.create().catch(e => AlertService.warning(e));
        await BlogExportProvider.optionalInstance?.refreshRecords();
    }
}
