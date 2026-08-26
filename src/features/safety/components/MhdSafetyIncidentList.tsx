import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { ShieldAlert } from 'lucide-react';
import type { MhdSafetyIncident } from '../Types';

const CLASSIFICATION_LABELS: Record<string, string> = {
  DEATH: 'Death',
  DAYS_AWAY_FROM_WORK: 'Days Away From Work',
  JOB_TRANSFER_OR_RESTRICTION: 'Job Transfer Or Restriction',
  OTHER_RECORDABLE: 'Other Recordable Case',
};

interface MhdSafetyIncidentListProps {
  incidents: MhdSafetyIncident[];
  isLoading: boolean;
}

/**
 * The OSHA 300-log-style table. `displayedSubjectName` already reflects the
 * server-side privacy-case redaction (mhd_list_safety_incidents /
 * mhd_get_safety_incident) — never re-derive or re-implement that
 * redaction here; this component trusts the RPC's response as-is.
 */
export function MhdSafetyIncidentList({ incidents, isLoading }: MhdSafetyIncidentListProps) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading incidents…</p>;
  }

  if (incidents.length === 0) {
    return (
      <MhdEmptyState
        icon={ShieldAlert}
        title="No safety incidents recorded"
        description="Recordable incidents for this establishment and year will appear here."
      />
    );
  }

  return (
    <MhdCard className="overflow-hidden p-0">
      <MhdTable>
        <thead>
          <tr>
            <MhdTh>Case #</MhdTh>
            <MhdTh>Date</MhdTh>
            <MhdTh>Subject</MhdTh>
            <MhdTh>Job title</MhdTh>
            <MhdTh>Classification</MhdTh>
            <MhdTh>Days away</MhdTh>
            <MhdTh>Days restricted</MhdTh>
            <MhdTh>Status</MhdTh>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => (
            <MhdTr key={incident.id}>
              <MhdTd className="font-mono">{incident.caseNumber}</MhdTd>
              <MhdTd>{incident.dateOfIncident}</MhdTd>
              <MhdTd>{incident.displayedSubjectName}</MhdTd>
              <MhdTd>{incident.jobTitle ?? '—'}</MhdTd>
              <MhdTd>{CLASSIFICATION_LABELS[incident.classification] ?? incident.classification}</MhdTd>
              <MhdTd>{incident.daysAwayCount}</MhdTd>
              <MhdTd>{incident.daysRestrictedOrTransferredCount}</MhdTd>
              <MhdTd>{incident.status}</MhdTd>
            </MhdTr>
          ))}
        </tbody>
      </MhdTable>
    </MhdCard>
  );
}
