import { Link } from 'react-router-dom';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

export type MhdTaskRecordTab = 'detail' | 'notes' | 'activities' | 'attachments' | 'reports';

interface MhdTaskRecordTabsProps {
  taskId: string;
  active: MhdTaskRecordTab;
  className?: string;
}

/**
 * Record-nav buttons for a single task: Detail / Notes / Activities /
 * Attachments / Reports — each its own routed page. Rendered as buttons
 * (primary when active, secondary otherwise), not underlined tabs, matching
 * the platform-wide "these are buttons" convention (same reasoning that
 * moved Edit off a tab and onto MhdDetailActions). The only modals in this
 * flow are the "new/create" forms inside each page (Add Note, Add Activity,
 * Generate Report) — these buttons always navigate to a full page.
 */
export function MhdTaskRecordTabs({ taskId, active, className }: MhdTaskRecordTabsProps) {
  const tabs: Array<{ key: MhdTaskRecordTab; label: string; to: string }> = [
    { key: 'detail', label: 'Detail', to: `/tasks/${taskId}` },
    { key: 'notes', label: 'Notes', to: `/tasks/${taskId}/notes` },
    { key: 'activities', label: 'Activities', to: `/tasks/${taskId}/activities` },
    { key: 'attachments', label: 'Attachments', to: `/tasks/${taskId}/attachments` },
    { key: 'reports', label: 'Reports', to: `/tasks/${taskId}/reports` },
  ];

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            aria-current={isActive ? 'page' : undefined}
            to={tab.to}
            className={cn(
              buttonBaseClasses,
              'h-9 px-3 text-sm',
              isActive ? buttonVariantClasses.primary : buttonVariantClasses.secondary,
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
