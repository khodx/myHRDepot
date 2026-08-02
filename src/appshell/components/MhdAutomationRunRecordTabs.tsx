import { Link } from 'react-router-dom';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { cn } from '@/utils/cn';

export type MhdAutomationRunRecordTab = 'detail';

interface MhdAutomationRunRecordTabsProps {
  runId: string;
  active: MhdAutomationRunRecordTab;
  className?: string;
}

/**
 * Record-nav for a single automation run: Detail only. A run is an
 * immutable execution record of what a rule already did — there is no edit
 * and nothing to delete, so unlike MhdTaskRecordTabs/MhdAutomationRuleRecordTabs
 * there is no pinned-right action slot. Styled the same button-pill way
 * (buttonBaseClasses/buttonVariantClasses, primary when active, secondary
 * otherwise) purely for visual consistency across record detail pages.
 */
export function MhdAutomationRunRecordTabs({
  runId,
  active,
  className,
}: MhdAutomationRunRecordTabsProps) {
  const tabs: Array<{ key: MhdAutomationRunRecordTab; label: string; to: string }> = [
    { key: 'detail', label: 'Detail', to: `/automations/runs/${runId}` },
  ];

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {tabs.map((tab) => {
        const isCurrentTab = tab.key === active;
        return (
          <Link
            key={tab.key}
            aria-current={isCurrentTab ? 'page' : undefined}
            to={tab.to}
            className={cn(
              buttonBaseClasses,
              'h-9 px-3 text-[16.8px]',
              isCurrentTab ? buttonVariantClasses.primary : buttonVariantClasses.secondary,
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
