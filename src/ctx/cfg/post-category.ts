import { LocalState } from '@/ctx/local-state'
import { ConfigurationTarget } from 'vscode'

export namespace PostCategoryCfg {
    export function isCreateLocalPostFileWithCategory(): boolean {
        return LocalState.getExtCfg().get('createLocalPostFileWithCategory') ?? false
    }

    export function setCreateLocalPostFileWithCategory(val: boolean) {
        const cfgTarget = ConfigurationTarget.Global
        return LocalState.getExtCfg().update('createLocalPostFileWithCategory', val, cfgTarget)
    }
}
