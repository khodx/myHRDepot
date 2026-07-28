import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

export type MhdFormRecordTab = 'detail' | 'builder' | 'submissions';

interface MhdFormRecordTabsProps {
  formId: string;
  active: MhdFormRecordTab;
  /** Viewer/read-only users see "View" instead of "Builder" on the edit tab. */
  canMutate: boolean;
  className?: string;
}

/**
 * Sub-page nav for a single form record: Detail / Builder / Submissions.
 * Route-linked variant of the underline tab bar in MhdTabs.tsx (same
 * category-spec §4 visual contract) — these three are separate routes
 * rather than in-page state, so tabs are Links, not buttons.
 */
export function MhdFormRecordTabs({
  formId,
  active,
  canMutate,
  className,
}: MhdFormRecordTabsProps) {
  const tabs: Array<{ key: MhdFormRecordTab; label: string; to: string }> = [
    { key: 'detail', label: 'Detail', to: `/forms/${formId}` },
    { key: 'builder', label: canMutate ? 'Builder' : 'View', to: `/forms/${formId}/edit` },
    { key: 'submissions', label: 'Submissions', to: `/forms/${formId}/submissions` },
  ];

  return (
    <div role="tablist" className={cn('flex gap-1 border-b border-border', className)}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            to={tab.to}
            className={cn(
              '-mb-px inline-flex items-center gap-1.5 border-b-[3px] px-3 py-2 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
              isActive
                ? 'border-accent text-accent-hover'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
