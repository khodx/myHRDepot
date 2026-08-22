import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdModal } from '@/components/ui/MhdModal';
import { useMhdAuth } from '@/features/authentication/Hook';
import type { MhdCompanyId } from '@/features/companies/Types';
import type { Json } from '@/types/database.types';
import {
  useMhdActivityActions,
  useMhdActivityPeople,
  useMhdActivityTasks,
  useMhdActivityUsers,
} from '../Hook';
import type { MhdActivityFormSchemaInput } from '../Schemas';
import type { MhdUpdateActivityInput } from '../Types';
import { MhdActivityForm } from '@/components/ui/MhdActivityForm';
import { MhdTaskActivitiesPanel } from './MhdTaskActivitiesPanel';

interface MhdTaskActivitiesSectionProps {
  taskId: string;
  companyId: MhdCompanyId;
  canMutate: boolean;
}

function toActivityMutationInput(input: MhdActivityFormSchemaInput): MhdUpdateActivityInput {
  return {
    ...input,
    descriptionRichText: (input.descriptionRichText ?? null) as Json | null,
  };
}

/**
 * Task Activities page content: the read-only linked list plus an
 * "Add Activity" button that opens MhdActivityForm, pre-linked to this
 * task, in a modal — the only modal on this page. No sub-activity support
 * (matches the standalone Activities module, which has none either).
 */
export function MhdTaskActivitiesSection({
  taskId,
  companyId,
  canMutate,
}: MhdTaskActivitiesSectionProps) {
  const { profile } = useMhdAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const actions = useMhdActivityActions();
  const peopleQuery = useMhdActivityPeople(companyId, isCreating);
  const usersQuery = useMhdActivityUsers(companyId, isCreating);
  const tasksQuery = useMhdActivityTasks(companyId, isCreating);

  async function handleCreate(input: MhdActivityFormSchemaInput) {
    setActionError(null);
    try {
      await actions.createActivity.mutateAsync(toActivityMutationInput(input));
      setIsCreating(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to create activity.');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {canMutate ? (
          <Button type="button" className="gap-1.5" onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4" />
            Add Activity
          </Button>
        ) : null}
        <h2 className="text-lg font-semibold text-foreground">Activities</h2>
      </div>

      {actionError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {isCreating && canMutate && (
        <MhdModal onClose={() => setIsCreating(false)} title="Add Activity">
          <MhdActivityForm
            mode="create"
            companyId={companyId}
            currentUserId={profile?.userId ?? ''}
            defaultParentTaskId={taskId}
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
            onCancel={() => setIsCreating(false)}
            isSubmitting={actions.createActivity.isPending}
          />
        </MhdModal>
      )}

      <MhdTaskActivitiesPanel taskId={taskId} companyId={companyId} />
    </div>
  );
}
