import { RefreshExportRecordsCmdHandler } from './refresh'
import { globalCtx } from '@/service/global-ctx'
import { OpenLocalExportCmdHandler } from '@/cmd/blog-export/open-local'
import { EditExportPostCmdHandler } from '@/cmd/blog-export/edit'
import { CreateBlogExportCmdHandler } from '@/cmd/blog-export/create'
import { DownloadExportCmdHandler } from '@/cmd/blog-export/download'
import { ViewPostCmdHandler } from '@/cmd/blog-export/view-post'
import { DeleteCmdHandler } from '@/cmd/blog-export/delete'
import { regCmd } from '@/infra/cmd'

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
