export class BlogSettings implements BlogSiteDto, BlogSiteExtendDto {
    constructor(blogSite: BlogSiteDto, extend: BlogSiteExtendDto) {
        Object.assign(this, blogSite);
        Object.assign(this, extend);
    }

    blogId: number = -1;
    blogNews: string = '';
    secondaryCss: string = '';
    pageBeginHtml: string = '';
    pageEndHtml: string = '';

    title: string = '';
    subTitle: string = '';
    application: string = '';
    author: string = '';
    notifyMail: string = '';
    email: string = '';
    loginName: string = '';
    hasJsPermission: boolean = false;
    timeZone: number = -1;
    language: string = 'zh-cn';
    isDisableMainCss: boolean = false;
    enableServiceAccess: boolean = false;
    skin: string = '';
    registerTime: string = `${new Date()}`;
    codeHighlightTheme: string = '';
    codeHighlightEngine: CodeHighlightEngineEnum = -1;
    enableCodeLineNumber: boolean = false;
    blogNewsUseMarkdown: boolean = false;
}

export enum CodeHighlightEngineEnum {
    highlightJs = 1,
    prismJs,
}

export interface BlogSiteDto {
    title: string;
    subTitle: string;
    application: string;
    author: string;
    notifyMail: string;
    email: string;
    loginName: string;
    hasJsPermission: boolean;
    timeZone: number;
    language: string;
    isDisableMainCss: boolean;
    enableServiceAccess: boolean;
    skin: string;
    registerTime: string;
    codeHighlightTheme: string;
    codeHighlightEngine: CodeHighlightEngineEnum;
    enableCodeLineNumber: boolean;
    blogNewsUseMarkdown: boolean;
}

export interface BlogSiteExtendDto {
    blogId: number;
    blogNews: string;
    secondaryCss: string;
    pageBeginHtml: string;
    pageEndHtml: string;
}
