import { useEffect, useRef, useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useMhdContextualHelpArticles } from '../Hook';

export function MhdContextualHelpButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();
  const { data: articles, isLoading } = useMhdContextualHelpArticles(pathname);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Help"
        className="mhd-topbar-icon-btn inline-flex flex-col items-center justify-center gap-0.5 rounded-lg p-1.5 text-muted-foreground transition-colors"
      >
        <HelpCircle className="mhd-topbar-icon-glyph h-[39.6px] w-[39.6px]" aria-hidden />
        <span aria-hidden className="text-sm font-medium leading-none whitespace-nowrap">
          Help
        </span>
      </button>

      {isOpen && (
        <MhdContextualHelpPanel
          articles={articles}
          isLoading={isLoading}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

function MhdContextualHelpPanel({
  articles,
  isLoading,
  onClose,
}: {
  articles: ReturnType<typeof useMhdContextualHelpArticles>['data'];
  isLoading: boolean;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border border-border bg-card shadow-lg"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Page help</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close help"
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto px-4 py-3">
        {isLoading ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>
        ) : articles.length > 0 ? (
          <div className="flex flex-col gap-1">
            {articles.map((article) => (
              <Link
                key={article.id}
                to={`/knowledge-center/articles/${article.slug}`}
                onClick={onClose}
                className="rounded-md px-2 py-2 text-sm text-foreground transition-colors hover:bg-muted"
              >
                {article.title}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground">
            <p>No page-specific help yet</p>
            <Link
              to="/knowledge-center"
              onClick={onClose}
              className="mt-2 inline-block font-medium text-foreground underline underline-offset-2"
            >
              Browse the Knowledge Center
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
