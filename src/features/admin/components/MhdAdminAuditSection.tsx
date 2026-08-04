import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useMhdImpersonationSessions } from '../Hook';

function formatTimestamp(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

/**
 * Impersonation session history. The broader company audit trail (tasks,
 * notes, attachments, field-level changes) already has its own dedicated
 * surface at /audit-reports (mhd_list_audit_events) — this section only adds
 * the one new privileged-action log this feature introduced, rather than
 * re-rendering that engine's data a second time.
 */
export function MhdAdminAuditSection() {
  const sessionsQuery = useMhdImpersonationSessions(50);
  const sessions = sessionsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <Link
        to="/audit-reports"
        className="group flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:border-accent"
      >
        <div>
          <h3 className="text-sm font-semibold text-foreground">Full Audit Trail</h3>
          <p className="text-sm text-muted-foreground">
            Field-level change history across tasks, notes, and attachments.
          </p>
        </div>
        <ArrowRight
          className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h3 className="text-base font-semibold text-foreground">Impersonation Sessions</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Every "View As" session, most recent first.
        </p>

        {sessionsQuery.isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : sessionsQuery.isError ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {sessionsQuery.error instanceof Error
              ? sessionsQuery.error.message
              : 'Unable to load impersonation history.'}
          </p>
        ) : sessions.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No impersonation sessions yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4">Admin</th>
                  <th className="py-2 pr-4">Viewed As</th>
                  <th className="py-2 pr-4">Company</th>
                  <th className="py-2 pr-4">Started</th>
                  <th className="py-2">Ended</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id} className="border-b border-border/60">
                    <td className="py-2 pr-4">{session.adminDisplayName}</td>
                    <td className="py-2 pr-4">{session.impersonatedRole}</td>
                    <td className="py-2 pr-4">{session.impersonatedCompanyName ?? '—'}</td>
                    <td className="py-2 pr-4">{formatTimestamp(session.startedAt)}</td>
                    <td className="py-2">
                      {session.endedAt ? (
                        formatTimestamp(session.endedAt)
                      ) : (
                        <span className="font-medium text-amber-700">Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
