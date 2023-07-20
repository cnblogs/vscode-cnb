export abstract class CmdHandler {
    abstract handle(): Promise<void> | void
}

export abstract class TreeViewCmdHandler<TData> extends CmdHandler {
    readonly input: unknown

    abstract parseInput(): TData | null | undefined
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
