import { Post } from '../../models/post';
import { PostFileMapManager } from '../../services/post-file-map';
import * as fs from 'fs';
import { markdownItFactory } from '@cnblogs-gitlab/markdown-it-presets';
import { blogSettingsService } from '../../services/blog-settings.service';
import { accountService } from '../../services/account.service';
import { postCategoryService } from '../../services/post-category.service';

export namespace postPdfTemplateBuilder {
    export const highlightedMessage = 'markdown-highlight-finished';

    export const build = async (post: Post): Promise<string> => {
        let { postBody, isMarkdown, id: postId } = post;
        const localFilePath = PostFileMapManager.getFilePath(postId);
        postBody = localFilePath ? fs.readFileSync(localFilePath).toString('utf-8') : postBody;

        const md = markdownItFactory({
            codeHighlight: false,
            math: true,
            disableRules: [],
            html: true,
        });

        let html = isMarkdown ? md.render(postBody) : postBody;

        const buildTagHtml = (): Promise<string> => {
            let html =
                post.tags && post.tags.length > 0
                    ? post.tags.map(t => `<a href="https://www.cnblogs.com/laggage/tag/linux/">${t}</a>`).join(', ')
                    : '';
            html = html ? `<div id="EntryTag">标签: ${html}</div>` : '';
            return Promise.resolve(html);
        };

        const buildCategoryHtml = async (): Promise<string> => {
            let categories = await postCategoryService.fetchCategories();
            const postCategories =
                post.categoryIds?.map(categoryId => categories.find(x => x.categoryId === categoryId)) ?? [];
            let html =
                postCategories.length > 0
                    ? postCategories
                          .map(
                              c =>
                                  `<a href="https://www.cnblogs.com/laggage/category/1565066.html" target="_blank">${c?.title}</a>`
                          )
                          .join(', ')
                    : '';
            html = html ? `<div id="BlogPostCategory">分类: ${html}</div>` : '';
            return html;
        };

        const tagHtml = await buildTagHtml();
        const categoryHtml = await buildCategoryHtml();
        const { codeHighlightEngine, codeHighlightTheme, enableCodeLineNumber, blogId, application } =
            await blogSettingsService.getBlogSettings();
        const { userId } = accountService.curUser;
        return `<html>
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
            var currentBlogId = ${blogId};
            var currentBlogApp = '${application}';
            var cb_enable_mathjax = true;
            var isLogined = true;
            var isBlogOwner = true;
            var skinName = 'LessIsMore';
            var visitorUserId = '${userId}';
            var hasCustomScript = false;
            try {
                if (hasCustomScript && document.referrer && document.referrer.indexOf('baidu.com') >= 0) {
                    Object.defineProperty(document, 'referrer', { value: '' });
                    Object.defineProperty(Document.prototype, 'referrer', { get: function(){ return ''; } });
                }
            } catch(error) { }
            window.codeHighlightEngine = ${codeHighlightEngine};
            window.enableCodeLineNumber = ${enableCodeLineNumber};
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
                    console.log('${highlightedMessage}');
                });
            </script>
        </body>
    </html>`;
    };
}
