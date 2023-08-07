export function bearer(token: string) {
    return `Bearer ${token}`
}

export function basic(credentials: string) {
    return `Basic ${credentials}`
}
