export class UserAuthorizationInfo {
    constructor(public idToken: string, public accessToken: string, expiresIn: number, public tokenType: string) {}
}

export class UserInfo {
    get userId() {
        return this.sub;
    }

    /**
     * Creates an instance of UserInfo.
     * @param {UserAuthorizationInfo} [authorizationInfo]
     * @param {string} [name='unknown']
     * @param {string} [avatar='']
     * @param {string} [website=''] The user blog home page url
     * @param {number} [blogId=-1]
     * @param {string} [sub=''] UserId(data type is Guid)
     * @param {number} [accountId=-1] SpaceUserId
     */
    constructor(
        public authorizationInfo?: UserAuthorizationInfo,
        public name: string = 'unknown',
        public avatar: string = '',
        public website: string = '',
        public blogId: number = -1,
        public sub: string = '',
        public accountId: number = -1
    ) {}
}
