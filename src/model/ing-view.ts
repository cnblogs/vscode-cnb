import { Ing, IngComment } from './ing'
import { PartialTheme, Theme } from '@fluentui/react'

export type IngAppState = {
    ingList?: Ing[]
    theme: Theme | PartialTheme
    isRefreshing: boolean
    comments?: Record<number, IngComment[]>
}

export type IngItemState = {
    comments?: Ing[]
}
