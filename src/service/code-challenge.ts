import base64url from 'base64url'
import crypto from 'crypto'
import { RsRand } from '@/wasm'

export const genVerifyChallengePair = () => {
    const verifyCode = RsRand.string(128)
    const base64Digest = crypto.createHash('sha256').update(verifyCode).digest('base64')
    const challengeCode = base64url.fromBase64(base64Digest)

    return [verifyCode, challengeCode]
}
