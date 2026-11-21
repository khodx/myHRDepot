import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { mhdFormatDate } from '@/utils/mhdDateFormat';
import {
  MHD_LEAVE_CHECKLIST_STAGE_KEYS,
  type MhdLeaveChecklistItem,
  type MhdLeaveChecklistStatus,
} from '../WorkflowTypes';
import { mhdLeaveEnumLabel } from './mhdLeaveLabels';

export interface MhdLeaveChecklistPanelProps {
  items: MhdLeaveChecklistItem[];
}

const STATUS_VARIANTS: Readonly<Record<MhdLeaveChecklistStatus, MhdBadgeVariant>> = {
  DONE: 'success',
  OPEN: 'info',
  OVERDUE: 'error',
  UPCOMING: 'warning',
  NOT_APPLICABLE: 'neutral',
};

/**
 * The documentation checklist (mhd_leave_documentation_checklist), one section per stage in
 * the database's stage order. Read-only: each item is satisfied by the workflow action it
 * describes, never ticked off here.
 */
export function MhdLeaveChecklistPanel({ items }: MhdLeaveChecklistPanelProps) {
  return (
    <div className="space-y-3">
      {MHD_LEAVE_CHECKLIST_STAGE_KEYS.map((stage) => {
        const stageLabel = mhdLeaveEnumLabel(stage);
        const stageItems = items.filter((item) => item.stage_key === stage);
        return (
          <MhdCard key={stage}>
            <MhdCardHeader title={stageLabel} />
            {stageItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No checklist items for this stage.</p>
            ) : (
              <ul className="space-y-2" aria-label={`${stageLabel} Checklist`}>
                {stageItems.map((item) => (
                  <li
                    key={item.item_key}
                    className="flex flex-wrap items-center justify-between gap-2 text-sm"
                  >
                    <span className="text-foreground">{item.label}</span>
                    <span className="flex items-center gap-2">
                      {item.due_at ? (
                        <span className="text-muted-foreground">
                          Due {mhdFormatDate(item.due_at)}
                        </span>
                      ) : null}
                      <MhdBadge variant={STATUS_VARIANTS[item.status]}>
                        {mhdLeaveEnumLabel(item.status)}
                      </MhdBadge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </MhdCard>
        );
      })}
    </div>
  );
}
