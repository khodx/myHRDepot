import { MhdRecordTabNav } from '@/components/ui/MhdRecordTabNav';

export type MhdJobRecordTab = 'detail';

interface MhdJobRecordTabsProps {
  jobId: string;
  active: MhdJobRecordTab;
  className?: string;
  /**
   * Rendered right-aligned after a divider, matching MhdTaskRecordTabs' Edit/
   * Delete slot. Job editing is an inline toggle (Edit Job / Cancel Edit) and
   * pay-range editing is its own toggle, not routes, so the caller supplies
   * those controls directly rather than this component owning an editTo
   * contract that would not fit a job's edit-in-place flow.
   */
  actions?: React.ReactNode;
}

/**
 * Record-nav row for a single job: Detail only today — the published
 * description, draft authoring, and pay range all render inline on the same
 * page rather than as separate routed sub-views, so there is nothing else to
 * tab to. Styled identically to MhdTaskRecordTabs (button pills, primary when
 * active, secondary otherwise) so the record-tabs pattern reads the same
 * across modules.
 */
export function MhdJobRecordTabs({ jobId, active, className, actions }: MhdJobRecordTabsProps) {
  const tabs: Array<{ key: MhdJobRecordTab; label: string; to: string }> = [
    { key: 'detail', label: 'Detail', to: `/jobs/${jobId}` },
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
