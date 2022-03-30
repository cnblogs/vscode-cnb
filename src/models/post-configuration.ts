import { Post } from './post';

type PostConfiguration = Partial<Omit<Post, 'postBody' | 'id' | 'author' | 'blogId' | 'blogTeamIds'>>;

export { PostConfiguration };
