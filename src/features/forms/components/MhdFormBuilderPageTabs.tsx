import { ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react';
import type { MhdFormPage } from '../Types';

interface MhdFormBuilderPageTabsProps {
  /** Pages sorted by order. */
  pages: MhdFormPage[];
  activePageId: string | null;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
  onRenamePage: (pageId: string, title: string) => void;
  onMovePage: (pageId: string, direction: -1 | 1) => void;
  onRemovePage: (pageId: string) => void;
}

/**
 * Builder-side page management: a tab per page plus rename / reorder / remove
 * controls for the active page. Page membership itself is expressed the same
 * way the assembled definition JSON expresses it — each page carries an
 * ordered `fields: string[]` array (see mhd_assemble_form_pages) — so
 * everything authored here round-trips through mhd_replace_form_definition
 * unchanged.
 */
export function MhdFormBuilderPageTabs({
  pages,
  activePageId,
  onSelectPage,
  onAddPage,
  onRenamePage,
  onMovePage,
  onRemovePage,
}: MhdFormBuilderPageTabsProps) {
  const activePage = pages.find((page) => page.id === activePageId) ?? pages[0] ?? null;
  const activeIndex = activePage ? pages.findIndex((page) => page.id === activePage.id) : -1;

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {pages.map((page, index) => (
          <button
            key={page.id}
            type="button"
            onClick={() => onSelectPage(page.id)}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
              activePage?.id === page.id
                ? 'border-accent bg-accent-tint text-accent-hover'
                : 'border-border bg-card text-muted-foreground hover:border-accent'
            }`}
          >
            {page.title || `Page ${index + 1}`}
            <span className="ml-2 text-xs text-muted-foreground">{page.fields.length}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={onAddPage}
          className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:border-accent"
        >
          <Plus className="h-4 w-4" />
          Add Page
        </button>
      </div>

      {activePage ? (
        <div className="flex flex-wrap items-center gap-2">
          <label
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            htmlFor="mhd-active-page-title"
          >
            Page Title
          </label>
          <input
            id="mhd-active-page-title"
            type="text"
            value={activePage.title}
            onChange={(event) => onRenamePage(activePage.id, event.target.value)}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
          <button
            type="button"
            aria-label="Move page earlier"
            onClick={() => onMovePage(activePage.id, -1)}
            disabled={activeIndex <= 0}
            className="rounded-md border border-border p-1.5 text-muted-foreground disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Move page later"
            onClick={() => onMovePage(activePage.id, 1)}
            disabled={activeIndex < 0 || activeIndex >= pages.length - 1}
            className="rounded-md border border-border p-1.5 text-muted-foreground disabled:opacity-40"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Remove page"
            onClick={() => onRemovePage(activePage.id)}
            disabled={pages.length <= 1}
            className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1.5 text-sm font-medium text-red-600 disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
            Remove Page
          </button>
        </div>
      ) : null}
    </div>
  );
}
