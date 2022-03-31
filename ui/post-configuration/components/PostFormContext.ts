import React from 'react';

export interface IPostFormContext {
    disabled: boolean;
    status: 'loading' | 'submitting' | '';
    set(v: IPostFormContext): void;
}
export const defaultPostFormContext: IPostFormContext = { disabled: false, status: '', set: () => void 0 };
// eslint-disable-next-line @typescript-eslint/naming-convention
export const PostFormContext = React.createContext<IPostFormContext>(defaultPostFormContext);
