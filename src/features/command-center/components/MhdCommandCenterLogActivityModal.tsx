import { useState } from 'react';
import { MhdModal } from '@/components/ui/MhdModal';
import type { Json } from '@/types/database.types';
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
  const companyName = companiesQuery.data?.find((company) => company.id === companyId)?.companyName;

  if (!open) return null;

  async function handleCreate(input: MhdActivityFormSchemaInput) {
    setActionError(null);
    try {
      await actions.createActivity.mutateAsync(toActivityMutationInput(input));
      onCreated();
      onClose();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to create activity.');
    }
  }

  return (
    <MhdModal onClose={onClose} title="Log Activity">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Log Activity</h2>
        <p className="text-sm text-muted-foreground">
          {companyName ?? 'Record an activity for the current company.'}
        </p>
      </div>
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
      />
    </MhdModal>
  );
}
