export function consUrlPara(...kvs: [string, string][]) {
    const para = new URLSearchParams(kvs)
    return para.toString()
}
