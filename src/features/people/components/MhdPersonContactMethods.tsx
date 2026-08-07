import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import type { MhdContactType } from '@/features/people/Types';
import { mhdPersonService } from '@/features/people/Service';

interface MhdPersonContactMethodsProps {
  personId: string;
}

const CONTACT_TYPES: MhdContactType[] = ['EMAIL', 'PHONE', 'MOBILE'];

function mhdContactMethodsQueryKey(personId: string) {
  return ['mhd-people', 'contact-methods', personId] as const;
}

// The primary email/phone/mobile shown in MhdPersonDetailsPanel is only a
// projection — this component is the management surface for the full
// contact_methods list (multiple emails, promoting a non-primary to
// primary, deleting a stray number, etc.). Kept intentionally minimal; a
// fuller inline-edit UX is a future enhancement.
export function MhdPersonContactMethods({ personId }: MhdPersonContactMethodsProps) {
  const [newType, setNewType] = useState<MhdContactType>('EMAIL');
  const [newValue, setNewValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const queryKey = mhdContactMethodsQueryKey(personId);
  const methodsQuery = useQuery({
    queryKey,
    queryFn: () => mhdPersonService.listContactMethodsForPerson(personId),
  });
  const methods = methodsQuery.data ?? [];

  function runSave(mutate: () => Promise<unknown>, fallbackMessage: string) {
    setError(null);
    mutate()
      .then(() => queryClient.invalidateQueries({ queryKey }))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : fallbackMessage));
  }

  const addMutation = useMutation({
    mutationFn: () =>
      mhdPersonService.addContactMethod({
        personId,
        contactType: newType,
        contactValue: newValue,
        isPrimary: false,
      }),
  });
  const makePrimaryMutation = useMutation({
    mutationFn: (contactMethodId: string) =>
      mhdPersonService.updateContactMethod({ contactMethodId, isPrimary: true }),
  });
  const deleteMutation = useMutation({
    mutationFn: (contactMethodId: string) => mhdPersonService.deleteContactMethod(contactMethodId),
  });

  const isSaving = addMutation.isPending || makePrimaryMutation.isPending || deleteMutation.isPending;

  function handleAdd() {
    if (newValue.trim().length === 0) return;
    runSave(() => addMutation.mutateAsync(), 'Unable to add contact method.');
    setNewValue('');
  }

  function handleMakePrimary(contactMethodId: string) {
    runSave(() => makePrimaryMutation.mutateAsync(contactMethodId), 'Unable to update contact method.');
  }

  function handleDelete(contactMethodId: string) {
    runSave(() => deleteMutation.mutateAsync(contactMethodId), 'Unable to delete contact method.');
  }

  return (
    <div className="mt-5 border-t border-border pt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Contact methods
      </p>

      {methodsQuery.isLoading ? (
        <p className="mt-2 text-sm text-muted-foreground">Loading contact methods...</p>
      ) : methods.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No contact methods yet.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {methods.map((method) => (
            <li
              key={method.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm"
            >
              <div>
                <span className="font-medium text-foreground">{method.contactType}</span>{' '}
                <span className="text-foreground">{method.contactValue}</span>{' '}
                {method.isPrimary ? (
                  <MhdBadge variant="accent" className="ml-1">
                    Primary
                  </MhdBadge>
                ) : null}
              </div>
              <div className="flex gap-2">
                {!method.isPrimary ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-accent hover:text-accent-hover"
                    disabled={isSaving}
                    onClick={() => handleMakePrimary(method.id)}
                  >
                    Make primary
                  </button>
                ) : null}
                <button
                  type="button"
                  className="text-xs font-medium text-red-700 hover:underline"
                  disabled={isSaving}
                  onClick={() => handleDelete(method.id)}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {error || methodsQuery.isError ? (
        <p className="mt-2 text-xs text-red-700">
          {error ??
            (methodsQuery.error instanceof Error
              ? methodsQuery.error.message
              : 'Unable to load contact methods.')}
        </p>
      ) : null}

      <div className="mt-3 flex items-center gap-2">
        <select
          className="rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          value={newType}
          onChange={(event) => setNewType(event.target.value as MhdContactType)}
        >
          {CONTACT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input
          className="flex-1 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          placeholder="New contact value"
          value={newValue}
          onChange={(event) => setNewValue(event.target.value)}
        />
        <Button className="px-3 py-1.5" disabled={isSaving} onClick={handleAdd}>
          Add
        </Button>
      </div>
    </div>
  );
}
