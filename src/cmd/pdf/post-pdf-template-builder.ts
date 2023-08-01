import { Post } from '@/model/post'
import { PostFileMapManager } from '@/service/post/post-file-map'
import fs from 'fs'
import { BlogSettingService } from '@/service/blog-setting'
import { accountManager } from '@/auth/account-manager'
import { PostCategoryService } from '@/service/post/post-category'
import { PostCategory } from '@/model/post-category'
import { markdownItFactory } from '@cnblogs/markdown-it-presets'

export namespace PostPdfTemplateBuilder {
    export const HighlightedMessage = 'markdown-highlight-finished'

    export async function build(post: Post, blogApp: string): Promise<string> {
        let { postBody } = post
        const { isMarkdown, id: postId } = post

        const localFilePath = PostFileMapManager.getFilePath(postId)
        postBody = localFilePath ? fs.readFileSync(localFilePath).toString('utf-8') : postBody

        const html = isMarkdown
            ? markdownItFactory({
                  codeHighlight: false,
                  math: true,
                  disableRules: [],
                  html: true,
              }).render(postBody)
            : postBody

        const buildTagHtml = (): Promise<string> => {
            let html =
                post.tags && post.tags.length > 0
                    ? post.tags.map(t => `<a href="https://www.cnblogs.com/${blogApp}/tag/${t}/">${t}</a>`).join(', ')
                    : ''
            html = html ? `<div id="EntryTag">标签: ${html}</div>` : ''
            return Promise.resolve(html)
        }

        const buildCategoryHtml = async (): Promise<string> => {
            const categories = await PostCategoryService.listCategories()
            const postCategories =
                post.categoryIds
                    ?.map(categoryId => categories.find(x => x.categoryId === categoryId))
                    .filter((x): x is PostCategory => x != null) ?? []
            let html =
                postCategories.length > 0
                    ? postCategories
                          .map(
                              c =>
                                  `<a href="https://www.cnblogs.com/${blogApp}/category/${c.categoryId}.html" target="_blank">${c?.title}</a>`
                          )
                          .join(', ')
                    : ''
            html = html ? `<div id="BlogPostCategory">分类: ${html}</div>` : ''
            return html
        }

        const tagHtml = await buildTagHtml()
        const categoryHtml = await buildCategoryHtml()
        const setting = await BlogSettingService.getBlogSetting()
        if (setting == null) return '<html lang="en"></html>'

        const {
            codeHighlightEngine,
            codeHighlightTheme,
            enableCodeLineNumber: isCodeLineNumberEnabled,
            blogId,
        } = setting

        const { userId } = accountManager.currentUser

        return `<html lang="en">
        <head>
            <title>${post.title}</title>
            <style>
                table {
                    color: inherit;
                }
                pre {
                    page-break-inside: avoid;
                }
                .hljs-ln-n {
                    word-break: keep-all;
                    white-space: nowrap;
                }
                * {
                    direction: ltr;
                }
            </style>
            <link rel="stylesheet" href="https://www.cnblogs.com/css/blog-common.min.css">
            <script>
            const currentBlogId = ${blogId};
            const currentBlogApp = '${blogApp}';
            const cb_enable_mathjax = true;
            const isLogined = true;
            const isBlogOwner = true;
            const skinName = 'LessIsMore';
            const visitorUserId = '${userId}';
            const hasCustomScript = false;
            try {
                if (hasCustomScript && document.referrer && document.referrer.indexOf('baidu.com') >= 0) {
                    Object.defineProperty(document, 'referrer', { value: '' });
                    Object.defineProperty(Document.prototype, 'referrer', { get: function(){ return ''; } });
                }
            } catch(error) { }
            window.codeHighlightEngine = ${codeHighlightEngine};
            window.enableCodeLineNumber = ${isCodeLineNumberEnabled};
            window.codeHighlightTheme = '${codeHighlightTheme}';
            </script>
            <script src="https://common.cnblogs.com/scripts/jquery-2.2.0.min.js"></script>
            <script src="https://www.cnblogs.com/js/blog-common.min.js"></script>
        </head>
        <body>
            <div>
                <h1>
                    ${post.title}
                </h1>
                <div class="clear"></div>
                <div class="postBody">
                    <div id="cnblogs_post_body" class="blogpost-body cnblogs-markdown">${html}</div>
    <div id="blog_post_info_block">
        ${categoryHtml}
        ${tagHtml}
    </div>
                </div>
            </div>
            <script type="text/javascript">
                console.log('Begin highlight code block');
                markdown_highlight().finally(() => {
                    console.log('${HighlightedMessage}');
                });
            </script>
        </body>
    </html>`
    }
}
