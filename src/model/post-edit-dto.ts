import { Post } from '@/model/post'
import { MyConfig } from '@/model/my-config'

export type PostEditDto = {
    post: Post
    config: MyConfig
}
