export const convertObjectKeysToCamelCase = <T extends Object>(obj: T) => {
    const anyObj = obj as any;
    const splitters = ['-', '_'];
    for (let oldKey of Object.keys(obj)) {
        const newKey = oldKey
            .split(new RegExp(`(${splitters.join('|')})`))
            .filter(x => !splitters.includes(x) && x)
            .map((v, index) => (index > 0 && v ? v[0].toUpperCase() + v.substring(1).toLowerCase() : v.toLowerCase()))
            .join('');
        anyObj[newKey] = anyObj[oldKey];
        if (oldKey !== newKey) {
            delete anyObj[oldKey];
        }
    }
    return obj;
};
