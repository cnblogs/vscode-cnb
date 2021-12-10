export class BlogPost {
    id = -1;
    blogId = -1;
    postType = BlogPostType.blogPost;
    title = '';
    postBody = '';
    inSiteHome = false;
    inSiteCandidate = false;
    siteCategoryId?: number;
    displayOnHomePage = false;
    isAllowComments = true;
    entryName?: string;
    featuredImage?: string;
    password?: string;
    isMarkdown: true = true;
    isDraft = false;
    categoryIds?: number[];
}

export enum BlogPostType {
    blogPost = 1,
    article = 2,
    diary = 128,
}
