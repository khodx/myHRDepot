import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MhdBreadcrumb } from '@/appshell/components/MhdBreadcrumb';
import { mhdCanMutateProperty } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { type MhdIssuePropertySchemaInput, type MhdPropertyDispositionSchemaInput, type MhdReturnPropertySchemaInput, type MhdUpdatePropertyItemSchemaInput } from '../Schemas';
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
      setActionError(error instanceof Error ? error.message : 'Unable to update assignment disposition.');
    }
  }

  async function handleDeleteItem() {
    if (!item) return;
    const confirmed = window.confirm(`Delete property item ${item.referenceId}? This is a soft delete and will fail if the item is still issued.`);
    if (!confirmed) return;

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

  function startDisposition(assignment: MhdPropertyAssignment, status: MhdPropertyDispositionStatus) {
    setReturningAssignmentId(null);
    setDispositionState({ assignmentId: assignment.id, status });
  }

  if (itemQuery.isLoading) {
    return <div className="flex h-64 items-center justify-center text-sm text-slate-500">Loading property item...</div>;
  }

  if (itemQuery.error || !item) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-600">
          {itemQuery.error instanceof Error ? itemQuery.error.message : 'Property item not found.'}
        </p>
        <button type="button" onClick={() => navigate('/property')} className="text-sm text-blue-700 hover:underline">
          Back to Property
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <MhdBreadcrumb items={[{ label: 'Property', to: '/property' }, { label: item.referenceId }]} />

        {actionError ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</div> : null}
        {assignmentsQuery.error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {assignmentsQuery.error instanceof Error ? assignmentsQuery.error.message : 'Unable to load property assignments.'}
          </div>
        ) : null}
        {peopleQuery.error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {peopleQuery.error instanceof Error ? peopleQuery.error.message : 'Unable to load employees for issuance.'}
          </div>
        ) : null}

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs text-slate-400">{item.referenceId}</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">{item.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <MhdPropertyStatusBadge status={item.status} />
                <span>{item.category}</span>
                <span>{item.quantityAvailable} available / {item.quantityTotal} total</span>
                {item.serialNumber ? <span>Serial: {item.serialNumber}</span> : null}
              </div>
            </div>

            {canMutate ? (
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => setIsEditingItem((current) => !current)} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                  {isEditingItem ? 'Close Edit' : 'Edit Item'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsIssuing((current) => !current)}
                  disabled={item.quantityAvailable <= 0}
                  className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isIssuing ? 'Close Issue Form' : 'Issue Property'}
                </button>
                <button type="button" onClick={() => void handleDeleteItem()} className="rounded-md bg-rose-700 px-4 py-2 text-sm font-semibold text-white">
                  Delete Item
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</p>
              <p className="mt-2">{item.description || 'No description recorded.'}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Condition</p>
              <p className="mt-2">{item.conditionNotes || 'No condition notes recorded.'}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Acquisition</p>
              <p className="mt-2">{item.acquisitionDate ? new Date(item.acquisitionDate).toLocaleDateString() : 'Not recorded'}</p>
              <p className="mt-1">{item.unitCost != null ? `$${item.unitCost.toFixed(2)}` : 'Unit cost not recorded'}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Inventory Record</p>
              <p className="mt-2">Added {new Date(item.createdAt).toLocaleDateString()}</p>
              <p className="mt-1">Created by {item.createdBy}</p>
            </div>
          </div>
        </section>

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
            people={(peopleQuery.data ?? []).map((person) => ({ id: person.id, displayName: person.displayName }))}
            isSubmitting={actions.issue.isPending}
            onSubmit={handleIssue}
            onCancel={() => setIsIssuing(false)}
          />
        ) : null}

        <section className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Active Assignments</h2>
            <p className="mt-1 text-sm text-slate-600">Current custody records that are still in ISSUED status.</p>
          </div>

          {activeAssignments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-10 text-sm text-slate-500 shadow-sm">
              No active assignments for this item.
            </div>
          ) : (
            <div className="grid gap-4">
              {activeAssignments.map((assignment) => (
                <div key={assignment.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-slate-900">
                          <Link to={`/people/${assignment.personId}`} className="hover:text-blue-700 hover:underline">
                            {assignment.personDisplayName}
                          </Link>
                        </h3>
                        <MhdPropertyAssignmentBadge status={assignment.status} />
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        {assignment.referenceId} · Issued {new Date(assignment.issuedAt).toLocaleDateString()} · Quantity {assignment.quantity}
                      </p>
                      {assignment.issuanceConditionNotes ? (
                        <p className="mt-2 text-sm text-slate-600">Issued condition: {assignment.issuanceConditionNotes}</p>
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
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Assignment History</h2>
            <p className="mt-1 text-sm text-slate-600">Full issue / return / lost / damaged timeline for this property item.</p>
          </div>

          <MhdPropertyAssignmentHistory assignments={assignments} />
        </section>
      </div>
    </main>
  );
}
