import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdKnowledgeCenterService } from './Service';
import type { MhdKbArticleAdmin, MhdKbFunctionAdmin, MhdKbArticleListItem } from './Types';

export const mhdKnowledgeCenterQueryKeys = {
  categories: () => ['mhd-knowledge-center', 'categories'] as const,
  articles: (categoryKey?: string, searchTerm?: string) =>
    ['mhd-knowledge-center', 'articles', categoryKey, searchTerm] as const,
  allArticleRoutes: () => ['mhd-knowledge-center', 'all-article-routes'] as const,
  article: (slug: string) => ['mhd-knowledge-center', 'article', slug] as const,
  functions: (filters: unknown) => ['mhd-knowledge-center', 'functions', filters] as const,
  function: (id: string) => ['mhd-knowledge-center', 'function', id] as const,
  articlesAdmin: (filters: unknown) => ['mhd-knowledge-center', 'articles-admin', filters] as const,
  articleAdmin: (id: string) => ['mhd-knowledge-center', 'article-admin', id] as const,
  functionsAdmin: (filters: unknown) =>
    ['mhd-knowledge-center', 'functions-admin', filters] as const,
  functionAdmin: (id: string) => ['mhd-knowledge-center', 'function-admin', id] as const,
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

function articleMatchesPath(article: MhdKbArticleListItem, pathname: string) {
  return article.routeContext.some(
    (route) =>
      route === pathname || (route.endsWith('/*') && pathname.startsWith(route.slice(0, -1))),
  );
}

export function useMhdContextualHelpArticles(pathname: string) {
  const query = useQuery({
    queryKey: mhdKnowledgeCenterQueryKeys.allArticleRoutes(),
    queryFn: mhdKnowledgeCenterService.listAllPublishedArticleRoutes,
    staleTime: 5 * 60 * 1000,
  });

  return {
    ...query,
    data: query.data?.filter((article) => articleMatchesPath(article, pathname)) ?? [],
  };
}

export function useMhdKbArticle(slug: string) {
  return useQuery({
    queryKey: mhdKnowledgeCenterQueryKeys.article(slug),
    queryFn: () => mhdKnowledgeCenterService.getArticle(slug),
    enabled: slug.trim().length > 0,
  });
}

export function useMhdKbFunctionsPublic(filters: { searchTerm?: string; relatedEngine?: string }) {
  return useQuery({
    queryKey: mhdKnowledgeCenterQueryKeys.functions(filters),
    queryFn: () => mhdKnowledgeCenterService.listKbFunctions({ ...filters, limit: 200 }),
  });
}
export function useMhdKbFunctionPublic(id: string | null) {
  return useQuery({
    queryKey: mhdKnowledgeCenterQueryKeys.function(id ?? ''),
    queryFn: () => mhdKnowledgeCenterService.getKbFunction(id!),
    enabled: Boolean(id),
  });
}
export function useMhdKbArticlesAdmin(filters: {
  categoryId?: string;
  status?: string;
  searchTerm?: string;
}) {
  return useQuery({
    queryKey: mhdKnowledgeCenterQueryKeys.articlesAdmin(filters),
    queryFn: () =>
      mhdKnowledgeCenterService.listArticlesAdmin({
        ...filters,
        includeArchived: filters.status === 'archived',
        limit: 200,
      }),
  });
}
export function useMhdKbArticleAdmin(id: string | null) {
  return useQuery<MhdKbArticleAdmin | null>({
    queryKey: mhdKnowledgeCenterQueryKeys.articleAdmin(id ?? ''),
    queryFn: () => mhdKnowledgeCenterService.getArticleAdmin(id!),
    enabled: Boolean(id),
  });
}
export function useMhdKbFunctionsAdmin(filters: {
  relatedEngine?: string;
  includeArchived?: boolean;
  searchTerm?: string;
}) {
  return useQuery({
    queryKey: mhdKnowledgeCenterQueryKeys.functionsAdmin(filters),
    queryFn: () => mhdKnowledgeCenterService.listFunctionsAdmin({ ...filters, limit: 200 }),
  });
}
export function useMhdKbFunctionAdmin(id: string | null) {
  return useQuery<MhdKbFunctionAdmin | null>({
    queryKey: mhdKnowledgeCenterQueryKeys.functionAdmin(id ?? ''),
    queryFn: () => mhdKnowledgeCenterService.getFunctionAdmin(id!),
    enabled: Boolean(id),
  });
}

function useKbMutation<T>(mutationFn: (input: T) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-knowledge-center'] });
    },
  });
}
export const useMhdCreateKbArticle = () =>
  useKbMutation((input: Parameters<typeof mhdKnowledgeCenterService.createArticle>[0]) =>
    mhdKnowledgeCenterService.createArticle(input),
  );
export const useMhdUpdateKbArticle = () =>
  useKbMutation((input: Parameters<typeof mhdKnowledgeCenterService.updateArticle>[0]) =>
    mhdKnowledgeCenterService.updateArticle(input),
  );
export const useMhdPublishKbArticle = () =>
  useKbMutation((id: string) => mhdKnowledgeCenterService.publishArticle(id));
export const useMhdArchiveKbArticle = () =>
  useKbMutation((id: string) => mhdKnowledgeCenterService.archiveArticle(id));
export const useMhdRestoreKbArticle = () =>
  useKbMutation((id: string) => mhdKnowledgeCenterService.restoreArticle(id));
export const useMhdCreateKbFunction = () =>
  useKbMutation((input: Parameters<typeof mhdKnowledgeCenterService.createFunction>[0]) =>
    mhdKnowledgeCenterService.createFunction(input),
  );
export const useMhdUpdateKbFunction = () =>
  useKbMutation((input: Parameters<typeof mhdKnowledgeCenterService.updateFunction>[0]) =>
    mhdKnowledgeCenterService.updateFunction(input),
  );
export const useMhdArchiveKbFunction = () =>
  useKbMutation((id: string) => mhdKnowledgeCenterService.archiveFunction(id));
export const useMhdRestoreKbFunction = () =>
  useKbMutation((id: string) => mhdKnowledgeCenterService.restoreFunction(id));
