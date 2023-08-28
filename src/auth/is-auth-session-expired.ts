import { AuthenticationSession as AuthSession } from 'vscode'

export function isAuthSessionExpired(authSession: AuthSession) {
    const accessToken = authSession.accessToken

    // TODO: need better solution
    if (accessToken.length === 64) return false

    const accessTokenPart2 = accessToken.split('.')[1]
    const buf = Buffer.from(accessTokenPart2, 'base64')
    const exp = <number>JSON.parse(buf.toString()).exp
    return exp * 1000 < Date.now()
}
