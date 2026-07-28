import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

export type MhdTaskRecordTab = 'detail' | 'edit' | 'notes';

interface MhdTaskRecordTabsProps {
  taskId: string;
  active: MhdTaskRecordTab;
  className?: string;
}

/**
 * Sub-page nav for a single task record: Detail / Edit / Notes. Same
 * route-linked underline tab pattern as MhdFormRecordTabs.tsx — these three
 * are separate full-page routes, not in-page state.
 */
export function MhdTaskRecordTabs({ taskId, active, className }: MhdTaskRecordTabsProps) {
  const tabs: Array<{ key: MhdTaskRecordTab; label: string; to: string }> = [
    { key: 'detail', label: 'Detail', to: `/tasks/${taskId}` },
    { key: 'edit', label: 'Edit', to: `/tasks/${taskId}/edit` },
    { key: 'notes', label: 'Notes', to: `/tasks/${taskId}/notes` },
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
