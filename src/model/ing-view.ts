import { Ing, IngComment } from './ing'
import { PartialTheme, Theme } from '@fluentui/react'

export interface IngAppState {
    ingList?: Ing[]
    theme: Theme | PartialTheme
    isRefreshing: boolean
    comments?: Record<number, IngComment[]>
}

export interface IngItemState {
    comments?: Ing[]
}
