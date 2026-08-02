import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MhdPropertyRecordTabs } from '@/appshell/components/MhdPropertyRecordTabs';
import { Button } from '@/components/ui/Button';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdDetailActions } from '@/components/ui/MhdDetailActions';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdBreadcrumb } from '@/appshell/components/MhdBreadcrumb';
import { mhdCanMutateProperty } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  type MhdIssuePropertySchemaInput,
  type MhdPropertyDispositionSchemaInput,
  type MhdReturnPropertySchemaInput,
  type MhdUpdatePropertyItemSchemaInput,
} from '../Schemas';
import {
  useMhdPropertyActions,
  useMhdPropertyAssignments,
  useMhdPropertyItem,
  useMhdPropertyPeople,
} from '../Hook';
import type { MhdPropertyAssignment, MhdPropertyDispositionStatus } from '../Types';
import { MhdPropertyAssignmentBadge } from './MhdPropertyAssignmentBadge';
import { MhdPropertyAssignmentHistory } from './MhdPropertyAssignmentHistory';
import { MhdPropertyDispositionForm } from './MhdPropertyDispositionForm';
import { MhdPropertyIssueForm } from './MhdPropertyIssueForm';
import { MhdPropertyItemEditForm } from './MhdPropertyItemEditForm';
import { MhdPropertyReturnForm } from './MhdPropertyReturnForm';
import { MhdPropertyStatusBadge } from './MhdPropertyStatusBadge';

interface MhdDispositionState {
  assignmentId: string;
  status: MhdPropertyDispositionStatus;
}

export function MhdPropertyDetailPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { profile, roles } = useMhdAuth();
  const canMutate = mhdCanMutateProperty(roles);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [returningAssignmentId, setReturningAssignmentId] = useState<string | null>(null);
  const [dispositionState, setDispositionState] = useState<MhdDispositionState | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const itemQuery = useMhdPropertyItem(profile?.companyId ?? null, itemId ?? null);
  const assignmentsQuery = useMhdPropertyAssignments({ propertyItemId: itemId ?? null });
  const peopleQuery = useMhdPropertyPeople(profile?.companyId ?? null, canMutate);
  const actions = useMhdPropertyActions();

  const item = itemQuery.data ?? null;
  const assignments = assignmentsQuery.data ?? [];
  const activeAssignments = assignments.filter((assignment) => assignment.status === 'ISSUED');

  async function handleUpdateItem(input: MhdUpdatePropertyItemSchemaInput) {
    if (!item) return;
    setActionError(null);
    try {
      await actions.updateItem.mutateAsync({ itemId: item.id, input });
      setIsEditingItem(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to update property item.');
    }
  }

  async function handleIssue(input: MhdIssuePropertySchemaInput) {
    setActionError(null);
    try {
      await actions.issue.mutateAsync(input);
      setIsIssuing(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to issue property.');
    }
  }

  async function handleReturn(assignmentId: string, input: MhdReturnPropertySchemaInput) {
    setActionError(null);
    try {
      await actions.returnItem.mutateAsync({ assignmentId, input });
      setReturningAssignmentId(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to record property return.');
    }
  }

  async function handleDisposition(assignmentId: string, input: MhdPropertyDispositionSchemaInput) {
    setActionError(null);
    try {
      await actions.markLostOrDamaged.mutateAsync({
        assignmentId,
        status: input.status,
        notes: input.notes,
      });
      setDispositionState(null);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Unable to update assignment disposition.',
      );
    }
  }

  async function handleDeleteItem() {
    if (!item) return;
    setActionError(null);
    try {
      await actions.deleteItem.mutateAsync(item.id);
      navigate('/property');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to delete property item.');
    }
  }

  function startReturn(assignment: MhdPropertyAssignment) {
    setDispositionState(null);
    setReturningAssignmentId(assignment.id);
  }

  function startDisposition(
    assignment: MhdPropertyAssignment,
    status: MhdPropertyDispositionStatus,
  ) {
    setReturningAssignmentId(null);
    setDispositionState({ assignmentId: assignment.id, status });
  }

  if (itemQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Loading property item...
      </div>
    );
  }

  if (itemQuery.error || !item) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-600">
          {itemQuery.error instanceof Error ? itemQuery.error.message : 'Property item not found.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/property')}
          className="text-sm text-accent hover:text-accent-hover"
        >
          Back to Property
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MhdBreadcrumb
        items={[{ label: 'Property', to: '/property' }, { label: item.referenceId }]}
      />

      {actionError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}
      {assignmentsQuery.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {assignmentsQuery.error instanceof Error
            ? assignmentsQuery.error.message
            : 'Unable to load property assignments.'}
        </div>
      ) : null}
      {peopleQuery.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {peopleQuery.error instanceof Error
            ? peopleQuery.error.message
            : 'Unable to load employees for issuance.'}
        </div>
      ) : null}

      <MhdPageHeader
        title={item.name}
        chips={<MhdPropertyStatusBadge status={item.status} />}
        description={
          <>
            <span>{item.referenceId}</span>
            <span className="mx-2">·</span>
            <span>{item.category}</span>
            <span className="mx-2">·</span>
            <span>
              {item.quantityAvailable} available / {item.quantityTotal} total
            </span>
            {item.serialNumber ? (
              <>
                <span className="mx-2">·</span>
                <span>Serial: {item.serialNumber}</span>
              </>
            ) : null}
          </>
        }
      />

      <MhdPropertyRecordTabs
        itemId={item.id}
        active="detail"
        actions={
          canMutate ? (
            <>
              <Button
                type="button"
                variant="warning"
                onClick={() => setIsEditingItem((current) => !current)}
              >
                {isEditingItem ? 'Close Edit' : 'Edit Item'}
              </Button>
              <Button
                type="button"
                onClick={() => setIsIssuing((current) => !current)}
                disabled={item.quantityAvailable <= 0}
                className="font-semibold"
              >
                {isIssuing ? 'Close Issue Form' : 'Issue Property'}
              </Button>
              <MhdDetailActions
                onDelete={handleDeleteItem}
                deleteLabel="Delete Item"
                deleteConfirmMessage={`Delete property item ${item.referenceId}? This is a soft delete and will fail if the item is still issued.`}
              />
            </>
          ) : undefined
        }
      />

      <MhdCard>
        <div className="grid gap-4 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-md bg-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Description
            </p>
            <p className="mt-2">{item.description || 'No description recorded.'}</p>
          </div>
          <div className="rounded-md bg-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Condition
            </p>
            <p className="mt-2">{item.conditionNotes || 'No condition notes recorded.'}</p>
          </div>
          <div className="rounded-md bg-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Acquisition
            </p>
            <p className="mt-2">
              {item.acquisitionDate
                ? new Date(item.acquisitionDate).toLocaleDateString()
                : 'Not recorded'}
            </p>
            <p className="mt-1">
              {item.unitCost != null ? `$${item.unitCost.toFixed(2)}` : 'Unit cost not recorded'}
            </p>
          </div>
          <div className="rounded-md bg-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Inventory Record
            </p>
            <p className="mt-2">Added {new Date(item.createdAt).toLocaleDateString()}</p>
            <p className="mt-1">Created by {item.createdBy}</p>
          </div>
        </div>
      </MhdCard>

      {isEditingItem ? (
        <MhdPropertyItemEditForm
          item={item}
          isSubmitting={actions.updateItem.isPending}
          onSubmit={handleUpdateItem}
          onCancel={() => setIsEditingItem(false)}
        />
      ) : null}

      {isIssuing ? (
        <MhdPropertyIssueForm
          item={item}
          people={(peopleQuery.data ?? []).map((person) => ({
            id: person.id,
            displayName: person.displayName,
          }))}
          isSubmitting={actions.issue.isPending}
          onSubmit={handleIssue}
          onCancel={() => setIsIssuing(false)}
        />
      ) : null}

      <section className="space-y-4">
        <MhdCard>
          <MhdCardHeader title="Active Assignments" />
          <p className="mt-1 text-sm text-muted-foreground">
            Current custody records that are still in ISSUED status.
          </p>
        </MhdCard>

        {activeAssignments.length === 0 ? (
          <MhdCard className="border border-dashed border-border">
            <MhdEmptyState className="py-10" title="No active assignments for this item." />
          </MhdCard>
        ) : (
          <div className="grid gap-4">
            {activeAssignments.map((assignment) => (
              <MhdCard key={assignment.id} className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-foreground">
                        <Link
                          to={`/people/${assignment.personId}`}
                          className="hover:text-accent-hover"
                        >
                          {assignment.personDisplayName}
                        </Link>
                      </h3>
                      <MhdPropertyAssignmentBadge status={assignment.status} />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {assignment.referenceId} · Issued{' '}
                      {new Date(assignment.issuedAt).toLocaleDateString()} · Quantity{' '}
                      {assignment.quantity}
                    </p>
                    {assignment.issuanceConditionNotes ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Issued condition: {assignment.issuanceConditionNotes}
                      </p>
                    ) : null}
                  </div>

                  {canMutate ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startReturn(assignment)}
                        className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Record Return
                      </button>
                      <button
                        type="button"
                        onClick={() => startDisposition(assignment, 'LOST')}
                        className="rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Mark Lost
                      </button>
                      <button
                        type="button"
                        onClick={() => startDisposition(assignment, 'DAMAGED')}
                        className="rounded-md bg-rose-700 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Mark Damaged
                      </button>
                    </div>
                  ) : null}
                </div>

                {returningAssignmentId === assignment.id ? (
                  <div className="mt-4">
                    <MhdPropertyReturnForm
                      assignment={assignment}
                      isSubmitting={actions.returnItem.isPending}
                      onSubmit={(input) => handleReturn(assignment.id, input)}
                      onCancel={() => setReturningAssignmentId(null)}
                    />
                  </div>
                ) : null}

                {dispositionState?.assignmentId === assignment.id ? (
                  <div className="mt-4">
                    <MhdPropertyDispositionForm
                      status={dispositionState.status}
                      isSubmitting={actions.markLostOrDamaged.isPending}
                      onSubmit={(input) => handleDisposition(assignment.id, input)}
                      onCancel={() => setDispositionState(null)}
                    />
                  </div>
                ) : null}
              </MhdCard>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <MhdCard>
          <MhdCardHeader title="Assignment History" />
          <p className="mt-1 text-sm text-muted-foreground">
            Full issue / return / lost / damaged timeline for this property item.
          </p>
        </MhdCard>

        <MhdPropertyAssignmentHistory assignments={assignments} />
      </section>
    </div>
  );
}
