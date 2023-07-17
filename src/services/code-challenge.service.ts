import base64url from 'base64url'
import crypto from 'crypto'
import RandomString from 'randomstring'

export const genCodePair = () => {
    const codeVerifier = RandomString.generate(128)
    const base64Digest = crypto.createHash('sha256').update(codeVerifier).digest('base64')
    const codeChallenge = base64url.fromBase64(base64Digest)

    return { codeVerifier, codeChallenge }
}
