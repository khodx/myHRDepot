import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdTable, MhdTableFooter, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdIncompleteProfiles, useMhdProfileSectionDefinitions } from '@/features/people/Hook';
import {
  MHD_INCOMPLETE_PROFILES_PAGE_SIZE,
  mhdFormatRelationshipState,
} from '@/features/people/ProfileCompletenessAccess';

interface MhdIncompleteProfilesPanelProps {
  companyId: string | null;
}

function errorText(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/** HR worklist: people whose required profile sections are still missing. */
export function MhdIncompleteProfilesPanel({ companyId }: MhdIncompleteProfilesPanelProps) {
  // Page is tracked with the company it belongs to so switching company
  // returns to the first page without an effect.
  const [pageState, setPageState] = useState<{ companyId: string | null; page: number }>({
    companyId,
    page: 0,
  });
  const page = pageState.companyId === companyId ? pageState.page : 0;
  const offset = page * MHD_INCOMPLETE_PROFILES_PAGE_SIZE;

  const profilesQuery = useMhdIncompleteProfiles(
    companyId,
    MHD_INCOMPLETE_PROFILES_PAGE_SIZE,
    offset,
  );
  const sectionsQuery = useMhdProfileSectionDefinitions();

  const labelByKey = useMemo(
    () => new Map((sectionsQuery.data ?? []).map((section) => [section.sectionKey, section.label])),
    [sectionsQuery.data],
  );

  if (!companyId) {
    return (
      <MhdCard className="text-sm text-muted-foreground">
        Select a company to see its incomplete profiles.
      </MhdCard>
    );
  }

  if (profilesQuery.isLoading) {
    return (
      <MhdCard className="text-sm text-muted-foreground">Loading incomplete profiles...</MhdCard>
    );
  }

  if (profilesQuery.isError) {
    return (
      <p
        role="alert"
        className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        {errorText(profilesQuery.error, 'Unable to load incomplete profiles.')}
      </p>
    );
  }

  const profiles = profilesQuery.data ?? [];

  if (profiles.length === 0 && page === 0) {
    return (
      <MhdCard className="border border-dashed border-border">
        <MhdEmptyState
          icon={CircleCheck}
          title="No incomplete profiles"
          description="Every person in this company has completed their required profile sections."
        />
      </MhdCard>
    );
  }

  const hasNextPage = profiles.length === MHD_INCOMPLETE_PROFILES_PAGE_SIZE;
  const rangeStart = profiles.length === 0 ? 0 : offset + 1;
  const rangeEnd = offset + profiles.length;

  return (
    <div className="space-y-3">
      {sectionsQuery.isError ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {errorText(sectionsQuery.error, 'Unable to load section names.')}
        </p>
      ) : null}
      <MhdCard className="overflow-hidden p-0">
        <MhdTable>
          <thead>
            <tr>
              <MhdTh>Person</MhdTh>
              <MhdTh>Relationship</MhdTh>
              <MhdTh>Progress</MhdTh>
              <MhdTh>Missing Sections</MhdTh>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => (
              <MhdTr key={profile.personId}>
                <MhdTd>
                  <Link
                    to={`/people/${profile.personId}`}
                    className="font-medium text-accent-hover hover:underline"
                  >
                    {profile.personName}
                  </Link>
                </MhdTd>
                <MhdTd className="text-muted-foreground">
                  {mhdFormatRelationshipState(profile.relationshipState)}
                </MhdTd>
                <MhdTd className="whitespace-nowrap text-muted-foreground">
                  {profile.requiredComplete} of {profile.requiredTotal} required
                </MhdTd>
                <MhdTd>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.missingSections.map((sectionKey) => (
                      <MhdBadge key={sectionKey} variant="warning" hideIcon>
                        {labelByKey.get(sectionKey) ?? sectionKey}
                      </MhdBadge>
                    ))}
                  </div>
                </MhdTd>
              </MhdTr>
            ))}
          </tbody>
        </MhdTable>
        <MhdTableFooter summary={`Showing ${rangeStart} to ${rangeEnd} incomplete profiles`}>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              disabled={page === 0}
              onClick={() => setPageState({ companyId, page: page - 1 })}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={!hasNextPage}
              onClick={() => setPageState({ companyId, page: page + 1 })}
            >
              Next
            </Button>
          </div>
        </MhdTableFooter>
      </MhdCard>
    </div>
  );
}
