import base64url from 'base64url';
import crypto from 'crypto';
import RandomString from 'randomstring';

export const generateCodeVerifier = () => {
    return RandomString.generate(128);
};

export const generateCodeChallenge = (codeVerifier?: string): { codeVerifier: string; codeChallenge: string } => {
    codeVerifier ??= generateCodeVerifier();
    const base64Digest = crypto.createHash('sha256').update(codeVerifier).digest('base64');
    const codeChallenge = base64url.fromBase64(base64Digest);
    return { codeVerifier, codeChallenge };
};
