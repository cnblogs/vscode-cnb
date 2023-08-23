export abstract class MultiSelectableTreeViewCmdHandler<TArgument, TData> {
    private _selections: TData[] | null = null

    constructor(public readonly input: TArgument) {}

    get selections(): TData[] {
        if (this._selections == null) this._selections = this.parseSelections()

        return this._selections
    }

    abstract handle(): void | Promise<void>

    protected abstract parseSelections(): TData[]
}
