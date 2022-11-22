import { Ing } from './ing';
import { PartialTheme, Theme } from '@fluentui/react';

export interface IngAppState {
    ings?: Ing[];
    theme: Theme | PartialTheme;
    isRefreshing: boolean;
}

export interface IngItemState {
    comments?: Ing[];
}
