import { commands } from 'vscode'

export function regCmd(cmd: string, f: (...args: any[]) => any) {
    return commands.registerCommand(cmd, f)
}

export function execCmd<T>(cmd: string, ...rest: any[]) {
    return commands.executeCommand<T>(cmd, rest)
}
