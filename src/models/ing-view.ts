import { PartialTheme, Theme } from '@fluentui/react'
import { Ing, IngComment } from './ing'

export interface IngAppState {
    ings?: Ing[]
    theme: Theme | PartialTheme
    isRefreshing: boolean
    comments?: Record<number, IngComment[]>
}

export interface IngItemState {
    comments?: Ing[]
}
