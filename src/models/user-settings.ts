export class UserAuthorizationInfo {
    constructor(public idToken: string, public accessToken: string, expiresIn: number, public tokenType: string) {}
}

export class UserInfo {
    get userId() {
        return this.sub;
    }
    constructor(
        public authorizationInfo?: UserAuthorizationInfo,
        public name: string = 'unknown',
        public avatar: string = '',
        public website: string = '',
        public blogId: number = -1,
        public sub: string = ''
    ) {}
}
