import { RefreshingList } from '@/cmd/ing/refresh-ing-list'
import { globalCtx } from '@/service/global-ctx'
import { GotoingListFirstPage, IngListGoNextPage, GotoingListPreviousPage } from '@/cmd/ing/ing-list-go-next-page'
import { regCmd } from '@/infra/cmd'
import { openIngSite } from '@/cmd/open/open-ing-site'
import { switchIngType } from "@/cmd/ing/select-ing-type";

export const regIngListCmds = () => {
    const appName = globalCtx.extName

    return [
        regCmd(`${appName}.ing-list.refresh`, () => new RefreshingList().handle()),
        regCmd(`${appName}.ing-list.next`, () => new IngListGoNextPage().handle()),
        regCmd(`${appName}.ing-list.previous`, () => new GotoingListPreviousPage().handle()),
        regCmd(`${appName}.ing-list.first`, () => new GotoingListFirstPage().handle()),
        regCmd(`${appName}.ing-list.switch-type`, switchIngType),
        regCmd(`${appName}.ing-list.open-in-browser`, openIngSite),
    ]
}
