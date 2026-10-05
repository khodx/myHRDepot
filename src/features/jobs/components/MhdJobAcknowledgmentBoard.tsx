import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdJobAcknowledgmentStatus } from '../Hook';

interface Props {
  /** The PUBLISHED description whose acknowledgments this board tracks. */
  descriptionId: string;
}

/**
 * Who has and has not acknowledged the published job description. The RPC is
 * restricted to job administrators; when it refuses (or fails) the board renders
 * nothing rather than an error, because a viewer without that access simply has
 * no board to see.
 */
export function MhdJobAcknowledgmentBoard({ descriptionId }: Props) {
  const board = useMhdJobAcknowledgmentStatus(descriptionId);

  if (board.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading acknowledgments…</p>;
  }
  if (board.isError || !board.data) return null;

  // Pending first, then by person; the server order is otherwise unspecified.
  const rows = [...board.data].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'PENDING' ? -1 : 1;
    return a.personName.localeCompare(b.personName);
  });
  const acknowledgedCount = rows.filter((row) => row.status === 'ACKNOWLEDGED').length;
  const pendingCount = rows.length - acknowledgedCount;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">Acknowledgments</h2>
        <p className="text-sm text-muted-foreground">
          {acknowledgedCount} acknowledged · {pendingCount} pending
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nobody is assigned to this job, so no acknowledgments are owed yet.
        </p>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Person</MhdTh>
                <MhdTh>Status</MhdTh>
                <MhdTh>Assigned</MhdTh>
                <MhdTh>Acknowledged</MhdTh>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <MhdTr key={row.acknowledgmentId}>
                  <MhdTd>{row.personName}</MhdTd>
                  <MhdTd>
                    <MhdBadge variant={row.status === 'ACKNOWLEDGED' ? 'success' : 'warning'}>
                      {row.status === 'ACKNOWLEDGED' ? 'Acknowledged' : 'Pending'}
                    </MhdBadge>
                  </MhdTd>
                  <MhdTd className="whitespace-nowrap text-muted-foreground">
                    {new Date(row.assignedAt).toLocaleDateString()}
                  </MhdTd>
                  <MhdTd className="whitespace-nowrap text-muted-foreground">
                    {row.acknowledgedAt ? new Date(row.acknowledgedAt).toLocaleString() : '—'}
                  </MhdTd>
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
        </MhdCard>
      )}
    </section>
  );
}
