export const checkIsAccessTokenExpired = (accessToken: string): boolean => {
    const decodedText = Buffer.from(accessToken.split('.')[1] ?? '', 'base64').toString();
    const { exp } = JSON.parse(decodedText) as { exp?: number };
    return typeof exp === 'number' ? exp * 1000 <= Date.now() : true;
};
