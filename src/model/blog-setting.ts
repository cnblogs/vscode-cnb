export class BlogSetting implements BlogSiteDto, BlogSiteExtendDto {
    blogId = -1
    blogNews = ''
    secondaryCss = ''
    pageBeginHtml = ''
    pageEndHtml = ''

    title = ''
    subTitle = ''
    application = ''
    author = ''
    notifyMail = ''
    email = ''
    loginName = ''
    hasJsPermission = false
    timeZone = -1
    language = 'zh-cn'
    isDisableMainCss = false
    enableServiceAccess = false
    skin = ''
    registerTime = new Date().toString()
    codeHighlightTheme = ''
    codeHighlightEngine: CodeHighlightEngineEnum = CodeHighlightEngineEnum.highlightJs
    enableCodeLineNumber = false
    blogNewsUseMarkdown = false

    constructor(blogSite: BlogSiteDto, extend: BlogSiteExtendDto) {
        Object.assign(this, blogSite)
        Object.assign(this, extend)
    }
}

export enum CodeHighlightEngineEnum {
    highlightJs = 1,
    prismJs,
}

export type BlogSiteDto = {
    title: string
    subTitle: string
    application: string
    author: string
    notifyMail: string
    email: string
    loginName: string
    hasJsPermission: boolean
    timeZone: number
    language: string
    isDisableMainCss: boolean
    enableServiceAccess: boolean
    skin: string
    registerTime: string
    codeHighlightTheme: string
    codeHighlightEngine: CodeHighlightEngineEnum
    enableCodeLineNumber: boolean
    blogNewsUseMarkdown: boolean
}

export type BlogSiteExtendDto = {
    blogId: number
    blogNews: string
    secondaryCss: string
    pageBeginHtml: string
    pageEndHtml: string
}
