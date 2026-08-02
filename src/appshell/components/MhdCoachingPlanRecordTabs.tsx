import { Link } from 'react-router-dom';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { cn } from '@/utils/cn';

export type MhdCoachingPlanRecordTab = 'detail';

interface MhdCoachingPlanRecordTabsProps {
  planId: string;
  active: MhdCoachingPlanRecordTab;
  className?: string;
  /**
   * Rendered right-aligned after a divider, matching MhdJobRecordTabs' actions
   * slot. A coaching plan's edit/complete/cancel/delete controls are
   * conditional on plan.status and checkpoint completion, so the caller
   * supplies them directly rather than this component owning a fixed
   * editTo/onDelete contract.
   */
  actions?: React.ReactNode;
}

/**
 * Record-nav row for a single coaching plan: Detail only today — plan
 * summary and checkpoints all render inline on the same page rather than as
 * separate routed sub-views. Styled identically to MhdTaskRecordTabs/
 * MhdJobRecordTabs (button pills, primary when active, secondary otherwise).
 */
export function MhdCoachingPlanRecordTabs({
  planId,
  active,
  className,
  actions,
}: MhdCoachingPlanRecordTabsProps) {
  const tabs: Array<{ key: MhdCoachingPlanRecordTab; label: string; to: string }> = [
    { key: 'detail', label: 'Detail', to: `/performance/coaching/${planId}` },
  ];

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            aria-current={isActive ? 'page' : undefined}
            to={tab.to}
            className={cn(
              buttonBaseClasses,
              'h-9 px-3 text-[16.8px]',
              isActive ? buttonVariantClasses.primary : buttonVariantClasses.secondary,
            )}
          >
            {tab.label}
          </Link>
        );
      })}
      {actions ? (
        <div className="ml-auto flex flex-wrap items-center gap-2 border-l border-neutral-200 pl-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
