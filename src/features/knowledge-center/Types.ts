export type MhdKbArticleAudience = 'end_user' | 'internal' | 'both';

export interface MhdKbCategory {
  id: string;
  key: string;
  label: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  parentCategoryId: string | null;
}

export interface MhdKbArticleListItem {
  id: string;
  categoryId: string;
  slug: string;
  title: string;
  summary: string | null;
  audience: MhdKbArticleAudience;
  routeContext: string[];
  publishedAt: string | null;
}

export interface MhdKbArticle extends MhdKbArticleListItem {
  body: string;
}
