import { Link, useParams } from 'react-router-dom';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdKbArticles, useMhdKbCategories } from '../Hook';

export function MhdKnowledgeCenterPage() {
  const { categoryKey } = useParams<{ categoryKey: string }>();
  const categories = useMhdKbCategories();
  const articles = useMhdKbArticles({ categoryKey });
  const category = categories.data?.find((item) => item.key === categoryKey);

  if (!categoryKey) {
    return (
      <div className="space-y-6">
        <MhdPageHeader
          title="Knowledge Center"
          description="Browse published HR guidance and reference content."
        />
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
    );
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Knowledge Center"
        description={category?.description ?? 'Published HR guidance and reference content.'}
        backTo="/knowledge-center"
        backLabel="categories"
      />
      <h2 className="text-xl font-semibold text-foreground">{category?.label ?? 'Category'}</h2>
      {categories.isLoading || articles.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading articles…</p>
      ) : !category ? (
        <p className="text-sm text-muted-foreground">
          This knowledge center category was not found.
        </p>
      ) : (articles.data?.items ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">No published articles in this category yet.</p>
      ) : (
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
              {(articles.data?.items ?? []).map((article) => (
                <MhdTr key={article.id} to={`/knowledge-center/articles/${article.slug}`}>
                  <MhdTd className="font-medium">{article.title}</MhdTd>
                  <MhdTd className="text-muted-foreground">{article.summary ?? '—'}</MhdTd>
                  <MhdTd className="whitespace-nowrap text-muted-foreground">
                    {article.publishedAt ?? '—'}
                  </MhdTd>
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
        </MhdCard>
      )}
    </div>
  );
}
