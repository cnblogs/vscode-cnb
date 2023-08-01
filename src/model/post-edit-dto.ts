import { Post } from './post'

export class PostEditDto {
    constructor(
        public post: Post,
        public config: any
    ) {}
}
