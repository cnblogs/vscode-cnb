import { RefreshExportRecordsCmdHandler } from './refresh'
import { globalCtx } from '@/services/global-ctx'
import { OpenLocalExportCmdHandler } from '@/commands/blog-export/open-local'
import { EditExportPostCmdHandler } from '@/commands/blog-export/edit'
import { CreateBlogExportCmdHandler } from '@/commands/blog-export/create'
import { DownloadExportCmdHandler } from '@/commands/blog-export/download'
import { ViewPostCmdHandler } from '@/commands/blog-export/view-post'
import { DeleteCmdHandler } from '@/commands/blog-export/delete'
import { regCmd } from '@/utils/cmd'

export function regBlogExportCmds() {
    const { extName } = globalCtx

    return [
        regCmd(`${extName}.blog-export.refresh-records`, () => new RefreshExportRecordsCmdHandler().handle()),
        regCmd(OpenLocalExportCmdHandler.cmd, () => new OpenLocalExportCmdHandler().handle()),
        regCmd(EditExportPostCmdHandler.cmd, input => new EditExportPostCmdHandler(input).handle()),
        regCmd(CreateBlogExportCmdHandler.cmd, () => new CreateBlogExportCmdHandler().handle()),
        regCmd(DownloadExportCmdHandler.cmd, input => new DownloadExportCmdHandler(input).handle()),
        regCmd(ViewPostCmdHandler.cmd, input => new ViewPostCmdHandler(input).handle()),
        regCmd(DeleteCmdHandler.cmd, input => new DeleteCmdHandler(input).handle()),
    ]
}
