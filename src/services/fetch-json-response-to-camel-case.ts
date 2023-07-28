export const convertObjectKeysToCamelCase = <T extends object>(obj: T) => {
    const anyObj = <Record<string, unknown>>obj
    const splitters = ['-', '_']

    for (const oldKey of Object.keys(obj)) {
        const newKey = oldKey
            .split(new RegExp(`(${splitters.join('|')})`))
            .filter(x => !splitters.includes(x) && x)
            .map((v, index) => (index > 0 && v ? v[0].toUpperCase() + v.substring(1).toLowerCase() : v.toLowerCase()))
            .join('')
        anyObj[newKey] = anyObj[oldKey]
        if (oldKey !== newKey) delete anyObj[oldKey]
    }

    return obj
}
