import { MhdRecordTabNav } from '@/components/ui/MhdRecordTabNav';

export type MhdPropertyRecordTab = 'detail';

interface MhdPropertyRecordTabsProps {
  itemId: string;
  active: MhdPropertyRecordTab;
  className?: string;
  /**
   * Rendered right-aligned after a divider, matching MhdTaskRecordTabs' Edit/
   * Delete slot. Property item editing and issuance are inline toggles (Edit
   * Item / Issue Property), not routes, so the caller supplies those controls
   * directly rather than this component owning an editTo contract that would
   * not fit an edit-in-place flow.
   */
  actions?: React.ReactNode;
}

/**
 * Record-nav row for a single property item: Detail only today — active
 * assignments and assignment history render inline on the same page rather
 * than as separate routed sub-views, so there is nothing else to tab to.
 * Styled identically to MhdTaskRecordTabs (button pills, primary when active,
 * secondary otherwise) so the record-tabs pattern reads the same across
 * modules.
 */
export function MhdPropertyRecordTabs({
  itemId,
  active,
  className,
  actions,
}: MhdPropertyRecordTabsProps) {
  const tabs: Array<{ key: MhdPropertyRecordTab; label: string; to: string }> = [
    { key: 'detail', label: 'Detail', to: `/property/${itemId}` },
  ];

  return (
    <MhdRecordTabNav tabs={tabs} active={active} className={className}>
      {actions ? (
        <div className="ml-auto flex flex-wrap items-center gap-2 border-l border-neutral-200 pl-2">
          {actions}
        </div>
      ) : null}
    </MhdRecordTabNav>
  );
}
