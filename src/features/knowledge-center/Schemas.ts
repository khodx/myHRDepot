import { z } from 'zod';
import type {
  MhdKbArticle,
  MhdKbArticleAdmin,
  MhdKbArticleAdminListItem,
  MhdKbArticleListItem,
  MhdKbCategory,
  MhdKbFunction,
  MhdKbFunctionAdmin,
  MhdKbFunctionAdminListItem,
  MhdKbFunctionListItem,
} from './Types';

const audienceSchema = z.enum(['end_user', 'internal', 'both']);
const requiredText = z.string().trim().min(1, 'This field is required.');

export const mhdKbArticleFormSchema = z.object({
  categoryId: requiredText,
  slug: requiredText,
  title: requiredText,
  summary: z.string(),
  body: z.string(),
  audience: audienceSchema,
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
  audience: audienceSchema,
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

const mhdKbArticleListItemSchema = z.object({
  id: z.string(),
  category_id: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  audience: z.enum(['end_user', 'internal', 'both']),
  route_context: z.array(z.string()),
  published_at: z.string().nullable(),
  total_count: z.number(),
});

export const mhdKbArticleSchema = z.object({
  id: z.string(),
  category_id: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  audience: z.enum(['end_user', 'internal', 'both']),
  route_context: z.array(z.string()),
  published_at: z.string().nullable(),
  body: z.string(),
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
  })
  .omit({ total_count: true });
const adminStatus = z.enum(['draft', 'published', 'archived']);
const mhdKbArticleAdminListSchema = mhdKbArticleListItemSchema.extend({
  status: adminStatus,
  is_deleted: z.boolean(),
  updated_at: z.string(),
});
const mhdKbArticleAdminSchema = mhdKbArticleSchema.extend({
  search_keywords: z.string(),
  status: adminStatus,
  is_deleted: z.boolean(),
  updated_at: z.string(),
});
const mhdKbFunctionAdminListSchema = mhdKbFunctionListItemSchema.extend({
  audience: z.enum(['end_user', 'internal', 'both']),
  is_deleted: z.boolean(),
  updated_at: z.string(),
});
const mhdKbFunctionAdminSchema = mhdKbFunctionAdminListSchema
  .extend({
    description: z.string(),
    example_input: z.string(),
    example_output: z.string(),
  })
  .omit({ total_count: true });

export function parseMhdKbCategories(value: unknown): MhdKbCategory[] {
  return z
    .array(mhdKbCategorySchema)
    .parse(value)
    .map((row) => ({
      id: row.id,
      key: row.key,
      label: row.label,
      description: row.description,
      icon: row.icon,
      sortOrder: row.sort_order,
      parentCategoryId: row.parent_category_id,
    }));
}

function mapArticleListItem(row: z.infer<typeof mhdKbArticleListItemSchema>): MhdKbArticleListItem {
  return {
    id: row.id,
    categoryId: row.category_id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    audience: row.audience,
    routeContext: row.route_context,
    publishedAt: row.published_at,
  };
}

export function parseMhdKbArticles(value: unknown): {
  items: MhdKbArticleListItem[];
  totalCount: number;
} {
  const rows = z.array(mhdKbArticleListItemSchema).parse(value);
  return {
    items: rows.map(mapArticleListItem),
    totalCount: rows[0]?.total_count ?? 0,
  };
}

export function parseMhdKbArticle(value: unknown): MhdKbArticle {
  const row = mhdKbArticleSchema.parse(value);
  return {
    id: row.id,
    categoryId: row.category_id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    audience: row.audience,
    routeContext: row.route_context,
    publishedAt: row.published_at,
    body: row.body,
  };
}

export function parseMhdKbFunctions(value: unknown): {
  items: MhdKbFunctionListItem[];
  totalCount: number;
} {
  const rows = z.array(mhdKbFunctionListItemSchema).parse(value);
  return {
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      syntax: row.syntax,
      relatedEngine: row.related_engine,
      isDeprecated: row.is_deprecated,
    })),
    totalCount: rows[0]?.total_count ?? 0,
  };
}

export function parseMhdKbFunction(value: unknown): MhdKbFunction {
  const row = mhdKbFunctionSchema.parse(value);
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    syntax: row.syntax,
    relatedEngine: row.related_engine,
    isDeprecated: row.is_deprecated,
    description: row.description,
    exampleInput: row.example_input,
    exampleOutput: row.example_output,
  };
}

export function parseMhdKbArticlesAdmin(value: unknown): {
  items: MhdKbArticleAdminListItem[];
  totalCount: number;
} {
  const rows = z.array(mhdKbArticleAdminListSchema).parse(value);
  return {
    items: rows.map((row) => ({
      id: row.id,
      categoryId: row.category_id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      audience: row.audience,
      routeContext: row.route_context,
      publishedAt: row.published_at,
      status: row.status,
      isDeleted: row.is_deleted,
      updatedAt: row.updated_at,
    })),
    totalCount: rows[0]?.total_count ?? 0,
  };
}

export function parseMhdKbArticleAdmin(value: unknown): MhdKbArticleAdmin {
  const row = mhdKbArticleAdminSchema.parse(value);
  return {
    id: row.id,
    categoryId: row.category_id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    audience: row.audience,
    routeContext: row.route_context,
    publishedAt: row.published_at,
    body: row.body,
    searchKeywords: row.search_keywords,
    status: row.status,
    isDeleted: row.is_deleted,
    updatedAt: row.updated_at,
  };
}

export function parseMhdKbFunctionsAdmin(value: unknown): {
  items: MhdKbFunctionAdminListItem[];
  totalCount: number;
} {
  const rows = z.array(mhdKbFunctionAdminListSchema).parse(value);
  return {
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      syntax: row.syntax,
      relatedEngine: row.related_engine,
      isDeprecated: row.is_deprecated,
      audience: row.audience,
      isDeleted: row.is_deleted,
      updatedAt: row.updated_at,
    })),
    totalCount: rows[0]?.total_count ?? 0,
  };
}

export function parseMhdKbFunctionAdmin(value: unknown): MhdKbFunctionAdmin {
  const row = mhdKbFunctionAdminSchema.parse(value);
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    syntax: row.syntax,
    relatedEngine: row.related_engine,
    isDeprecated: row.is_deprecated,
    description: row.description,
    exampleInput: row.example_input,
    exampleOutput: row.example_output,
    audience: row.audience,
    isDeleted: row.is_deleted,
    updatedAt: row.updated_at,
  };
}
