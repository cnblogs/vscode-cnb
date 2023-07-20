import { OpenIngInBrowser } from '@/commands/ing/open-ing-in-browser'
import { SelectIngType } from '@/commands/ing/select-ing-type'
import { regCmd } from '@/utils/cmd'
import {
    GotoIngsListFirstPage,
    GotoIngsListNextPage,
    GotoIngsListPreviousPage,
} from 'src/commands/ing/goto-ings-list-page'
import { RefreshIngsList } from 'src/commands/ing/refresh-ings-list'
import { globalCtx } from 'src/services/global-ctx'

export const regIngListCmds = () => {
    const appName = globalCtx.extName

    return [
        regCmd(`${appName}.ings-list.refresh`, () => new RefreshIngsList().handle()),
        regCmd(`${appName}.ings-list.next`, () => new GotoIngsListNextPage().handle()),
        regCmd(`${appName}.ings-list.previous`, () => new GotoIngsListPreviousPage().handle()),
        regCmd(`${appName}.ings-list.first`, () => new GotoIngsListFirstPage().handle()),
        regCmd(`${appName}.ings-list.select-type`, () => new SelectIngType().handle()),
        regCmd(`${appName}.ings-list.open-in-browser`, () => new OpenIngInBrowser().handle()),
    ]
}
