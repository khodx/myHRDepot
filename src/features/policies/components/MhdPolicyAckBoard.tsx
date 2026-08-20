import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import {
  useMhdAssignPolicyAcknowledgment,
  useMhdPolicyAckBoard,
  useMhdPolicyPeople,
} from '../Hook';
import { mhdFormatPolicyValue } from '../Types';

interface Props {
  companyId: string;
  versionId: string;
}

export function MhdPolicyAckBoard({ companyId, versionId }: Props) {
  const board = useMhdPolicyAckBoard(versionId);
  const people = useMhdPolicyPeople(companyId);
  const assign = useMhdAssignPolicyAcknowledgment();
  const [personId, setPersonId] = useState('');

  const namesById = useMemo(() => {
    const map = new Map<string, string>();
    for (const person of people.data ?? []) map.set(person.id, person.displayName);
    return map;
  }, [people.data]);

  async function handleAssign() {
    if (!personId) return;
    await assign.mutateAsync({ policyVersionId: versionId, personIds: [personId] });
    setPersonId('');
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">Acknowledgments</h2>
        <div className="flex items-end gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            Assign to
            <select
              className="mt-1 block rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              value={personId}
              onChange={(event) => setPersonId(event.target.value)}
            >
              <option value="">Choose a person...</option>
              {(people.data ?? []).map((person) => (
                <option key={person.id} value={person.id}>
                  {person.displayName}
                </option>
              ))}
            </select>
          </label>
          <Button disabled={!personId || assign.isPending} onClick={() => void handleAssign()}>
            {assign.isPending ? 'Assigning...' : 'Assign'}
          </Button>
        </div>
      </div>

      {assign.error instanceof Error ? (
        <p className="text-xs text-rose-600">{assign.error.message}</p>
      ) : null}

      {board.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading acknowledgments...</p>
      ) : (board.data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">No one has been assigned this version yet.</p>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Person</MhdTh>
                <MhdTh>Status</MhdTh>
                <MhdTh>Assigned</MhdTh>
                <MhdTh>Signed</MhdTh>
              </tr>
            </thead>
            <tbody>
              {(board.data ?? []).map((row) => (
                <MhdTr key={row.id}>
                  <MhdTd>{namesById.get(row.personId) ?? row.personId}</MhdTd>
                  <MhdTd>
                    <MhdBadge variant={row.status === 'SIGNED' ? 'success' : 'warning'}>
                      {mhdFormatPolicyValue(row.status)}
                    </MhdBadge>
                  </MhdTd>
                  <MhdTd>{new Date(row.assignedAt).toLocaleDateString()}</MhdTd>
                  <MhdTd>{row.signedAt ? new Date(row.signedAt).toLocaleString() : 'None'}</MhdTd>
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
        </MhdCard>
      )}
    </section>
  );
}
