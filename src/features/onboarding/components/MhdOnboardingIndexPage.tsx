import { useMemo, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdFilterBar, MhdFilterInput, MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import {
  MhdActionsTh,
  MhdTable,
  MhdTableActions,
  MhdTableFooter,
  MhdTd,
  MhdTh,
  MhdTr,
} from '@/components/ui/MhdTable';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdOnboardingRoster } from '../Hook';
import type { MhdOnboardingRosterFilter, MhdOnboardingRosterRow } from '../Types';
import { MhdStartOnboardingDialog } from './MhdStartOnboardingDialog';

const STATUS_OPTIONS: Array<{ value: MhdOnboardingRosterFilter; label: string }> = [
  { value: 'ALL', label: 'All people' },
  { value: 'NOT_STARTED', label: 'Not started' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETE', label: 'Complete' },
];

function rosterStatus(row: MhdOnboardingRosterRow): {
  label: string;
  variant: MhdBadgeVariant;
} {
  if (row.isComplete) return { label: 'Complete', variant: 'success' };
  if (row.isStarted) return { label: 'In Progress', variant: 'info' };
  return { label: 'Not Started', variant: 'neutral' };
}

function matchesFilter(row: MhdOnboardingRosterRow, filter: MhdOnboardingRosterFilter): boolean {
  switch (filter) {
    case 'NOT_STARTED':
      return !row.isStarted;
    case 'IN_PROGRESS':
      return row.isStarted && !row.isComplete;
    case 'COMPLETE':
      return row.isComplete;
    case 'ALL':
    default:
      return true;
  }
}

function formatDue(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : '—';
}

/**
 * /onboarding — the new-hire packet roster.
 *
 * Before this page the onboarding module had no top-level surface at all: the
 * checklist rendered only as a card at the bottom of /people/:personId, so the
 * module was effectively unreachable from the navigation.
 *
 * The route admits Platform Admin, HR Partner, and Client Admin only (see
 * MHD_ROUTE_ACCESS), which matches the access rule baked into
 * mhd_list_onboarding_progress_for_company, so there is no read-only fallback
 * rendering to do here.
 */
export function MhdOnboardingIndexPage() {
  const { profile } = useMhdAuth();
  const roster = useMhdOnboardingRoster(profile?.companyId ?? null);

  const [statusFilter, setStatusFilter] = useState<MhdOnboardingRosterFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [enrolling, setEnrolling] = useState<MhdOnboardingRosterRow | null>(null);

  const visibleRows = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    return roster.rows.filter((row) => {
      if (!matchesFilter(row, statusFilter)) return false;
      if (!needle) return true;
      return (
        row.displayName.toLowerCase().includes(needle) ||
        row.referenceId.toLowerCase().includes(needle) ||
        (row.primaryEmail ?? '').toLowerCase().includes(needle)
      );
    });
  }, [roster.rows, searchTerm, statusFilter]);

  const counts = useMemo(
    () => ({
      notStarted: roster.rows.filter((row) => !row.isStarted).length,
      inProgress: roster.rows.filter((row) => row.isStarted && !row.isComplete).length,
      complete: roster.rows.filter((row) => row.isComplete).length,
    }),
    [roster.rows],
  );

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Onboarding"
        description={`New-hire packet progress across the company. Each packet carries ${roster.packetSize} required documents.`}
      />

      {roster.errorMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {roster.errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <MhdCard className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Not Started
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{counts.notStarted}</p>
        </MhdCard>
        <MhdCard className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            In Progress
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{counts.inProgress}</p>
        </MhdCard>
        <MhdCard className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Complete
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{counts.complete}</p>
        </MhdCard>
      </div>

      <MhdFilterBar
        onClear={() => {
          setStatusFilter('ALL');
          setSearchTerm('');
        }}
      >
        <MhdFilterInput
          label="Search"
          value={searchTerm}
          placeholder="Name, reference, or email"
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <MhdFilterSelect
          label="Packet Status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as MhdOnboardingRosterFilter)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </MhdFilterSelect>
      </MhdFilterBar>

      {roster.isLoading ? (
        <MhdCard className="p-6 text-sm text-muted-foreground">
          Loading onboarding roster...
        </MhdCard>
      ) : visibleRows.length === 0 ? (
        <MhdCard className="border border-dashed border-border">
          <MhdEmptyState
            icon={UserPlus}
            title="No people found"
            description="No people match the selected packet status or search term."
          />
        </MhdCard>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Person</MhdTh>
                <MhdTh>Packet Status</MhdTh>
                <MhdTh>Required Complete</MhdTh>
                <MhdTh>Next Due</MhdTh>
                <MhdTh>Last Activity</MhdTh>
                <MhdActionsTh />
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                const status = rosterStatus(row);
                const completed = row.progress?.requiredCompleted ?? 0;

                return (
                  <MhdTr key={row.personId} to={`/onboarding/${row.personId}`}>
                    <MhdTd>
                      <div>
                        <p className="font-medium text-foreground">{row.displayName}</p>
                        <p className="text-xs text-muted-foreground">{row.referenceId}</p>
                        {row.primaryEmail ? (
                          <p className="mt-1 text-sm text-muted-foreground">{row.primaryEmail}</p>
                        ) : null}
                      </div>
                    </MhdTd>
                    <MhdTd>
                      <MhdBadge variant={status.variant}>{status.label}</MhdBadge>
                    </MhdTd>
                    <MhdTd className="text-sm text-muted-foreground">
                      {completed}/{row.packetSize}
                    </MhdTd>
                    <MhdTd className="text-sm text-muted-foreground">
                      {formatDue(row.progress?.nextDueDate ?? null)}
                    </MhdTd>
                    <MhdTd className="text-sm text-muted-foreground">
                      {row.progress?.lastActivityAt
                        ? new Date(row.progress.lastActivityAt).toLocaleString()
                        : '—'}
                    </MhdTd>
                    <MhdTableActions
                      viewTo={`/onboarding/${row.personId}`}
                      secondaryActions={
                        <button
                          type="button"
                          onClick={() => setEnrolling(row)}
                          className="text-accent hover:text-accent-hover"
                        >
                          {row.isStarted ? 'Add Items' : 'Start Onboarding'}
                        </button>
                      }
                    />
                  </MhdTr>
                );
              })}
            </tbody>
          </MhdTable>
          <MhdTableFooter
            summary={`Showing 1 to ${visibleRows.length} of ${visibleRows.length} people`}
          />
        </MhdCard>
      )}

      {enrolling ? (
        <MhdStartOnboardingDialog row={enrolling} onClose={() => setEnrolling(null)} />
      ) : null}
    </div>
  );
}
