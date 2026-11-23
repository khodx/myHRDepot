import { useMhdBenefitIntakeDrafts } from '@/features/benefit-intake/Hook';
import { MhdBenefitIntakeButton } from '@/components/ui/MhdBenefitIntakeButton';
import { MhdCard } from '@/components/ui/MhdCard';

export type MhdBenefitIntakeTab = 'ALL' | 'DRAFTS' | 'IN_PROGRESS' | 'SUBMITTED_CURRENT';

const TAB_LABELS: Record<MhdBenefitIntakeTab, string> = {
  ALL: 'All',
  DRAFTS: 'Drafts',
  IN_PROGRESS: 'In Progress',
  SUBMITTED_CURRENT: 'Submitted / Current',
};

interface MhdBenefitIntakeTabsProps {
  value: MhdBenefitIntakeTab;
  onChange: (tab: MhdBenefitIntakeTab) => void;
  counts: Record<Exclude<MhdBenefitIntakeTab, 'DRAFTS'>, number>;
}

/** Drafts / In Progress / Submitted tabs shared by the Leaves and Accommodations dashboards. */
export function MhdBenefitIntakeTabs({ value, onChange, counts }: MhdBenefitIntakeTabsProps) {
  const drafts = useMhdBenefitIntakeDrafts();
  const draftCount = drafts.data?.length ?? 0;
  const tabs = Object.keys(TAB_LABELS) as MhdBenefitIntakeTab[];
  return (
    <div role="tablist" aria-label="Request status" className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const count = tab === 'DRAFTS' ? draftCount : counts[tab];
        const selected = tab === value;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab)}
            className={
              selected
                ? 'rounded-md border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground'
                : 'rounded-md border border-border px-3 py-1.5 text-sm font-medium'
            }
          >
            {TAB_LABELS[tab]} ({count})
          </button>
        );
      })}
    </div>
  );
}

/** The saved, unsubmitted requests of the signed-in user; one Resume opens the saved draft. */
export function MhdBenefitIntakeDraftsPanel() {
  const drafts = useMhdBenefitIntakeDrafts();
  const items = drafts.data ?? [];
  return (
    <MhdCard className="space-y-3">
      {drafts.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {items.map((draft) => (
        <p key={draft.id} className="text-sm">
          {draft.title ?? 'Leave or accommodation request'}
        </p>
      ))}
      {!drafts.isLoading && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No saved requests.</p>
      ) : null}
      {items.length > 0 ? <MhdBenefitIntakeButton label="Resume Draft" /> : null}
    </MhdCard>
  );
}
