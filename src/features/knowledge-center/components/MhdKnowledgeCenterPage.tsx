import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFilterInput } from '@/components/ui/MhdFilterBar';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { MhdTabs } from '@/components/ui/MhdTabs';
import { useMhdPagination } from '@/components/ui/MhdPaginationUtils';
import { useMhdDebouncedValue } from '@/utils/useMhdDebouncedValue';
import { useMhdKbArticles, useMhdKbCategories, useMhdKbSearch } from '../Hook';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdCanAccessRoute, mhdIsPlatformAdmin } from '@/appshell/mhdRouteAccess';
import { MhdKbFaqItem } from './MhdKbFaqItem';
import { MhdKbBadges } from './MhdKbBadges';
import { MhdKbSearchResults } from './MhdKbSearchResults';

type KnowledgeCenterTypeFilter = 'ALL' | 'ARTICLE' | 'FAQ';

/** Search results shown per page; the full ranked set is fetched once and paged in memory. */
const MHD_KB_SEARCH_PAGE_SIZE = 20;

export function MhdKnowledgeCenterPage() {
  const { categoryKey } = useParams<{ categoryKey: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const [draftQuery, setDraftQuery] = useState(query);
  const typeParam = searchParams.get('type');
  const type: KnowledgeCenterTypeFilter =
    typeParam === 'ARTICLE' || typeParam === 'FAQ' ? typeParam : 'ALL';
  const articleType = type === 'ALL' ? undefined : type;
  const debouncedQuery = useMhdDebouncedValue(draftQuery);
  const categories = useMhdKbCategories();
  const articles = useMhdKbArticles({
    categoryKey,
    articleType: categoryKey ? articleType : undefined,
    enabled: Boolean(categoryKey),
  });
  const faqs = useMhdKbArticles({ articleType: 'FAQ', enabled: !categoryKey });
  const search = useMhdKbSearch({ query: debouncedQuery, articleType });
  const searchPagination = useMhdPagination(search.data?.items.length ?? 0, {
    pageSize: MHD_KB_SEARCH_PAGE_SIZE,
    resetKey: `${debouncedQuery}:${type}`,
  });
  const category = categories.data?.find((item) => item.key === categoryKey);
  const { roles } = useMhdAuth();
  const canManage = mhdIsPlatformAdmin(roles);
  const canOpenCompanyGuidance = mhdCanAccessRoute('/knowledge-center/company', roles);

  function updateQuery(value: string) {
    setDraftQuery(value);
    const next = new URLSearchParams(searchParams);
    if (value) next.set('q', value);
    else next.delete('q');
    // Replace, don't push: one history entry per keystroke would wreck the back button.
    setSearchParams(next, { replace: true });
  }

  function updateType(value: KnowledgeCenterTypeFilter) {
    const next = new URLSearchParams(searchParams);
    if (value === 'ALL') next.delete('type');
    else next.set('type', value);
    setSearchParams(next, { replace: true });
  }

  if (!categoryKey) {
    return (
      <div className="space-y-6">
        <MhdPageHeader
          title="Knowledge Center"
          description="Browse published HR guidance and reference content."
          actions={
            <div className="flex gap-3 text-sm font-medium">
              <Link to="/knowledge-center/features">Feature Catalog</Link>
              <Link to="/knowledge-center/functions">Functions &amp; Formulas Reference</Link>
              {canOpenCompanyGuidance ? (
                <Link to="/knowledge-center/company">Company Guidance</Link>
              ) : null}
              {canManage ? <Link to="/knowledge-center/admin">Manage Content</Link> : null}
            </div>
          }
        />
        <div className="space-y-3">
          <MhdFilterInput
            label="Search Knowledge Center"
            value={draftQuery}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="Search articles and FAQs"
          />
          <MhdTabs
            tabs={[
              { value: 'ALL', label: 'All' },
              { value: 'ARTICLE', label: 'Articles' },
              { value: 'FAQ', label: 'FAQs' },
            ]}
            value={type}
            onChange={updateType}
          />
        </div>
        {debouncedQuery.trim().length >= 2 ? (
          search.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading results…</p>
          ) : search.isError ? (
            <p className="text-sm text-destructive">Unable to load search results.</p>
          ) : (
            <MhdKbSearchResults
              results={search.data?.items ?? []}
              total={search.data?.totalCount ?? 0}
              pagination={searchPagination}
              categories={categories.data ?? []}
            />
          )
        ) : (
          <>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Browse Categories</h2>
              {categories.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading categories…</p>
              ) : (categories.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No knowledge center categories yet.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {(categories.data ?? []).map((item) => (
                    <Link key={item.id} to={`/knowledge-center/${item.key}`} className="block">
                      <MhdCard className="h-full transition-colors hover:border-accent">
                        <h2 className="font-semibold text-foreground">{item.label}</h2>
                        {item.description ? (
                          <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                        ) : null}
                      </MhdCard>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">Frequently Asked Questions</h2>
              {faqs.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading FAQs…</p>
              ) : null}
              {faqs.isError ? (
                <p className="text-sm text-destructive">Unable to load FAQs.</p>
              ) : null}
              <div className="space-y-2">
                {(faqs.data?.items ?? []).slice(0, 8).map((faq) => (
                  <MhdKbFaqItem key={faq.id} faq={faq} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Knowledge Center"
        description={category?.description ?? 'Published HR guidance and reference content.'}
        backTo="/knowledge-center"
        backLabel="categories"
        actions={
          <div className="flex gap-3 text-sm font-medium">
            <Link to="/knowledge-center/features">Feature Catalog</Link>
            <Link to="/knowledge-center/functions">Functions &amp; Formulas Reference</Link>
            {canOpenCompanyGuidance ? (
              <Link to="/knowledge-center/company">Company Guidance</Link>
            ) : null}
            {canManage ? <Link to="/knowledge-center/admin">Manage Content</Link> : null}
          </div>
        }
      />
      <h2 className="text-xl font-semibold text-foreground">{category?.label ?? 'Category'}</h2>
      <MhdTabs
        tabs={[
          { value: 'ALL', label: 'All' },
          { value: 'ARTICLE', label: 'Articles' },
          { value: 'FAQ', label: 'FAQs' },
        ]}
        value={type}
        onChange={updateType}
      />
      {categories.isLoading || articles.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading articles…</p>
      ) : !category ? (
        <p className="text-sm text-muted-foreground">
          This knowledge center category was not found.
        </p>
      ) : (articles.data?.items ?? []).length === 0 && type !== 'FAQ' ? (
        <p className="text-sm text-muted-foreground">No published articles in this category yet.</p>
      ) : (
        <>
          {type !== 'ARTICLE' ? (
            <div className="space-y-2">
              {(articles.data?.items ?? [])
                .filter((article) => article.articleType === 'FAQ')
                .map((faq) => (
                  <MhdKbFaqItem key={faq.id} faq={faq} />
                ))}
            </div>
          ) : null}
          {type !== 'FAQ' ? (
            <MhdCard className="overflow-hidden p-0">
              <MhdTable>
                <thead>
                  <tr>
                    <MhdTh>Article</MhdTh>
                    <MhdTh>Summary</MhdTh>
                    <MhdTh>Published</MhdTh>
                  </tr>
                </thead>
                <tbody>
                  {(articles.data?.items ?? [])
                    .filter((article) => article.articleType === 'ARTICLE')
                    .map((article) => (
                      <MhdTr key={article.id} to={`/knowledge-center/articles/${article.slug}`}>
                        <MhdTd className="font-medium">
                          <div className="space-y-2">
                            <MhdKbBadges
                              articleType={article.articleType}
                              companyId={article.companyId}
                              accessLevel={article.accessLevel}
                            />
                            {article.title}
                          </div>
                        </MhdTd>
                        <MhdTd className="text-muted-foreground">{article.summary ?? '—'}</MhdTd>
                        <MhdTd className="whitespace-nowrap text-muted-foreground">
                          {article.publishedAt ?? '—'}
                        </MhdTd>
                      </MhdTr>
                    ))}
                </tbody>
              </MhdTable>
            </MhdCard>
          ) : null}
        </>
      )}
    </div>
  );
}
