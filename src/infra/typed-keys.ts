import { keys } from 'lodash-es'

export const typedKeys = <T = unknown>(obj: T) => keys(obj) as (keyof T)[]
