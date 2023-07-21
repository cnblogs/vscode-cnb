import { RefreshingList } from 'src/commands/ing/refresh-ing-list'
import { globalCtx } from 'src/services/global-ctx'
import { GotoingListFirstPage, GotoingListNextPage, GotoingListPreviousPage } from 'src/commands/ing/goto-ing-list-page'
import { SelectIngType } from '@/commands/ing/select-ing-type'
import { OpenIngInBrowser } from '@/commands/ing/open-ing-in-browser'
import { regCmd } from '@/utils/cmd'

export const regIngListCmds = () => {
    const appName = globalCtx.extName

    return [
        regCmd(`${appName}.ing-list.refresh`, () => new RefreshingList().handle()),
        regCmd(`${appName}.ing-list.next`, () => new GotoingListNextPage().handle()),
        regCmd(`${appName}.ing-list.previous`, () => new GotoingListPreviousPage().handle()),
        regCmd(`${appName}.ing-list.first`, () => new GotoingListFirstPage().handle()),
        regCmd(`${appName}.ing-list.select-type`, () => new SelectIngType().handle()),
        regCmd(`${appName}.ing-list.open-in-browser`, () => new OpenIngInBrowser().handle()),
    ]
}
