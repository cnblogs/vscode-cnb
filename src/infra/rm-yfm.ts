// remove YAML front matter in markdown
export function rmYfm(mkd: string) {
    const reg = /^---\n(\n|.)*?\n---\n*/g
    return mkd.replace(reg, '')
}
