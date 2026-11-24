import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Accessibility } from 'lucide-react';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdFilterBar, MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTableActions, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { MhdViewToggle } from '@/components/ui/MhdViewToggle';
import {
  mhdReadPersistedViewMode,
  mhdWritePersistedViewMode,
  type MhdViewMode,
} from '@/components/ui/MhdViewToggleUtils';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdAccommodationsIsPrivileged } from '@/appshell/mhdRouteAccess';
import {
  useMhdAccommodationCases,
  useMhdAccommodationPeople,
  useMhdAccommodationReadiness,
} from '../Hook';
import {
  MHD_ACCOMMODATION_STATUSES,
  mhdFormatAccommodationValue,
  type MhdAccommodationStatus,
} from '../Types';
import { MhdAccommodationBoard } from './MhdAccommodationBoard';
import { MhdAccommodationTeamPanel } from './MhdAccommodationTeamPanel';
import { MhdComplianceGateBanner } from '@/components/ui/MhdComplianceGateBanner';
import MhdBenefitIntakeButton from '@/components/ui/MhdBenefitIntakeButton';
import {
  MhdBenefitIntakeDraftsPanel,
  MhdBenefitIntakeTabs,
  type MhdBenefitIntakeTab,
} from '@/components/ui/MhdBenefitIntakeTabs';
import { mhdBenefitIntakeBucket } from '@/features/benefit-intake/Types';

const MHD_ACCOMMODATIONS_VIEW_KEY = 'mhd:accommodations:view';

export function MhdAccommodationsPage() {
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const selfPersonId = profile?.personId ?? null;
  const isPrivileged = mhdAccommodationsIsPrivileged(roles);
  const [status, setStatus] = useState<MhdAccommodationStatus | 'ALL'>('ALL');
  const [personId, setPersonId] = useState(isPrivileged ? '' : (selfPersonId ?? ''));
  const [viewMode, setViewMode] = useState<MhdViewMode>(() =>
    mhdReadPersistedViewMode(MHD_ACCOMMODATIONS_VIEW_KEY),
  );

  function handleViewModeChange(mode: MhdViewMode) {
    setViewMode(mode);
    mhdWritePersistedViewMode(MHD_ACCOMMODATIONS_VIEW_KEY, mode);
  }

  const cases = useMhdAccommodationCases(companyId || null, status, personId || null);
  const [tab, setTab] = useState<MhdBenefitIntakeTab>('ALL');
  const allCases = cases.data ?? [];
  const bucketOf = (item: (typeof allCases)[number]) =>
    mhdBenefitIntakeBucket('ACCOMMODATION', item.status);
  const caseList =
    tab === 'IN_PROGRESS' || tab === 'SUBMITTED_CURRENT'
      ? allCases.filter((item) => bucketOf(item) === tab)
      : allCases;
  const counts = {
    ALL: allCases.length,
    IN_PROGRESS: allCases.filter((item) => bucketOf(item) === 'IN_PROGRESS').length,
    SUBMITTED_CURRENT: allCases.filter((item) => bucketOf(item) === 'SUBMITTED_CURRENT').length,
  };
  const people = useMhdAccommodationPeople(isPrivileged ? companyId || null : null);
  const readiness = useMhdAccommodationReadiness();
  const peopleOptions = useMemo(
    () =>
      (people.data ?? []).map((person) => ({ id: person.id, name: person.displayName })),
    [people.data],
  );

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Reasonable accommodations"
        description="Requests, interactive process, options, decisions, implementation, and review."
        actions={
          <>
            <Link
              to="/accommodations/option-library"
              className="inline-flex h-9 items-center rounded-md border border-border bg-card px-3 text-[16.8px] font-semibold text-foreground hover:bg-accent-tint"
            >
              Option Library
            </Link>
            <MhdBenefitIntakeButton />
          </>
        }
      />
      <MhdComplianceGateBanner readiness={readiness.data} />
      {!isPrivileged ? <MhdAccommodationTeamPanel managerPersonId={selfPersonId} /> : null}

      <MhdBenefitIntakeTabs value={tab} onChange={setTab} counts={counts} />

      <MhdFilterBar>
        {isPrivileged ? (
          <MhdFilterSelect
            label="Person"
            value={personId}
            onChange={(event) => setPersonId(event.target.value)}
          >
            <option value="">All people</option>
            {peopleOptions.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </MhdFilterSelect>
        ) : null}
        <MhdFilterSelect
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value as MhdAccommodationStatus | 'ALL')}
        >
          <option value="ALL">All statuses</option>
          {MHD_ACCOMMODATION_STATUSES.map((value) => (
            <option key={value} value={value}>
              {mhdFormatAccommodationValue(value)}
            </option>
          ))}
        </MhdFilterSelect>
      </MhdFilterBar>

      <div className="flex justify-end">
        <MhdViewToggle value={viewMode} onChange={handleViewModeChange} />
      </div>

      {tab === 'DRAFTS' ? (
        <MhdBenefitIntakeDraftsPanel />
      ) : cases.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading accommodation cases…</p>
      ) : caseList.length === 0 ? (
        <MhdEmptyState
          icon={Accessibility}
          title="No accommodation cases"
          description="Requests will appear here whether they begin verbally, in writing, or through another workflow."
        />
      ) : viewMode === 'board' ? (
        <MhdAccommodationBoard cases={caseList} isLoading={cases.isLoading} />
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Reference</MhdTh>
                <MhdTh>Person</MhdTh>
                <MhdTh>Request</MhdTh>
                <MhdTh>Status</MhdTh>
                <MhdTh>Review due</MhdTh>
                <MhdTh />
              </tr>
            </thead>
            <tbody>
              {caseList.map((item) => (
                <MhdTr key={item.id} to={`/accommodations/${item.id}`}>
                  <MhdTd className="font-mono">{item.referenceId}</MhdTd>
                  <MhdTd>{item.personDisplayName}</MhdTd>
                  <MhdTd>{mhdFormatAccommodationValue(item.requestSource)}</MhdTd>
                  <MhdTd>{mhdFormatAccommodationValue(item.status)}</MhdTd>
                  <MhdTd>{item.reviewDueDate ?? '—'}</MhdTd>
                  <MhdTableActions viewTo={`/accommodations/${item.id}`} />
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
        </MhdCard>
      )}
    </div>
  );
}
