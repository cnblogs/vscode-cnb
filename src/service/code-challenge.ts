import base64url from 'base64url'
import crypto from 'crypto'
import RandomString from 'randomstring'

export const genVerifyChallengePair = () => {
    const verifyCode = RandomString.generate(128)
    const base64Digest = crypto.createHash('sha256').update(verifyCode).digest('base64')
    const challengeCode = base64url.fromBase64(base64Digest)

    return [verifyCode, challengeCode]
}
