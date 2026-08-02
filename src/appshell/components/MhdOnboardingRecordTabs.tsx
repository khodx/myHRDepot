import { Link } from 'react-router-dom';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

export type MhdOnboardingRecordTab = 'detail';

interface MhdOnboardingRecordTabsProps {
  personId: string;
  active: MhdOnboardingRecordTab;
  className?: string;
  /**
   * Rendered right-aligned after a divider, matching MhdTaskRecordTabs' Edit/
   * Delete slot. Onboarding has a single non-route action (Cancel Onboarding,
   * which opens an inline reason-required form rather than an immediate
   * window.confirm), so the caller supplies that control directly instead of
   * this component owning an onDelete/editTo contract that would not fit it.
   */
  actions?: React.ReactNode;
}

/**
 * Record-nav row for a single onboarding packet: Detail only today — the
 * packet checklist renders inline on the same page rather than as a separate
 * routed sub-view, so there is nothing else to tab to. Styled identically to
 * MhdTaskRecordTabs (button pills, primary when active, secondary otherwise)
 * so the record-tabs pattern reads the same across modules.
 */
export function MhdOnboardingRecordTabs({
  personId,
  active,
  className,
  actions,
}: MhdOnboardingRecordTabsProps) {
  const tabs: Array<{ key: MhdOnboardingRecordTab; label: string; to: string }> = [
    { key: 'detail', label: 'Detail', to: `/onboarding/${personId}` },
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
        <div className="ml-auto flex items-center gap-2 border-l border-neutral-200 pl-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
