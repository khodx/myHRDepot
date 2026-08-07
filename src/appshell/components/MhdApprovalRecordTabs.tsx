import { MhdRecordTabNav } from '@/components/ui/MhdRecordTabNav';

export type MhdApprovalRecordTab = 'detail' | 'timeline';

interface MhdApprovalRecordTabsProps {
  approvalId: string;
  active: MhdApprovalRecordTab;
  className?: string;
}

/**
 * Record-nav buttons for a single approval: Detail / Timeline — each its own
 * routed page, same button-pill treatment as MhdTaskRecordTabs (primary when
 * active, secondary otherwise) rather than the older underline tab bar.
 * Approvals have no edit/delete action of their own — a request is approved,
 * rejected, or left pending, never edited or deleted — so there is no
 * pinned-right action slot here, unlike MhdTaskRecordTabs.
 */
export function MhdApprovalRecordTabs({
  approvalId,
  active,
  className,
}: MhdApprovalRecordTabsProps) {
  const tabs: Array<{ key: MhdApprovalRecordTab; label: string; to: string }> = [
    { key: 'detail', label: 'Detail', to: `/approvals/${approvalId}` },
    { key: 'timeline', label: 'Timeline', to: `/approvals/${approvalId}/timeline` },
  ];

  return <MhdRecordTabNav tabs={tabs} active={active} className={className} />;
}
