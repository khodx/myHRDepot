import { z } from 'zod';
import type { MhdKbArticle, MhdKbArticleListItem, MhdKbCategory } from './Types';

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
