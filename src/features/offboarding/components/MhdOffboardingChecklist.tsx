import { zodResolver } from '@hookform/resolvers/zod';
import { AlarmClock, ExternalLink, ListChecks, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdDetailActions } from '@/components/ui/MhdDetailActions';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import {
  mhdCustomItemSchema,
  mhdItemWaiverSchema,
  type MhdCustomItemSchemaInput,
  type MhdItemWaiverSchemaInput,
} from '../Schemas';
import { useMhdOffboardingItemActions } from '../Hook';
import {
  type MhdOffboardingCaseStatus,
  type MhdOffboardingChecklistItem,
  type MhdOffboardingOption,
  mhdBuildEvidenceLinkHref,
  mhdFormatEvidenceLinkType,
} from '../Types';
import { MhdItemStatusBadge } from './MhdItemStatusBadge';

interface Props {
  caseId: string;
  caseStatus: MhdOffboardingCaseStatus;
  items: MhdOffboardingChecklistItem[];
  /** Assignable users (v1: privileged-role users only — the server validates). */
  assignees: MhdOffboardingOption[];
  canMutate: boolean;
}

function formatDate(value: string | null): string {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString() : '—';
}

function MhdItemWaiverForm({
  item,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  item: MhdOffboardingChecklistItem;
  onSubmit: (input: MhdItemWaiverSchemaInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdItemWaiverSchemaInput>({
    resolver: zodResolver(mhdItemWaiverSchema),
    defaultValues: { status: 'WAIVED' },
  });

  return (
    <form
      className="mt-3 space-y-3 rounded-md border border-amber-200 bg-amber-50 p-4"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div>
        <label
          htmlFor={`mhd-offboarding-item-waiver-status-${item.id}`}
          className="mb-1 block text-sm font-medium"
        >
          Resolution
        </label>
        <select
          id={`mhd-offboarding-item-waiver-status-${item.id}`}
          className="w-full rounded border px-3 py-2"
          {...register('status')}
        >
          <option value="WAIVED">Waived</option>
          <option value="NOT_APPLICABLE">Not Applicable</option>
        </select>
      </div>
      <div>
        <label
          htmlFor={`mhd-offboarding-item-waiver-reason-${item.id}`}
          className="mb-1 block text-sm font-medium"
        >
          Reason (required)
        </label>
        <textarea
          id={`mhd-offboarding-item-waiver-reason-${item.id}`}
          className="w-full rounded border px-3 py-2"
          rows={3}
          placeholder="e.g. Fully-remote contractor — no company property was ever issued."
          {...register('reason')}
        />
        {errors.reason ? (
          <p className="mt-1 text-xs text-red-600">{errors.reason.message}</p>
        ) : null}
      </div>
      <p className="text-xs text-amber-800">
        Waiving or marking not-applicable is audited distinctly (ITEM_WAIVED) with this reason.
      </p>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-amber-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : 'Confirm'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function MhdCustomItemForm({
  caseId,
  assignees,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  caseId: string;
  assignees: MhdOffboardingOption[];
  onSubmit: (input: MhdCustomItemSchemaInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdCustomItemSchemaInput>({
    resolver: zodResolver(mhdCustomItemSchema),
    defaultValues: { caseId, isRequired: false },
  });

  return (
    <form
      className="space-y-4 rounded-md border border-border bg-muted p-4"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="mhd-offboarding-custom-item-title"
            className="mb-1 block text-sm font-medium"
          >
            Title
          </label>
          <input
            id="mhd-offboarding-custom-item-title"
            type="text"
            className="w-full rounded border px-3 py-2"
            placeholder="e.g. Return parking pass"
            {...register('title')}
          />
          {errors.title ? (
            <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
          ) : null}
        </div>
        <div>
          <label
            htmlFor="mhd-offboarding-custom-item-assignee"
            className="mb-1 block text-sm font-medium"
          >
            Assignee
          </label>
          <select
            id="mhd-offboarding-custom-item-assignee"
            className="w-full rounded border px-3 py-2"
            {...register('assignedUserId')}
          >
            <option value="">Unassigned</option>
            {assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.label}
              </option>
            ))}
          </select>
          {errors.assignedUserId ? (
            <p className="mt-1 text-xs text-red-600">{errors.assignedUserId.message}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label
          htmlFor="mhd-offboarding-custom-item-description"
          className="mb-1 block text-sm font-medium"
        >
          Description
        </label>
        <textarea
          id="mhd-offboarding-custom-item-description"
          className="w-full rounded border px-3 py-2"
          rows={2}
          {...register('description')}
        />
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label
            htmlFor="mhd-offboarding-custom-item-due"
            className="mb-1 block text-sm font-medium"
          >
            Due Date
          </label>
          <input
            id="mhd-offboarding-custom-item-due"
            type="date"
            className="rounded border px-3 py-2"
            {...register('dueDate')}
          />
        </div>
        <label
          htmlFor="mhd-offboarding-custom-item-required"
          className="flex items-center gap-2 pb-2 text-sm font-medium"
        >
          <input
            id="mhd-offboarding-custom-item-required"
            type="checkbox"
            className="h-4 w-4 rounded border"
            {...register('isRequired')}
          />
          Required (gates case completion)
        </label>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Adding…' : 'Add Item'}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function MhdEvidenceChip({ item }: { item: MhdOffboardingChecklistItem }) {
  if (!item.linkedEntityType || !item.linkedEntityId) return null;
  const target = mhdBuildEvidenceLinkHref(item);
  const label = mhdFormatEvidenceLinkType(item.linkedEntityType);

  if (!target) {
    return <MhdBadge variant="neutral">{label}</MhdBadge>;
  }

  const chipClass =
    'inline-flex items-center gap-1 rounded-full bg-accent-tint px-2.5 py-0.5 text-xs font-medium text-accent-hover hover:bg-accent-tint/60';

  return target.external ? (
    <a href={target.href} target="_blank" rel="noreferrer" className={chipClass}>
      {label}
      <ExternalLink className="h-3 w-3" aria-label="Opens in a new tab" />
    </a>
  ) : (
    <Link to={target.href} className={chipClass}>
      {label}
    </Link>
  );
}

/**
 * Ordered exit checklist. Completion is server-gated: property_return refuses
 * COMPLETED while the person holds any ISSUED assignment, and exit_acknowledgment
 * refuses COMPLETED until the linked signature request is COMPLETED — those
 * refusals surface here verbatim as per-item errors, never swallowed. Waive/NA
 * always requires a reason (audited ITEM_WAIVED). Seeded items are never
 * deletable; custom items delete freely while the case is ACTIVE.
 */
export function MhdOffboardingChecklist({
  caseId,
  caseStatus,
  items,
  assignees,
  canMutate,
}: Props) {
  const actions = useMhdOffboardingItemActions();
  const [waivingItemId, setWaivingItemId] = useState<string | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
  const [addError, setAddError] = useState<string | null>(null);

  const caseIsActive = caseStatus === 'ACTIVE';
  const canAct = canMutate && caseIsActive;

  const orderedItems = useMemo(
    () => [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title)),
    [items],
  );

  function setItemError(itemId: string, message: string | null) {
    setItemErrors((current) => {
      const next = { ...current };
      if (message === null) {
        delete next[itemId];
      } else {
        next[itemId] = message;
      }
      return next;
    });
  }

  async function handleComplete(item: MhdOffboardingChecklistItem) {
    setItemError(item.id, null);
    try {
      await actions.completeItem.mutateAsync({ itemId: item.id });
    } catch (error) {
      // Gated items (property_return, exit_acknowledgment) refuse server-side —
      // surface the refusal honestly; waiving with a reason is the sanctioned bypass.
      setItemError(
        item.id,
        error instanceof Error ? error.message : 'Unable to complete this item.',
      );
    }
  }

  async function handleWaive(item: MhdOffboardingChecklistItem, input: MhdItemWaiverSchemaInput) {
    setItemError(item.id, null);
    try {
      await actions.waiveItem.mutateAsync({
        itemId: item.id,
        status: input.status,
        reason: input.reason,
      });
      setWaivingItemId(null);
    } catch (error) {
      setItemError(item.id, error instanceof Error ? error.message : 'Unable to waive this item.');
    }
  }

  async function handleDelete(item: MhdOffboardingChecklistItem) {
    setItemError(item.id, null);
    try {
      await actions.deleteItem.mutateAsync({ itemId: item.id });
    } catch (error) {
      setItemError(item.id, error instanceof Error ? error.message : 'Unable to delete this item.');
    }
  }

  async function handleAddItem(input: MhdCustomItemSchemaInput) {
    setAddError(null);
    try {
      await actions.createItem.mutateAsync({ caseId, input });
      setIsAddingItem(false);
    } catch (error) {
      setAddError(error instanceof Error ? error.message : 'Unable to add the checklist item.');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <ListChecks className="h-5 w-5 text-muted-foreground" />
          Exit Checklist
        </h2>
        {canAct ? (
          <button
            type="button"
            onClick={() => setIsAddingItem((current) => !current)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground"
          >
            <Plus className="h-4 w-4" />
            {isAddingItem ? 'Close' : 'Add Item'}
          </button>
        ) : null}
      </div>

      {addError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {addError}
        </div>
      ) : null}

      {isAddingItem && canAct ? (
        <MhdCustomItemForm
          caseId={caseId}
          assignees={assignees}
          onSubmit={handleAddItem}
          onCancel={() => setIsAddingItem(false)}
          isSubmitting={actions.createItem.isPending}
        />
      ) : null}

      {orderedItems.length === 0 ? (
        <MhdEmptyState className="py-6" title="No checklist items." />
      ) : (
        <ul className="divide-y divide-border">
          {orderedItems.map((item) => {
            const isCustom = item.itemKey === null;
            const isTerminal = item.status !== 'PENDING';
            const isOverdue = Boolean(
              item.dueDate &&
              item.status === 'PENDING' &&
              new Date(`${item.dueDate}T00:00:00`) < new Date(),
            );
            return (
              <li key={item.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{item.title}</span>
                      {item.isRequired ? <MhdBadge variant="neutral">Required</MhdBadge> : null}
                      {isCustom ? <MhdBadge variant="neutral">Custom</MhdBadge> : null}
                      <MhdItemStatusBadge status={item.status} />
                      <MhdEvidenceChip item={item} />
                    </div>
                    {item.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                    ) : null}
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>{item.referenceId}</span>
                      <span>Assignee: {item.assigneeDisplayName ?? 'Unassigned'}</span>
                      <span
                        className={`inline-flex items-center gap-1 ${isOverdue ? 'font-medium text-red-600' : ''}`}
                      >
                        {isOverdue ? (
                          <AlarmClock className="h-3.5 w-3.5" aria-label="Overdue" />
                        ) : null}
                        Due: {formatDate(item.dueDate)}
                      </span>
                      {item.completedAt ? (
                        <span>Completed: {new Date(item.completedAt).toLocaleString()}</span>
                      ) : null}
                    </div>
                    {item.statusReason ? (
                      <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 whitespace-pre-wrap">
                        Reason: {item.statusReason}
                      </p>
                    ) : null}
                  </div>

                  {canAct && !isTerminal ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleComplete(item)}
                        disabled={actions.completeItem.isPending}
                        className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        Complete
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setWaivingItemId((current) => (current === item.id ? null : item.id))
                        }
                        className="rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800"
                      >
                        {waivingItemId === item.id ? 'Close' : 'Waive / N.A.'}
                      </button>
                      {isCustom ? (
                        <MhdDetailActions
                          onDelete={() => handleDelete(item)}
                          deleteLabel="Delete"
                          deleteConfirmMessage={`Delete custom item "${item.title}"? This cannot be undone.`}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {itemErrors[item.id] ? (
                  <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                    {itemErrors[item.id]}
                  </div>
                ) : null}

                {waivingItemId === item.id && canAct && !isTerminal ? (
                  <MhdItemWaiverForm
                    item={item}
                    onSubmit={(input) => handleWaive(item, input)}
                    onCancel={() => setWaivingItemId(null)}
                    isSubmitting={actions.waiveItem.isPending}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
