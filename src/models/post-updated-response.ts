import { PostType } from './post';

export class PostUpdatedResponse {
    id: number = -1;
    title: string = '';
    url: string = '';
    blogUrl: string = '';
    postType: PostType = PostType.blogPost;
    dateAdded: Date = new Date();
    entryName: string = '';
}
