import { Model } from 'sequelize'
import { Post } from '@/model/post'

export type ExportPostType = 'BlogPost' | 'Message'

export type ExportPost = Pick<
    Post,
    'id' | 'title' | 'datePublished' | 'blogId' | 'isMarkdown' | 'accessPermission' | 'entryName' | 'dateUpdated'
> & {
    body?: string | null
    postType: ExportPostType
}

export class ExportPostModel extends Model<ExportPost> {}
