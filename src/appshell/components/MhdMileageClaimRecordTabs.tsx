import { Link } from 'react-router-dom';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { cn } from '@/utils/cn';

export type MhdMileageClaimRecordTab = 'detail';

interface MhdMileageClaimRecordTabsProps {
  claimId: string;
  active: MhdMileageClaimRecordTab;
  className?: string;
}

/**
 * Record-nav row for a single mileage claim: Detail (only tab today — a claim
 * has no separate notes/attachments/audit sub-views, just its lines and
 * workflow actions in the body below). Mirrors MhdTaskRecordTabs' and
 * MhdAccommodationCaseRecordTabs' button-pill convention so opening a record
 * looks the same across modules.
 *
 * No Edit/Delete pinned to the right: a claim has no edit route, and Submit /
 * Cancel / Decide are three coequal workflow actions that live together in
 * the detail body (MhdClaimDetailPanel) rather than one of them being
 * promoted to a standalone "delete" affordance up here.
 */
export function MhdMileageClaimRecordTabs({
  claimId,
  active,
  className,
}: MhdMileageClaimRecordTabsProps) {
  const tabs: Array<{ key: MhdMileageClaimRecordTab; label: string; to: string }> = [
    { key: 'detail', label: 'Detail', to: `/mileage/claims/${claimId}` },
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
    </div>
  );
}
