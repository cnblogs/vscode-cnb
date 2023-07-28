import { execCmd } from '@/infra/cmd'

export const revealActiveFileInExplorer = () => execCmd('workbench.files.action.showActiveFileInExplorer')
