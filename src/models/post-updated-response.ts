import { PostType } from './post';

export class PostUpdatedResponse {
    id = -1;
    title = '';
    url = '';
    blogUrl = '';
    postType: PostType = PostType.blogPost;
    dateAdded: Date = new Date();
    entryName = '';
}
