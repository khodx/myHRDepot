import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Library } from 'lucide-react';
import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdFilterBar, MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MHD_PILL_BUTTON_CLASS } from '@/components/ui/mhdPillButton';
import {
  mhdPaginationSummary,
  MhdPaginationControls,
  useMhdPagination,
} from '@/components/ui/MhdPagination';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import {
  MhdActionsTh,
  MhdTable,
  MhdTableFooter,
  MhdTd,
  MhdTh,
  MhdTr,
} from '@/components/ui/MhdTable';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdCanAccessFormsStudio } from '@/appshell/mhdRouteAccess';
import { mhdEmployeeFileLabelForKey } from '@/features/employee-files/Types';
import { useMhdFormLibrary } from '../Hook';
import { mhdFormService } from '../Service';
import type { MhdFormLibraryEntry, MhdFormStatus } from '../Types';

const STATUS_OPTIONS: Array<{ value: MhdFormStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ARCHIVED', label: 'Archived' },
];

function statusBadgeVariant(status: MhdFormStatus): MhdBadgeVariant {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'ARCHIVED':
      return 'neutral';
    case 'DRAFT':
    default:
      return 'warning';
  }
}

/** MhdFormLibraryPage — the Forms Library browse/launch surface (`/forms/library`, wired in by the router step). */
export function MhdFormLibraryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, roles } = useMhdAuth();
  const canFork = mhdCanAccessFormsStudio(roles);
  const libraryState = useMhdFormLibrary(profile?.companyId ?? null);
  const [forkingId, setForkingId] = useState<string | null>(null);
  const [forkError, setForkError] = useState<string | null>(null);

  const pagination = useMhdPagination(libraryState.entries.length, {
    resetKey: `${libraryState.entries.length}:${libraryState.entries[0]?.id ?? ''}:${libraryState.filters.status}`,
  });

  async function handleFork(entry: MhdFormLibraryEntry) {
    if (!profile?.companyId || forkingId) return;

    setForkError(null);
    setForkingId(entry.id);
    try {
      const newFormId = await mhdFormService.forkFormFromLibrary(entry.id, profile.companyId);
      navigate(`/forms/${newFormId}/edit`);
    } catch (error) {
      setForkError(error instanceof Error ? error.message : 'Unable to fork form.');
      setForkingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Forms Library"
        description="Browse platform-wide library forms and your company's own forms, then use one directly or fork a library form into your company for customization."
      />

      {libraryState.errorMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {libraryState.errorMessage}
        </div>
      ) : null}

      {forkError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {forkError}
        </div>
      ) : null}

      <MhdFilterBar>
        <MhdFilterSelect
          label="Status"
          value={libraryState.filters.status}
          onChange={(event) =>
            libraryState.setFilters((current) => ({
              ...current,
              status: event.target.value as MhdFormStatus | 'ALL',
            }))
          }
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </MhdFilterSelect>
      </MhdFilterBar>

      {libraryState.isLoading ? (
        <MhdCard className="p-6 text-sm text-muted-foreground">Loading form library...</MhdCard>
      ) : libraryState.entries.length === 0 ? (
        <MhdCard className="border border-dashed border-border">
          <MhdEmptyState
            icon={Library}
            title="No forms found"
            description="No library or company forms found for the selected status filter."
          />
        </MhdCard>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Form</MhdTh>
                <MhdTh>Source</MhdTh>
                <MhdTh>Category</MhdTh>
                <MhdTh>Status</MhdTh>
                <MhdActionsTh />
              </tr>
            </thead>
            <tbody>
              {pagination.sliceItems(libraryState.entries).map((entry) => (
                <MhdTr key={entry.id}>
                  <MhdTd>
                    <div>
                      <p className="font-medium text-foreground">{entry.name}</p>
                      <p className="text-xs text-muted-foreground">{entry.referenceId}</p>
                      {entry.description ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {entry.description}
                        </p>
                      ) : null}
                    </div>
                  </MhdTd>
                  <MhdTd>
                    <MhdBadge variant={entry.isLibrary ? 'info' : 'neutral'}>
                      {entry.isLibrary ? 'Library' : 'Company Form'}
                    </MhdBadge>
                  </MhdTd>
                  <MhdTd className="text-sm text-muted-foreground">
                    {entry.employeeFileCategory
                      ? mhdEmployeeFileLabelForKey(entry.employeeFileCategory)
                      : '—'}
                  </MhdTd>
                  <MhdTd>
                    <MhdBadge variant={statusBadgeVariant(entry.status)}>{entry.status}</MhdBadge>
                  </MhdTd>
                  <MhdTd className="whitespace-nowrap text-right" data-row-click-ignore>
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        to={`/forms/${entry.id}/render${entry.intakeKind ? `?intakeAction=${entry.intakeKind}` : ''}`}
                        state={{ backgroundLocation: location }}
                        className={`${MHD_PILL_BUTTON_CLASS} px-3 py-1 text-xs`}
                      >
                        Use Form
                      </Link>
                      {entry.isLibrary && canFork ? (
                        <button
                          type="button"
                          onClick={() => void handleFork(entry)}
                          disabled={forkingId === entry.id}
                          className="text-xs font-medium text-accent hover:text-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {forkingId === entry.id ? 'Forking...' : 'Fork to My Forms'}
                        </button>
                      ) : null}
                    </div>
                  </MhdTd>
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
          <MhdTableFooter
            summary={mhdPaginationSummary(pagination, libraryState.entries.length, 'forms')}
          >
            <MhdPaginationControls pagination={pagination} />
          </MhdTableFooter>
        </MhdCard>
      )}
    </div>
  );
}
