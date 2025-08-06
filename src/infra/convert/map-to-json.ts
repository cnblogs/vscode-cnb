
export function mapToJson<K, V>(map: Map<K, V>) {
    const obj = Object.fromEntries(map) as unknown
    return JSON.stringify(obj)
}
