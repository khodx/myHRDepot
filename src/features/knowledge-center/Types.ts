/**
 * Who can read a Knowledge Center row. PUBLIC = every signed-in user of any
 * company; COMPANY = every user of the owning company; LEADERSHIP =
 * leadership-level roles; ADMIN = admin-level roles. Levels are cumulative, and
 * which roles count as leadership/admin is data in `kb_access_level_roles`.
 */
export type MhdKbAccessLevel = 'PUBLIC' | 'COMPANY' | 'LEADERSHIP' | 'ADMIN';
/**
 * Most results one search request returns — the server caps `mhd_search_knowledge`
 * at 100. Results are paged in memory, like every other list in the app.
 */
export const MHD_KB_SEARCH_RESULT_LIMIT = 100;
/** Levels valid for platform-owned rows (articles and function reference). */
export type MhdKbPlatformAccessLevel = Exclude<MhdKbAccessLevel, 'COMPANY'>;
export type MhdKbArticleType = 'ARTICLE' | 'FAQ';
export type MhdKbBodyFormat = 'plain' | 'rich';

/** Access levels a platform-owned row may carry (mirrors the database CHECK). */
export const MHD_KB_PLATFORM_ACCESS_LEVELS: MhdKbPlatformAccessLevel[] = [
  'PUBLIC',
  'LEADERSHIP',
  'ADMIN',
];
/** Access levels a company-owned row may carry (mirrors the database CHECK). */
export const MHD_KB_COMPANY_ACCESS_LEVELS: MhdKbAccessLevel[] = ['COMPANY', 'LEADERSHIP', 'ADMIN'];
export const MHD_KB_ACCESS_LEVEL_LABELS: Record<MhdKbAccessLevel, string> = {
  PUBLIC: 'Everyone',
  COMPANY: 'Everyone In My Company',
  LEADERSHIP: 'Leadership',
  ADMIN: 'Administrators',
};
/** Article types distinguish general articles from frequently asked questions. */
export const MHD_KB_ARTICLE_TYPE_LABELS: Record<MhdKbArticleType, string> = {
  ARTICLE: 'Article',
  FAQ: 'FAQ',
};

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
  articleType: MhdKbArticleType;
  accessLevel: MhdKbAccessLevel;
  companyId: string | null;
  routeContext: string[];
  publishedAt: string | null;
}
export interface MhdKbArticle extends MhdKbArticleListItem {
  body: string;
  bodyFormat: MhdKbBodyFormat;
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
  complianceRegistryId: string | null;
  status: MhdKbArticleStatus;
  isDeleted: boolean;
  updatedAt: string;
}
export interface MhdKbArticleAdmin extends MhdKbArticle {
  complianceRegistryId: string | null;
  searchKeywords: string;
  status: MhdKbArticleStatus;
  isDeleted: boolean;
  updatedAt: string;
}
export interface MhdKbFunctionAdminListItem extends MhdKbFunctionListItem {
  accessLevel: MhdKbPlatformAccessLevel;
  isDeleted: boolean;
  updatedAt: string;
}
export interface MhdKbFunctionAdmin extends MhdKbFunction {
  accessLevel: MhdKbPlatformAccessLevel;
  isDeleted: boolean;
  updatedAt: string;
}
export interface MhdKbSearchResult {
  id: string;
  categoryId: string;
  slug: string;
  title: string;
  summary: string | null;
  snippet: string;
  articleType: MhdKbArticleType;
  accessLevel: MhdKbAccessLevel;
  companyId: string | null;
  publishedAt: string | null;
  rank: number;
}
export interface MhdKbComplianceEntry {
  id: string;
  contentKey: string;
  version: number;
  reviewStatus: string;
  productionEnabled: boolean;
  authorityName: string | null;
  sourceUrl: string | null;
}
