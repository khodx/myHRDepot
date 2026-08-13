import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

export type MhdCommunicationsTab = 'overview' | 'messaging' | 'inbox' | 'system-alerts';

interface MhdCommunicationsTabsProps {
  active: MhdCommunicationsTab;
  className?: string;
}

/**
 * Sub-page nav for the Communications module: Overview / Messaging / System
 * Alerts. Same route-linked underline tab pattern as MhdFormRecordTabs.tsx.
 * Lives in appshell rather than either feature folder since Messaging
 * (src/features/messaging) and System Alerts (src/features/communications)
 * are separate features and the mhd-feature-boundary lint rule blocks
 * feature-to-feature internal imports.
 */
export function MhdCommunicationsTabs({ active, className }: MhdCommunicationsTabsProps) {
  const tabs: Array<{ key: MhdCommunicationsTab; label: string; to: string }> = [
    { key: 'overview', label: 'Overview', to: '/communications' },
    { key: 'messaging', label: 'Messaging', to: '/communications/messaging' },
    { key: 'inbox', label: 'Inbox', to: '/communications/inbox' },
    { key: 'system-alerts', label: 'System Alerts', to: '/communications/system-alerts' },
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
