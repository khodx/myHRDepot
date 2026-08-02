import { Link } from 'react-router-dom';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

export type MhdHandbookRecordTab = 'detail' | 'acknowledgments';

interface MhdHandbookRecordTabsProps {
  handbookId: string;
  active: MhdHandbookRecordTab;
  className?: string;
}

/**
 * Record-nav buttons for a single handbook: Detail / Acknowledgments — each
 * its own routed page, same button-pill treatment as MhdTaskRecordTabs
 * (primary when active, secondary otherwise) rather than the older underline
 * tab bar. Editing a handbook is inline section toggling on the Detail tab
 * while it is DRAFT, not a separate edit route, and there is no delete —
 * only Archive, which stays an in-page action on Detail — so there is no
 * pinned-right action slot here, unlike MhdTaskRecordTabs.
 */
export function MhdHandbookRecordTabs({
  handbookId,
  active,
  className,
}: MhdHandbookRecordTabsProps) {
  const tabs: Array<{ key: MhdHandbookRecordTab; label: string; to: string }> = [
    { key: 'detail', label: 'Detail', to: `/handbooks/${handbookId}` },
    {
      key: 'acknowledgments',
      label: 'Acknowledgments',
      to: `/handbooks/${handbookId}/acknowledgments`,
    },
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
