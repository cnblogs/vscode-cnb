export type CmdHandler = {
    handle(): Promise<void> | void
}

export type TreeViewCmdHandler<TData> = {
    readonly input: unknown

    parseInput(): TData | null | undefined
}

export abstract class MultiSelectableTreeViewCmdHandler<TArgument, TData> implements TreeViewCmdHandler<TData[]> {
    private _selections: TData[] | null = null

    constructor(public readonly input: TArgument) {}

    get selections(): TData[] {
        if (this._selections == null) this._selections = this.parseSelections()

        return this._selections
    }

    parseInput(): TData[] | null {
        return this.parseSelections()
    }

    abstract handle(): void | Promise<void>

    protected abstract parseSelections(): TData[]
}
