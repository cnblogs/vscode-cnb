import { BlogPost } from './blog-post';

export class PostEditDto {
    constructor(public post: BlogPost, public config: any) {}
}
