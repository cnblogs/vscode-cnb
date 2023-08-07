import { execCmd } from '@/infra/cmd'

export const osOpenActiveFile = () => execCmd('workbench.files.action.showActiveFileInExplorer')
