export abstract class TreeViewCommandHandler<TData> {
    readonly input: unknown;

    abstract handle(): Promise<void> | void;

    abstract parseInput(): TData | null;
}

export abstract class MultiSelectableTreeViewCommandHandler<TArgument, TData>
    implements TreeViewCommandHandler<TData[]>
{
    private _selections: TData[] | null = null;
    constructor(public readonly input: TArgument) {}

    get selections(): TData[] {
        if (this._selections == null) this._selections = this.parseSelections();

        return this._selections;
    }

    parseInput(): TData[] | null {
        return this.parseSelections();
    }

    abstract handle(): void | Promise<void>;

    protected abstract parseSelections(): TData[];
}
