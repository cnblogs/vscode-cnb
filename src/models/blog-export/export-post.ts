import { Post } from '@/models/post';
import { Model } from 'sequelize';

export type ExportPost = Pick<
    Post,
    | 'id'
    | 'title'
    | 'datePublished'
    | 'blogId'
    | 'postType'
    | 'isMarkdown'
    | 'accessPermission'
    | 'entryName'
    | 'dateUpdated'
> & {
    body?: string | null;
};

export class ExportPostModel extends Model<ExportPost> {}

export * from '@/models/post';
