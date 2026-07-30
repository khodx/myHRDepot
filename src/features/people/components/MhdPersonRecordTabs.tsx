import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

export type MhdPersonRecordTab = 'detail';

interface MhdPersonRecordTabsProps {
  personId: string;
  active: MhdPersonRecordTab;
  className?: string;
}

/**
 * Sub-page nav for a single person record: Detail. Edit is a button
 * (MhdDetailActions), not a tab, matching the platform-wide "edit is a
 * button" convention for detail pages.
 */
export function MhdPersonRecordTabs({ personId, active, className }: MhdPersonRecordTabsProps) {
  const tabs: Array<{ key: MhdPersonRecordTab; label: string; to: string }> = [
    { key: 'detail', label: 'Detail', to: `/people/${personId}` },
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
