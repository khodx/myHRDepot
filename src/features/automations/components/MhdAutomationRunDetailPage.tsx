import { useParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdDetailField } from '@/components/ui/MhdDetailField';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { MhdAutomationRunRecordTabs } from '@/appshell/components/MhdAutomationRunRecordTabs';
import { useMhdAutomationRun } from '../Hook';
import { mhdAutomationRunVariant, mhdAutomationSensitivityVariant } from '../mhdAutomationBadges';

function formatWhen(value: string | null): string {
  return value ? new Date(value).toLocaleString() : '—';
}

/**
 * /automations/runs/:runId — what one rule did about one event, step by step.
 *
 * This is the accountability surface for the engine. A step that did not run is
 * as important as one that did: BLOCKED means a guard refused it (sensitivity
 * ceiling or the author's authority), which is a deliberate outcome and reads
 * differently from FAILED.
 */
export function MhdAutomationRunDetailPage() {
  const { runId } = useParams<{ runId: string }>();
  const run = useMhdAutomationRun(runId ?? null);

  if (run.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading Run…</p>;
  }

  if (run.error || !run.data) {
    return (
      <MhdCard className="p-6">
        <p className="text-sm text-red-600">
          {(run.error as Error | undefined)?.message ?? 'That automation run could not be found.'}
        </p>
      </MhdCard>
    );
  }

  const detail = run.data;

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title={detail.rule?.name ?? 'Automation Run'}
        description={`${detail.referenceId} — triggered by ${detail.event.eventTypeKey}`}
        backTo="/automations"
        backLabel="Automations"
        chips={
          <>
            <MhdBadge variant={mhdAutomationRunVariant(detail.status)}>
              {detail.matched === false ? 'No Match' : detail.status}
            </MhdBadge>
            {detail.event.sensitivityLevel !== 'STANDARD' && (
              <MhdBadge variant={mhdAutomationSensitivityVariant(detail.event.sensitivityLevel)}>
                {detail.event.sensitivityLevel}
              </MhdBadge>
            )}
          </>
        }
      />

      <MhdAutomationRunRecordTabs runId={detail.id} active="detail" />

      {detail.errorText && (
        <MhdCard className="p-4">
          <p className="text-sm text-red-600">{detail.errorText}</p>
        </MhdCard>
      )}

      <div className="space-y-4">
        <MhdCard className="p-5">
          <h2 className="text-base font-semibold text-foreground">Timing</h2>
          <dl className="mt-3 space-y-4 text-sm">
            <MhdDetailField label="Event occurred" value={formatWhen(detail.event.occurredAt)} />
            <MhdDetailField label="Run started" value={formatWhen(detail.startedAt)} />
            <MhdDetailField label="Run finished" value={formatWhen(detail.finishedAt)} />
            <MhdDetailField label="Chain depth" value={detail.depth} />
          </dl>
        </MhdCard>

        <MhdCard className="p-5">
          <h2 className="text-base font-semibold text-foreground">Triggering Event</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {detail.event.referenceId} · {detail.event.entityType}
          </p>

          {detail.event.payloadVisible ? (
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded bg-muted p-3 text-xs">
              {JSON.stringify(detail.event.payload, null, 2)}
            </pre>
          ) : (
            // Withheld, not empty. The server declines to return the payload
            // above this reader's tier, and saying so is more useful — and more
            // honest — than rendering an empty object.
            <div className="mt-3 flex items-start gap-2 rounded border border-dashed p-3">
              <Lock className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">
                This event is {detail.event.sensitivityLevel} tier. Its contents are restricted to
                Platform Admin and HR Partner and were not sent to this page.
              </p>
            </div>
          )}
        </MhdCard>
      </div>

      <MhdCard className="overflow-hidden p-0">
        <MhdTable>
          <thead>
            <tr>
              <MhdTh>#</MhdTh>
              <MhdTh>Action</MhdTh>
              <MhdTh>Outcome</MhdTh>
              <MhdTh>Detail</MhdTh>
              <MhdTh>Completed</MhdTh>
            </tr>
          </thead>
          <tbody>
            {detail.steps.map((step) => (
              <MhdTr key={step.id}>
                <MhdTd className="text-muted-foreground">{step.sortOrder + 1}</MhdTd>
                <MhdTd className="font-semibold">{step.actionTypeKey}</MhdTd>
                <MhdTd>
                  <MhdBadge variant={mhdAutomationRunVariant(step.status)}>{step.status}</MhdBadge>
                </MhdTd>
                <MhdTd className="text-muted-foreground">
                  {step.lastError ? (
                    <span className="text-red-600">{step.lastError}</span>
                  ) : step.result ? (
                    <pre className="overflow-x-auto whitespace-pre-wrap text-xs">
                      {JSON.stringify(step.result)}
                    </pre>
                  ) : (
                    '—'
                  )}
                </MhdTd>
                <MhdTd className="text-muted-foreground">{formatWhen(step.completedAt)}</MhdTd>
              </MhdTr>
            ))}
          </tbody>
        </MhdTable>
      </MhdCard>
    </div>
  );
}
