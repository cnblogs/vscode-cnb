import { Post } from '@/models/post';
import { Model } from 'sequelize';

export type PostType = 'BlogPost' | 'Message';

export type ExportPost = Pick<
    Post,
    'id' | 'title' | 'datePublished' | 'blogId' | 'isMarkdown' | 'accessPermission' | 'entryName' | 'dateUpdated'
> & {
    body?: string | null;
    postType: PostType;
};

export class ExportPostModel extends Model<ExportPost> {}

export { Post } from '@/models/post';
