import { useQuery } from '@tanstack/react-query';
import { mhdKnowledgeCenterService } from './Service';

export const mhdKnowledgeCenterQueryKeys = {
  categories: () => ['mhd-knowledge-center', 'categories'] as const,
  articles: (categoryKey?: string, searchTerm?: string) =>
    ['mhd-knowledge-center', 'articles', categoryKey, searchTerm] as const,
  article: (slug: string) => ['mhd-knowledge-center', 'article', slug] as const,
};

export function useMhdKbCategories() {
  return useQuery({
    queryKey: mhdKnowledgeCenterQueryKeys.categories(),
    queryFn: mhdKnowledgeCenterService.listCategories,
  });
}

export function useMhdKbArticles({
  categoryKey,
  searchTerm,
}: {
  categoryKey?: string;
  searchTerm?: string;
}) {
  const categories = useMhdKbCategories();
  const category = categories.data?.find((item) => item.key === categoryKey);
  const categoryId = category?.id;
  const hasResolvedCategory = !categoryKey || Boolean(categoryId);

  return useQuery({
    queryKey: mhdKnowledgeCenterQueryKeys.articles(categoryKey, searchTerm),
    queryFn: () => mhdKnowledgeCenterService.listArticles({ categoryId, searchTerm }),
    enabled: categories.isSuccess && hasResolvedCategory,
  });
}

export function useMhdKbArticle(slug: string) {
  return useQuery({
    queryKey: mhdKnowledgeCenterQueryKeys.article(slug),
    queryFn: () => mhdKnowledgeCenterService.getArticle(slug),
    enabled: slug.trim().length > 0,
  });
}
