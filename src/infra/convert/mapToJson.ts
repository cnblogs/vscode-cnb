// eslint-disable-next-line @typescript-eslint/naming-convention
export function mapToJson<K, V>(map: Map<K, V>) {
    const obj = <unknown>Object.fromEntries(map)
    return JSON.stringify(obj)
}
