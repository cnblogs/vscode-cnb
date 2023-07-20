import { execCmd } from '@/utils/cmd'

export const revealActiveFileInExplorer = () => execCmd('workbench.files.action.showActiveFileInExplorer')
