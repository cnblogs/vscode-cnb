class SiteCategory {
    id: number = -1;
    title: string = '';
    parentId: number = -1;
    children: SiteCategory[] = [];
}

type SiteCategories = SiteCategory[];

export { SiteCategory, SiteCategories };
