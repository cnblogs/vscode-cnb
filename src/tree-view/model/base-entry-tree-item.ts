export type BaseEntryTreeItem<TChildren> = {
    readonly getChildren: () => TChildren[]
    readonly getChildrenAsync: () => Promise<TChildren[]>
}
