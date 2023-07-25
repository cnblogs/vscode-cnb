import { Post } from './post'

type PostCfg = Partial<Omit<Post, 'postBody' | 'id' | 'author' | 'blogId' | 'blogTeamIds'>> &
    Required<{ [P in keyof Post as Post[P] extends boolean ? P : never]: Post[P] }>

export { PostCfg }
