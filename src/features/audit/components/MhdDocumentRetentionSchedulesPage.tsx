import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdDocumentRetentionSchedules } from '../Hook';

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function dateOnly(value: string) {
  return new Date(value).toLocaleDateString();
}

function dateTime(value: string) {
  return new Date(value).toLocaleString();
}

/**
 * Route: /document-retention — Platform Admin / HR Partner only
 * (mhd_document_retention_schedule_list enforces this server-side; the route
 * guard is UX only). Currently the only populated entity_type is I9_RECORD
 * (0313's trigger on onboarding_i9_records) — the table itself is generic by
 * design (0109) so future modules can add their own retention basis without
 * a schema change.
 */
export function MhdDocumentRetentionSchedulesPage() {
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? null;
  const schedules = useMhdDocumentRetentionSchedules(companyId);

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Document Retention"
        description="Legally required retention windows for company records. Currently tracks I-9 records only (3 years from hire, or 1 year from termination, whichever is later)."
      />
      {schedules.error ? (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {errorMessage(schedules.error, 'Unable to load retention schedules.')}
        </div>
      ) : null}
      {schedules.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (schedules.data ?? []).length === 0 ? (
        <MhdCard><p className="text-sm text-muted-foreground">No retention schedules are on file yet.</p></MhdCard>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Record type</MhdTh>
                <MhdTh>Basis</MhdTh>
                <MhdTh>Retain until</MhdTh>
                <MhdTh>Computed</MhdTh>
              </tr>
            </thead>
            <tbody>
              {(schedules.data ?? []).map((schedule) => (
                <MhdTr key={schedule.id}>
                  <MhdTd className="font-medium">{schedule.entityType}</MhdTd>
                  <MhdTd>{schedule.retentionBasis}</MhdTd>
                  <MhdTd>{dateOnly(schedule.retentionExpiresAt)}</MhdTd>
                  <MhdTd>{dateTime(schedule.computedAt)}</MhdTd>
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
        </MhdCard>
      )}
    </div>
  );
}

export default MhdDocumentRetentionSchedulesPage;
