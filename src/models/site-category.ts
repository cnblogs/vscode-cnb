class SiteCategory {
    id = -1;
    title = '';
    parentId = -1;
    children: SiteCategory[] = [];
}

type SiteCategories = SiteCategory[];

export { SiteCategory, SiteCategories };
