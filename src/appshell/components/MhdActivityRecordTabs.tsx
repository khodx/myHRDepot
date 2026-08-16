import { MhdRecordTabNav } from '@/components/ui/MhdRecordTabNav';

export type MhdActivityRecordTab = 'detail' | 'messages';

interface MhdActivityRecordTabsProps {
  activityId: string;
  active: MhdActivityRecordTab;
  className?: string;
  /**
   * Rendered right-aligned after a divider, matching MhdJobRecordTabs' actions
   * slot. An activity's Edit/Delete controls are conditional on canMutate, so
   * the caller supplies them directly rather than this component owning a
   * fixed editTo/onDelete contract.
   */
  actions?: React.ReactNode;
}

/**
 * Record-nav row for a single activity: Detail only today — participants,
 * checklist, outcome, notes, and attachments all render inline on the same
 * page rather than as separate routed sub-views. Styled identically to
 * MhdTaskRecordTabs/MhdJobRecordTabs (button pills, primary when active,
 * secondary otherwise).
 */
export function MhdActivityRecordTabs({
  activityId,
  active,
  className,
  actions,
}: MhdActivityRecordTabsProps) {
  const tabs: Array<{ key: MhdActivityRecordTab; label: string; to: string }> = [
    { key: 'detail', label: 'Detail', to: `/activities/${activityId}` },
    { key: 'messages', label: 'Messages', to: `/activities/${activityId}/messages` },
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
