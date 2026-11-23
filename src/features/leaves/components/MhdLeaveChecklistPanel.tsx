import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MHD_DRAFT_KINDS, MHD_DRAFT_NEW_KEY } from '@/features/drafts/Types';
import { mhdFormatDate } from '@/utils/mhdDateFormat';
import {
  useMhdLeaveChecklistAdd,
  useMhdLeaveChecklistEdit,
  useMhdLeaveChecklistRemove,
  useMhdLeaveChecklistStatus,
} from '../WorkflowHook';
import { mhdLeaveChecklistDueDate } from '../WorkflowService';
import {
  MHD_LEAVE_CHECKLIST_STAGE_KEYS,
  type MhdLeaveChecklistAction,
  type MhdLeaveChecklistItem,
  type MhdLeaveChecklistItemInput,
  type MhdLeaveChecklistStageKey,
  type MhdLeaveChecklistStatus,
} from '../WorkflowTypes';
import { MhdLeaveActionButtons, MhdLeaveActionModal } from './MhdLeaveActionModal';
import { useMhdLeaveDraftField } from './mhdLeaveActionContext';
import { mhdLeaveEnumLabel } from './mhdLeaveLabels';

/** Present only for the roles that may adjust the checklist (mhdCanEditLeaveChecklist). */
export interface MhdLeaveChecklistEditScope {
  caseId: string;
  companyId: string | null;
}

export interface MhdLeaveChecklistPanelProps {
  items: MhdLeaveChecklistItem[];
  /** Omit for a read-only checklist; the database re-checks the role and company on every write. */
  edit?: MhdLeaveChecklistEditScope;
}

const STATUS_VARIANTS: Readonly<Record<MhdLeaveChecklistStatus, MhdBadgeVariant>> = {
  DONE: 'success',
  OPEN: 'info',
  OVERDUE: 'error',
  UPCOMING: 'warning',
  NOT_APPLICABLE: 'neutral',
};

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

/**
 * The documentation checklist (mhd_leave_documentation_checklist), one section per stage in the
 * database's stage order. The rules generate the baseline; with `edit`, Platform Admin and HR
 * roles adjust it per case (0395): add an item, edit any item, mark a generated item Not
 * Applicable or restore it, mark any item Done or reopen it, and remove an added item.
 */
export function MhdLeaveChecklistPanel({ items, edit }: MhdLeaveChecklistPanelProps) {
  if (edit) return <MhdLeaveChecklistEditor items={items} scope={edit} />;
  return <MhdLeaveChecklistStages items={items} />;
}

function MhdLeaveChecklistStages({
  items,
  renderActions,
}: {
  items: MhdLeaveChecklistItem[];
  renderActions?: (item: MhdLeaveChecklistItem) => ReactNode;
}) {
  return (
    <>
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
                  <li key={item.item_key} className="space-y-1 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex flex-wrap items-center gap-2 text-foreground">
                        {item.label}
                        {item.is_custom ? <MhdBadge variant="neutral">Added</MhdBadge> : null}
                        {item.is_overridden ? (
                          <MhdBadge variant="neutral">Adjusted</MhdBadge>
                        ) : null}
                      </span>
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
                    </div>
                    {item.status_set_by_name && item.status_set_at ? (
                      <p className="text-xs text-muted-foreground">
                        {mhdLeaveEnumLabel(item.status)} set by {item.status_set_by_name} on{' '}
                        {mhdFormatDate(item.status_set_at)}
                      </p>
                    ) : null}
                    {item.note ? (
                      <p className="text-xs text-muted-foreground">{item.note}</p>
                    ) : null}
                    {renderActions ? (
                      <div className="flex flex-wrap gap-2">{renderActions(item)}</div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </MhdCard>
        );
      })}
    </>
  );
}

type EditorTarget = { mode: 'add' } | { mode: 'edit'; item: MhdLeaveChecklistItem };

function MhdLeaveChecklistEditor({
  items,
  scope,
}: {
  items: MhdLeaveChecklistItem[];
  scope: MhdLeaveChecklistEditScope;
}) {
  const { caseId, companyId } = scope;
  const add = useMhdLeaveChecklistAdd(caseId);
  const editItem = useMhdLeaveChecklistEdit(caseId);
  const setStatus = useMhdLeaveChecklistStatus(caseId);
  const remove = useMhdLeaveChecklistRemove(caseId);
  const [target, setTarget] = useState<EditorTarget | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = setStatus.isPending || remove.isPending;

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The checklist change failed.');
    }
  }

  function changeStatus(item: MhdLeaveChecklistItem, action: MhdLeaveChecklistAction) {
    void run(() => setStatus.mutateAsync({ caseId, itemKey: item.item_key, action }));
  }

  function removeItem(item: MhdLeaveChecklistItem) {
    if (!window.confirm(`Remove "${item.label}" from this case's checklist?`)) return;
    void run(() => remove.mutateAsync({ caseId, itemKey: item.item_key }));
  }

  function renderActions(item: MhdLeaveChecklistItem) {
    const notApplicableByHand =
      !item.is_custom &&
      item.status === 'NOT_APPLICABLE' &&
      item.generated_status !== 'NOT_APPLICABLE';
    return (
      <>
        <Button
          variant="secondary"
          aria-label={`Edit ${item.label}`}
          onClick={() => setTarget({ mode: 'edit', item })}
        >
          Edit
        </Button>
        {item.status === 'DONE' ? (
          <Button
            variant="secondary"
            disabled={busy}
            aria-label={`Reopen ${item.label}`}
            onClick={() => changeStatus(item, 'REOPEN')}
          >
            Reopen
          </Button>
        ) : item.status !== 'NOT_APPLICABLE' ? (
          <Button
            variant="secondary"
            disabled={busy}
            aria-label={`Mark Done ${item.label}`}
            onClick={() => changeStatus(item, 'MARK_DONE')}
          >
            Mark Done
          </Button>
        ) : null}
        {notApplicableByHand ? (
          <Button
            variant="secondary"
            disabled={busy}
            aria-label={`Restore ${item.label}`}
            onClick={() => changeStatus(item, 'RESTORE')}
          >
            Restore
          </Button>
        ) : !item.is_custom && item.status !== 'NOT_APPLICABLE' ? (
          <Button
            variant="secondary"
            disabled={busy}
            aria-label={`Mark Not Applicable ${item.label}`}
            onClick={() => changeStatus(item, 'MARK_NOT_APPLICABLE')}
          >
            Mark Not Applicable
          </Button>
        ) : null}
        {item.is_custom ? (
          <Button
            variant="destructive"
            disabled={busy}
            aria-label={`Remove ${item.label}`}
            onClick={() => removeItem(item)}
          >
            Remove
          </Button>
        ) : null}
      </>
    );
  }

  const editing = target?.mode === 'edit' ? target.item : null;
  const draftItemKey = editing ? editing.item_key : MHD_DRAFT_NEW_KEY;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          The rules generate this checklist. Adjust it where this case differs; every change is
          audited.
        </p>
        <Button onClick={() => setTarget({ mode: 'add' })}>Add Item</Button>
      </div>
      {error ? (
        <p role="alert" className="rounded-md bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}
      <MhdLeaveChecklistStages items={items} renderActions={renderActions} />
      <MhdLeaveActionModal
        key={draftItemKey}
        caseId={caseId}
        companyId={companyId}
        action={`checklist:${draftItemKey}`}
        draftKind={MHD_DRAFT_KINDS.leaveChecklistItem}
        title={editing ? 'Edit Checklist Item' : 'Add Checklist Item'}
        description={
          editing && !editing.is_custom
            ? 'A generated item keeps its rule-based tracking. Leave the due date empty to keep the rule-based deadline.'
            : undefined
        }
        open={target !== null}
        onOpenChange={(open) => {
          if (!open) setTarget(null);
        }}
      >
        <MhdLeaveChecklistItemForm
          item={editing}
          isPending={add.isPending || editItem.isPending}
          onSubmit={(input) =>
            editing
              ? editItem.mutateAsync({ ...input, caseId, itemKey: editing.item_key })
              : add.mutateAsync({ ...input, caseId })
          }
        />
      </MhdLeaveActionModal>
    </div>
  );
}

function MhdLeaveChecklistItemForm({
  item,
  isPending,
  onSubmit,
}: {
  item: MhdLeaveChecklistItem | null;
  isPending: boolean;
  onSubmit: (input: Omit<MhdLeaveChecklistItemInput, 'caseId'>) => Promise<unknown>;
}) {
  const [stageKey, setStageKey] = useMhdLeaveDraftField<MhdLeaveChecklistStageKey>(
    'stageKey',
    item?.stage_key ?? MHD_LEAVE_CHECKLIST_STAGE_KEYS[0],
  );
  const [label, setLabel] = useMhdLeaveDraftField('label', item?.label ?? '');
  const [dueDate, setDueDate] = useMhdLeaveDraftField(
    'dueDate',
    // A generated item's rule-based deadline is not copied in: an empty date keeps it tracking the rules.
    item?.is_custom || item?.due_overridden ? mhdLeaveChecklistDueDate(item.due_at) : '',
  );
  const [note, setNote] = useMhdLeaveDraftField('note', item?.note ?? '');

  return (
    <div className="space-y-3">
      <MhdFormFieldStack>
        <label className="block text-xs">
          Stage
          <select
            className={`mt-1 ${inputClass}`}
            value={stageKey}
            onChange={(e) => setStageKey(e.target.value as MhdLeaveChecklistStageKey)}
          >
            {MHD_LEAVE_CHECKLIST_STAGE_KEYS.map((value) => (
              <option key={value} value={value}>
                {mhdLeaveEnumLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs">
          Label
          <input
            className={`mt-1 ${inputClass}`}
            value={label}
            maxLength={300}
            onChange={(e) => setLabel(e.target.value)}
          />
        </label>
        <label className="block text-xs">
          Due date (optional)
          <MhdDateField
            className={`mt-1 ${inputClass}`}
            value={dueDate}
            onChange={setDueDate}
            aria-label="Due date"
          />
        </label>
        <label className="block text-xs">
          Note (optional)
          <textarea
            className={`mt-1 min-h-20 ${inputClass}`}
            value={note}
            maxLength={2000}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why this case differs—no medical details"
          />
        </label>
      </MhdFormFieldStack>
      <MhdLeaveActionButtons
        submitLabel={item ? 'Save Changes' : 'Add Item'}
        disabled={isPending || !label.trim()}
        onSubmit={() => onSubmit({ stageKey, label, dueDate: dueDate || null, note: note || null })}
      />
    </div>
  );
}
