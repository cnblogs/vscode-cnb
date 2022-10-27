export interface BaseEntryTreeItem<TChildren> {
    readonly getChildren: () => TChildren[];
    readonly getChildrenAsync: () => Promise<TChildren[]>;
}
