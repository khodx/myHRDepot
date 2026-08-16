import { UserPlus, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdMultiSelectCombobox } from '@/components/ui/MhdMultiSelectCombobox';
import { cn } from '@/utils/cn';
import { useMhdClickOutside } from '@/utils/useMhdClickOutside';
import { mhdTaskService } from '@/features/tasks/Service';
import { useMhdManageParticipants } from '@/features/messaging/Hook';
import type { MhdMessageThreadParticipant } from '@/features/messaging/Types';

interface MhdManageParticipantsPanelProps {
  threadId: string;
  companyId: string | null;
  participants: MhdMessageThreadParticipant[];
  resolveSenderName: (userId: string) => string | null;
  currentUserIsOwner: boolean;
}

export function MhdManageParticipantsPanel({
  threadId,
  companyId,
  participants,
  resolveSenderName,
  currentUserIsOwner,
}: MhdManageParticipantsPanelProps) {
  const [open, setOpen] = useState(false);
  const [addSelection, setAddSelection] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useMhdClickOutside(containerRef, () => setOpen(false));

  const { addParticipants, removeParticipant } = useMhdManageParticipants(threadId);

  const activeParticipants = participants.filter((p) => p.leftAt === null);

  const assignableUsers = useQuery({
    queryKey: ['mhd-messaging', 'assignable-users', companyId ?? ''],
    queryFn: () => mhdTaskService.listAssignableUsers(companyId!),
    enabled: open && currentUserIsOwner && Boolean(companyId),
  });

  const activeUserIds = new Set(activeParticipants.map((p) => p.userId));
  const addOptions = (assignableUsers.data ?? [])
    .filter((user) => !activeUserIds.has(user.id))
    .map((user) => ({ id: user.id, label: user.displayName, sublabel: user.email || undefined }));

  async function handleAdd() {
    if (addSelection.length === 0) return;
    setError(null);
    try {
      await addParticipants.mutateAsync(addSelection);
      setAddSelection([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add participants.');
    }
  }

  function handleRemove(userId: string) {
    setError(null);
    removeParticipant.mutate(userId, {
      onError: (err) => setError(err instanceof Error ? err.message : 'Unable to remove participant.'),
    });
  }

  return (
    <div ref={containerRef} className={cn('relative')}>
      <Button
        type="button"
        variant="ghost"
        className="h-7 px-2 text-xs"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {activeParticipants.length} {activeParticipants.length === 1 ? 'participant' : 'participants'}
      </Button>

      {open && (
        <div className="absolute right-0 z-10 mt-1 w-72 rounded-md border border-border bg-card p-3 shadow-lg">
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {activeParticipants.map((participant) => (
              <li
                key={participant.id}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm"
              >
                <span className="min-w-0 truncate text-foreground">
                  {resolveSenderName(participant.userId) ?? 'Unknown user'}
                  {participant.role === 'OWNER' && (
                    <span className="ml-1.5 text-[10px] uppercase text-muted-foreground">Owner</span>
                  )}
                </span>
                {currentUserIsOwner && (
                  <button
                    type="button"
                    onClick={() => handleRemove(participant.userId)}
                    aria-label={`Remove ${resolveSenderName(participant.userId) ?? 'participant'}`}
                    className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                )}
              </li>
            ))}
          </ul>

          {currentUserIsOwner && (
            <div className="mt-3 border-t border-border pt-3">
              <span className="mb-1 flex items-center gap-1 text-xs font-medium text-foreground">
                <UserPlus className="h-3.5 w-3.5" aria-hidden />
                Add people
              </span>
              <MhdMultiSelectCombobox
                options={addOptions}
                value={addSelection}
                onChange={setAddSelection}
                placeholder="Search people…"
                emptyMessage="No matching people."
              />
              <Button
                type="button"
                className="mt-2 h-7 w-full px-2 text-xs"
                disabled={addSelection.length === 0 || addParticipants.isPending}
                onClick={handleAdd}
              >
                Add
              </Button>
            </div>
          )}

          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
