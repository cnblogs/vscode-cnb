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
        if (this._selections == null) {
            this._selections = this.parseSelections();
        }

        return this._selections;
    }

    protected abstract parseSelections(): TData[];

    abstract handle(): void | Promise<void>;

    parseInput(): TData[] | null {
        return this.parseSelections();
    }
}
