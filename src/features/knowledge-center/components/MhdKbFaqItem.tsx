import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMhdKbArticle } from '../Hook';
import type { MhdKbArticleListItem } from '../Types';
import { MhdKbArticleBody } from './MhdKbArticleBody';

export function MhdKbFaqItem({ faq }: { faq: MhdKbArticleListItem }) {
  const [expanded, setExpanded] = useState(false);
  const answerId = useId();
  const article = useMhdKbArticle(expanded ? faq.slug : '');

  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 p-4 text-left font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        aria-expanded={expanded}
        aria-controls={answerId}
        onClick={() => setExpanded((current) => !current)}
      >
        <span>{faq.title}</span>
        <span aria-hidden>{expanded ? '−' : '+'}</span>
      </button>
      {expanded ? (
        <div id={answerId} className="space-y-3 border-t border-border p-4">
          {article.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading answer…</p>
          ) : null}
          {article.isError ? (
            <p className="text-sm text-destructive">Unable to load this answer.</p>
          ) : null}
          {article.data ? (
            <>
              <MhdKbArticleBody body={article.data.body} bodyFormat={article.data.bodyFormat} />
              <Link
                className="text-sm font-medium text-accent hover:underline"
                to={`/knowledge-center/articles/${faq.slug}`}
              >
                View Full Article
              </Link>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
