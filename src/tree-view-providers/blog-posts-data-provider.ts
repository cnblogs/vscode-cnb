import { Event, ProviderResult, TreeDataProvider, TreeItem } from 'vscode';
import { BlogPost } from '../models/blog-post';

export class BlogPostsDataProvider implements TreeDataProvider<BlogPost> {
    onDidChangeTreeData?: Event<void | BlogPost | null | undefined> | undefined;
    getTreeItem(post: BlogPost): TreeItem | Thenable<TreeItem> {
        return {
            id: `${post.id}`,
            description: `${post.title}`,
        };
    }
    getChildren(element?: BlogPost): ProviderResult<BlogPost[]> {
        if (!element) {
            return [];
        }
        throw new Error('Method not implemented.');
    }
}
