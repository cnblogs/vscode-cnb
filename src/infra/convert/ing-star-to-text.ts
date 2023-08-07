export function ingStarToText(ingIcon: string) {
    const imgTagReg = /<img.*alt="\[(.*?)]".*>/gi
    const mg = Array.from(ingIcon.matchAll(imgTagReg))

    if (mg[0] !== undefined) return `「${mg[0][1]}」`
    else return ''
}
