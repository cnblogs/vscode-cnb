class PostTag {
    id = -1;
    name = '';
    useCount = 0;
    privateUseCount = 0;
    createTime: Date = new Date();
}

type PostTags = PostTag[];

export { PostTags, PostTag };
