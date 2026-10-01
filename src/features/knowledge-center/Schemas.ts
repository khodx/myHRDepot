import { z } from 'zod';
import type {
  MhdKbArticle,
  MhdKbArticleAdmin,
  MhdKbArticleListItem,
  MhdKbCategory,
  MhdKbComplianceEntry,
  MhdKbFunction,
  MhdKbFunctionAdmin,
  MhdKbFunctionListItem,
  MhdKbSearchResult,
} from './Types';

const accessLevelSchema = z.enum(['PUBLIC', 'COMPANY', 'LEADERSHIP', 'ADMIN']);
const articleTypeSchema = z.enum(['ARTICLE', 'FAQ']);
const bodyFormatSchema = z.enum(['plain', 'rich']);
const requiredText = z.string().trim().min(1, 'This field is required.');

export const mhdKbArticleFormSchema = z.object({
  categoryId: requiredText,
  slug: z.string().trim(),
  articleType: articleTypeSchema,
  title: requiredText,
  summary: z.string(),
  body: z.string(),
  accessLevel: accessLevelSchema,
  complianceRegistryId: z.string().nullable(),
  routeContext: z.string(),
  searchKeywords: z.string(),
});
export type MhdKbArticleFormValues = z.infer<typeof mhdKbArticleFormSchema>;
export const mhdKbFunctionFormSchema = z.object({
  name: requiredText,
  category: requiredText,
  syntax: requiredText,
  description: requiredText,
  exampleInput: z.string(),
  exampleOutput: z.string(),
  relatedEngine: z.enum(['calculator', 'automation', 'forms']),
  accessLevel: z.enum(['PUBLIC', 'LEADERSHIP', 'ADMIN']),
  isDeprecated: z.boolean(),
});
export type MhdKbFunctionFormValues = z.infer<typeof mhdKbFunctionFormSchema>;

export const mhdKbCategorySchema = z.object({
  id: z.string(),
  key: z.string(),
  label: z.string(),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  sort_order: z.number(),
  parent_category_id: z.string().nullable(),
});
const mhdKbArticleRowSchema = z.object({
  id: z.string(),
  category_id: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  article_type: articleTypeSchema,
  access_level: accessLevelSchema,
  company_id: z.string().nullable(),
  route_context: z.array(z.string()),
  published_at: z.string().nullable(),
});
const mhdKbArticleListItemSchema = mhdKbArticleRowSchema.extend({ total_count: z.number() });
export const mhdKbArticleSchema = mhdKbArticleRowSchema.extend({
  body: z.string(),
  body_format: bodyFormatSchema,
});
const mhdKbFunctionListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  syntax: z.string(),
  related_engine: z.string(),
  is_deprecated: z.boolean(),
  total_count: z.number().optional(),
});
const mhdKbFunctionSchema = mhdKbFunctionListItemSchema
  .extend({
    description: z.string(),
    example_input: z.string(),
    example_output: z.string(),
    access_level: z.enum(['PUBLIC', 'LEADERSHIP', 'ADMIN']).optional(),
  })
  .omit({ total_count: true });
const adminStatus = z.enum(['draft', 'published', 'archived']);
const mhdKbArticleAdminListSchema = mhdKbArticleListItemSchema.extend({
  compliance_registry_id: z.string().nullable(),
  status: adminStatus,
  is_deleted: z.boolean(),
  updated_at: z.string(),
});
const mhdKbArticleAdminSchema = mhdKbArticleSchema.extend({
  compliance_registry_id: z.string().nullable(),
  search_keywords: z.string(),
  status: adminStatus,
  is_deleted: z.boolean(),
  updated_at: z.string(),
});
const mhdKbFunctionAdminListSchema = mhdKbFunctionListItemSchema.extend({
  access_level: z.enum(['PUBLIC', 'LEADERSHIP', 'ADMIN']),
  is_deleted: z.boolean(),
  updated_at: z.string(),
});
const mhdKbFunctionAdminSchema = mhdKbFunctionAdminListSchema
  .extend({ description: z.string(), example_input: z.string(), example_output: z.string() })
  .omit({ total_count: true });
const mhdKbSearchResultSchema = z.object({
  id: z.string(),
  category_id: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  snippet: z.string(),
  article_type: articleTypeSchema,
  access_level: accessLevelSchema,
  company_id: z.string().nullable(),
  published_at: z.string().nullable(),
  rank: z.number(),
  total_count: z.number(),
});
const mhdKbComplianceEntrySchema = z.object({
  id: z.string(),
  content_key: z.string(),
  version: z.number(),
  review_status: z.string(),
  production_enabled: z.boolean(),
  authority_name: z.string().nullable(),
  source_url: z.string().nullable(),
});

export function parseMhdKbCategories(value: unknown): MhdKbCategory[] {
  return z
    .array(mhdKbCategorySchema)
    .parse(value)
    .map((r) => ({
      id: r.id,
      key: r.key,
      label: r.label,
      description: r.description,
      icon: r.icon,
      sortOrder: r.sort_order,
      parentCategoryId: r.parent_category_id,
    }));
}
function mapArticle(r: z.infer<typeof mhdKbArticleRowSchema>): MhdKbArticleListItem {
  return {
    id: r.id,
    categoryId: r.category_id,
    slug: r.slug,
    title: r.title,
    summary: r.summary,
    articleType: r.article_type,
    accessLevel: r.access_level,
    companyId: r.company_id,
    routeContext: r.route_context,
    publishedAt: r.published_at,
  };
}
export function parseMhdKbArticles(value: unknown) {
  const rows = z.array(mhdKbArticleListItemSchema).parse(value);
  return { items: rows.map(mapArticle), totalCount: rows[0]?.total_count ?? 0 };
}
export function parseMhdKbArticle(value: unknown): MhdKbArticle {
  const r = mhdKbArticleSchema.parse(value);
  return { ...mapArticle(r), body: r.body, bodyFormat: r.body_format };
}
export function parseMhdKbFunctions(value: unknown): {
  items: MhdKbFunctionListItem[];
  totalCount: number;
} {
  const rows = z.array(mhdKbFunctionListItemSchema).parse(value);
  return {
    items: rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      syntax: r.syntax,
      relatedEngine: r.related_engine,
      isDeprecated: r.is_deprecated,
    })),
    totalCount: rows[0]?.total_count ?? 0,
  };
}
export function parseMhdKbFunction(value: unknown): MhdKbFunction {
  const r = mhdKbFunctionSchema.parse(value);
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    syntax: r.syntax,
    relatedEngine: r.related_engine,
    isDeprecated: r.is_deprecated,
    description: r.description,
    exampleInput: r.example_input,
    exampleOutput: r.example_output,
  };
}
export function parseMhdKbArticlesAdmin(value: unknown) {
  const rows = z.array(mhdKbArticleAdminListSchema).parse(value);
  return {
    items: rows.map((r) => ({
      ...mapArticle(r),
      complianceRegistryId: r.compliance_registry_id,
      status: r.status,
      isDeleted: r.is_deleted,
      updatedAt: r.updated_at,
    })),
    totalCount: rows[0]?.total_count ?? 0,
  };
}
export function parseMhdKbArticleAdmin(value: unknown): MhdKbArticleAdmin {
  const r = mhdKbArticleAdminSchema.parse(value);
  return {
    ...mapArticle(r),
    body: r.body,
    bodyFormat: r.body_format,
    complianceRegistryId: r.compliance_registry_id,
    searchKeywords: r.search_keywords,
    status: r.status,
    isDeleted: r.is_deleted,
    updatedAt: r.updated_at,
  };
}
export function parseMhdKbFunctionsAdmin(value: unknown) {
  const rows = z.array(mhdKbFunctionAdminListSchema).parse(value);
  return {
    items: rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      syntax: r.syntax,
      relatedEngine: r.related_engine,
      isDeprecated: r.is_deprecated,
      accessLevel: r.access_level,
      isDeleted: r.is_deleted,
      updatedAt: r.updated_at,
    })),
    totalCount: rows[0]?.total_count ?? 0,
  };
}
export function parseMhdKbFunctionAdmin(value: unknown): MhdKbFunctionAdmin {
  const r = mhdKbFunctionAdminSchema.parse(value);
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    syntax: r.syntax,
    relatedEngine: r.related_engine,
    isDeprecated: r.is_deprecated,
    description: r.description,
    exampleInput: r.example_input,
    exampleOutput: r.example_output,
    accessLevel: r.access_level,
    isDeleted: r.is_deleted,
    updatedAt: r.updated_at,
  };
}
export function parseMhdKbSearchResults(value: unknown): {
  items: MhdKbSearchResult[];
  totalCount: number;
} {
  const rows = z.array(mhdKbSearchResultSchema).parse(value);
  return {
    items: rows.map((r) => ({
      id: r.id,
      categoryId: r.category_id,
      slug: r.slug,
      title: r.title,
      summary: r.summary,
      snippet: r.snippet,
      articleType: r.article_type,
      accessLevel: r.access_level,
      companyId: r.company_id,
      publishedAt: r.published_at,
      rank: r.rank,
    })),
    totalCount: rows[0]?.total_count ?? 0,
  };
}
export function parseMhdKbComplianceEntries(value: unknown): MhdKbComplianceEntry[] {
  return z
    .array(mhdKbComplianceEntrySchema)
    .parse(value)
    .map((r) => ({
      id: r.id,
      contentKey: r.content_key,
      version: r.version,
      reviewStatus: r.review_status,
      productionEnabled: r.production_enabled,
      authorityName: r.authority_name,
      sourceUrl: r.source_url,
    }));
}
