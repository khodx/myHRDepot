import { Link } from 'react-router-dom';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdPaginationControls } from '@/components/ui/MhdPagination';
import { type MhdPagination } from '@/components/ui/MhdPaginationUtils';
import type { MhdKbCategory, MhdKbSearchResult } from '../Types';
import { MhdKbAccessLevelBadge, MhdKbArticleTypeBadge, MhdKbCompanyBadge } from './MhdKbBadges';
import { MhdKbSnippet } from './MhdKbSnippet';

interface MhdKbSearchResultsProps {
  results: MhdKbSearchResult[];
  total: number;
  pagination: MhdPagination;
  categories: MhdKbCategory[];
}

export function MhdKbSearchResults({
  results,
  total,
  pagination,
  categories,
}: MhdKbSearchResultsProps) {
  const visibleResults = pagination.sliceItems(results);

  return (
    <section className="space-y-4" aria-label="Search results">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {total} {total === 1 ? 'result' : 'results'}
      </p>
      {total > results.length ? (
        <p className="text-sm text-muted-foreground">
          Showing the {results.length} best matches. Refine your search to narrow them.
        </p>
      ) : null}
      {results.length === 0 ? (
        <MhdEmptyState
          title="No results found."
          description="Try different words or browse categories."
        />
      ) : (
        <div className="space-y-3">
          {visibleResults.map((result) => (
            <article key={result.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap gap-2">
                <MhdKbArticleTypeBadge articleType={result.articleType} />
                <MhdKbCompanyBadge companyId={result.companyId} />
                <MhdKbAccessLevelBadge accessLevel={result.accessLevel} />
              </div>
              <Link
                className="mt-2 block text-lg font-semibold text-foreground hover:text-accent"
                to={`/knowledge-center/articles/${result.slug}`}
              >
                {result.title}
              </Link>
              <p className="mt-2 text-sm text-muted-foreground">
                <MhdKbSnippet snippet={result.snippet} />
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {categories.find((category) => category.id === result.categoryId)?.label ??
                  'Knowledge Center'}
              </p>
            </article>
          ))}
          <MhdPaginationControls pagination={pagination} />
        </div>
      )}
    </section>
  );
}
