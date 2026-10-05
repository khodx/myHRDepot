import { useState } from 'react';
import { useMhdAuth } from '@/features/authentication/Hook';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { MhdTabs } from '@/components/ui/MhdTabs';
import { useMhdRetentionReview } from '../Hook';
import type {
  MhdRetentionDecision,
  MhdRetentionReviewItem,
  MhdRetentionReviewScope,
} from '../Types';
import {
  RETENTION_DECISION_LABEL,
  RETENTION_STATUS_LABEL,
  RETENTION_STATUS_VARIANT,
  availableRetentionDecisions,
  formatRetentionDate,
  humaniseRetentionEntityType,
  retentionRowNote,
} from './MhdDocumentRetentionUtils';
import { MhdRetentionDecisionModal } from './MhdRetentionDecisionModal';
import { MhdRetentionHistoryModal } from './MhdRetentionHistoryModal';

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

type RetentionTab = MhdRetentionReviewScope;

type ActiveDialog =
  | { kind: 'decision'; item: MhdRetentionReviewItem; decision: MhdRetentionDecision }
  | { kind: 'history'; item: MhdRetentionReviewItem };

/**
 * Route: /document-retention — Platform Admin / HR Partner / Client Admin
 * (mhd_retention_review_list and mhd_retention_record_decision enforce this
 * server-side; the route guard is UX only). Retention schedules are generic
 * by design (0109): any module can register a retention basis. Nothing here
 * ever deletes a record — approving disposal only records the approval.
 */
export function MhdDocumentRetentionSchedulesPage() {
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? null;
  const [tab, setTab] = useState<RetentionTab>('awaiting');
  const [dialog, setDialog] = useState<ActiveDialog | null>(null);
  const awaiting = useMhdRetentionReview(companyId, 'awaiting');
  const register = useMhdRetentionReview(companyId, 'all');
  const active = tab === 'awaiting' ? awaiting : register;
  const rows = active.data ?? [];

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Document Retention"
        description="The register of retention schedules for company records, and the review of records whose retention period has expired. Approving disposal only records the decision; this application never deletes a record."
      />
      <MhdTabs
        tabs={[
          { value: 'awaiting', label: 'Awaiting Review', count: awaiting.data?.length ?? 0 },
          { value: 'all', label: 'Register', count: register.data?.length ?? 0 },
        ]}
        value={tab}
        onChange={setTab}
      />
      {active.error ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {errorMessage(active.error, 'Unable to load retention schedules.')}
        </div>
      ) : null}
      {active.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : active.error ? null : rows.length === 0 ? (
        <MhdCard>
          <MhdEmptyState
            title={
              tab === 'awaiting'
                ? 'No records are awaiting review.'
                : 'No retention schedules are on file yet.'
            }
            description={
              tab === 'awaiting'
                ? 'Records appear here once their retention period has expired.'
                : undefined
            }
          />
        </MhdCard>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Record Type</MhdTh>
                <MhdTh>Person</MhdTh>
                <MhdTh>Retention Basis</MhdTh>
                <MhdTh>Retention Date</MhdTh>
                <MhdTh>Status</MhdTh>
                <MhdTh>Actions</MhdTh>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => {
                const note = retentionRowNote(item);
                return (
                  <MhdTr key={item.scheduleId}>
                    <MhdTd className="font-medium">
                      {humaniseRetentionEntityType(item.entityType)}
                    </MhdTd>
                    <MhdTd>{item.personName ?? '—'}</MhdTd>
                    <MhdTd>{item.retentionBasis}</MhdTd>
                    <MhdTd>{formatRetentionDate(item.effectiveExpiresAt)}</MhdTd>
                    <MhdTd>
                      <MhdBadge variant={RETENTION_STATUS_VARIANT[item.dispositionStatus]} hideIcon>
                        {RETENTION_STATUS_LABEL[item.dispositionStatus]}
                      </MhdBadge>
                      {item.dispositionStatus === 'LEGAL_HOLD' && item.holdReference ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Hold: {item.holdReference}
                        </p>
                      ) : note ? (
                        <p className="mt-1 text-xs text-muted-foreground">{note}</p>
                      ) : null}
                      {item.blockedReason ? (
                        <p className="mt-1 text-xs text-red-700">
                          Disposal blocked: {item.blockedReason}
                        </p>
                      ) : null}
                    </MhdTd>
                    <MhdTd>
                      <div className="flex flex-wrap gap-2">
                        {availableRetentionDecisions(item.dispositionStatus).map((decision) => (
                          <Button
                            key={decision}
                            variant={decision === 'APPROVE_DISPOSAL' ? 'destructive' : 'secondary'}
                            className="h-8 px-3 text-xs"
                            disabled={
                              decision === 'APPROVE_DISPOSAL' && Boolean(item.blockedReason)
                            }
                            title={
                              decision === 'APPROVE_DISPOSAL' && item.blockedReason
                                ? item.blockedReason
                                : undefined
                            }
                            onClick={() => setDialog({ kind: 'decision', item, decision })}
                          >
                            {RETENTION_DECISION_LABEL[decision]}
                          </Button>
                        ))}
                        <Button
                          variant="ghost"
                          className="h-8 px-3 text-xs"
                          onClick={() => setDialog({ kind: 'history', item })}
                        >
                          History
                        </Button>
                      </div>
                    </MhdTd>
                  </MhdTr>
                );
              })}
            </tbody>
          </MhdTable>
        </MhdCard>
      )}
      {dialog?.kind === 'decision' ? (
        <MhdRetentionDecisionModal
          item={dialog.item}
          decision={dialog.decision}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog?.kind === 'history' ? (
        <MhdRetentionHistoryModal item={dialog.item} onClose={() => setDialog(null)} />
      ) : null}
    </div>
  );
}

export default MhdDocumentRetentionSchedulesPage;
