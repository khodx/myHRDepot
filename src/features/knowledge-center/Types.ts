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

export interface MhdKbFunctionListItem {
  id: string;
  name: string;
  category: string;
  syntax: string;
  relatedEngine: string;
  isDeprecated: boolean;
}

export interface MhdKbFunction extends MhdKbFunctionListItem {
  description: string;
  exampleInput: string;
  exampleOutput: string;
}

export type MhdKbArticleStatus = 'draft' | 'published' | 'archived';

export interface MhdKbArticleAdminListItem extends MhdKbArticleListItem {
  status: MhdKbArticleStatus;
  isDeleted: boolean;
  updatedAt: string;
}

export interface MhdKbArticleAdmin extends MhdKbArticle {
  searchKeywords: string;
  status: MhdKbArticleStatus;
  isDeleted: boolean;
  updatedAt: string;
}

export interface MhdKbFunctionAdminListItem extends MhdKbFunctionListItem {
  audience: MhdKbArticleAudience;
  isDeleted: boolean;
  updatedAt: string;
}

export interface MhdKbFunctionAdmin extends MhdKbFunction {
  audience: MhdKbArticleAudience;
  isDeleted: boolean;
  updatedAt: string;
}
