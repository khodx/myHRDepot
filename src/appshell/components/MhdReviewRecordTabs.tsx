import { Link } from 'react-router-dom';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

export type MhdReviewRecordTab = 'detail';

interface MhdReviewRecordTabsProps {
  reviewId: string;
  active: MhdReviewRecordTab;
  className?: string;
  /**
   * Rendered right-aligned after a divider, matching MhdJobRecordTabs' actions
   * slot. A review's status-transition and edit controls are conditional on
   * review.status, so the caller supplies them directly rather than this
   * component owning a fixed editTo/onDelete contract.
   */
  actions?: React.ReactNode;
}

/**
 * Record-nav row for a single performance review: Detail only today — content,
 * coaching, meeting, document, signature, competencies, and 360 feedback all
 * render inline on the same page rather than as separate routed sub-views.
 * Styled identically to MhdTaskRecordTabs/MhdJobRecordTabs (button pills,
 * primary when active, secondary otherwise).
 */
export function MhdReviewRecordTabs({
  reviewId,
  active,
  className,
  actions,
}: MhdReviewRecordTabsProps) {
  const tabs: Array<{ key: MhdReviewRecordTab; label: string; to: string }> = [
    { key: 'detail', label: 'Detail', to: `/performance/reviews/${reviewId}` },
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
