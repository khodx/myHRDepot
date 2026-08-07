import { MhdRecordTabNav } from '@/components/ui/MhdRecordTabNav';

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

  return <MhdRecordTabNav tabs={tabs} active={active} className={className} />;
}
