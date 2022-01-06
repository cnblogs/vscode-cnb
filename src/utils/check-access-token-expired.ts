export const checkIsAccessTokenExpired = (accessToken: string): boolean => {
    const decodedText = Buffer.from(accessToken.split('.')[1], 'base64').toString();
    let obj: { exp: number } = JSON.parse(decodedText);
    let { exp } = obj;
    if (!exp) {
        throw Error('Invalid accessToken, no exp property');
    }

    exp *= 1000;
    const now = Date.now();
    return exp <= now;
};
