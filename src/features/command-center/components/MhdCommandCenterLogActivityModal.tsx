import { useState } from 'react';
import { MhdFormModal } from '@/components/ui/MhdFormModal';
import type { Json } from '@/types/database.types';
import { useMhdDraft } from '@/features/drafts/Hook';
import { MHD_DRAFT_KINDS } from '@/features/drafts/Types';
import { useMhdCompanies } from '@/features/companies/Hook';
import { type MhdActivityFormSchemaInput } from '@/features/activities/Schemas';
import {
  useMhdActivityActions,
  useMhdActivityPeople,
  useMhdActivityTasks,
  useMhdActivityUsers,
} from '@/features/activities/Hook';
import type { MhdUpdateActivityInput } from '@/features/activities/Types';
import { MhdActivityForm } from '@/components/ui/MhdActivityForm';

interface MhdCommandCenterLogActivityModalProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  currentUserId: string;
  onCreated: () => void;
}

function toActivityMutationInput(input: MhdActivityFormSchemaInput): MhdUpdateActivityInput {
  return {
    ...input,
    descriptionRichText: (input.descriptionRichText ?? null) as Json | null,
  };
}

export function MhdCommandCenterLogActivityModal({
  open,
  onClose,
  companyId,
  currentUserId,
  onCreated,
}: MhdCommandCenterLogActivityModalProps) {
  const [actionError, setActionError] = useState<string | null>(null);
  const actions = useMhdActivityActions();
  const companiesQuery = useMhdCompanies({ searchTerm: '' });
  const peopleQuery = useMhdActivityPeople(companyId);
  const usersQuery = useMhdActivityUsers(companyId);
  const tasksQuery = useMhdActivityTasks(companyId);
  const draft = useMhdDraft({
    draftKind: MHD_DRAFT_KINDS.activityCreate,
    draftKey: 'command-center',
    companyId,
    enabled: open,
  });
  const companyName = companiesQuery.data?.find((company) => company.id === companyId)?.companyName;

  if (!open) return null;

  async function handleCreate(input: MhdActivityFormSchemaInput) {
    setActionError(null);
    try {
      await actions.createActivity.mutateAsync(toActivityMutationInput(input));
      await draft.discard();
      onCreated();
      onClose();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to create activity.');
    }
  }

  return (
    <MhdFormModal
      title="Log Activity"
      description={companyName ?? 'Record an activity for the current company.'}
      size="xl"
      onClose={onClose}
    >
      {actionError ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}
      <MhdActivityForm
        mode="create"
        companyId={companyId}
        currentUserId={currentUserId}
        people={(peopleQuery.data ?? []).map((person) => ({
          id: person.id,
          label: person.displayName,
        }))}
        users={(usersQuery.data ?? []).map((user) => ({
          id: user.id,
          label: user.displayName,
        }))}
        tasks={(tasksQuery.data ?? []).map((task) => ({
          id: task.id,
          label: `${task.referenceId} — ${task.title}`,
        }))}
        onSubmit={handleCreate}
        onCancel={onClose}
        isSubmitting={actions.createActivity.isPending}
        draft={draft}
      />
    </MhdFormModal>
  );
}
