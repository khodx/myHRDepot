import { useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { MhdAvatar } from '@/components/ui/MhdAvatar';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { mhdPaginationSummary, MhdPaginationControls, useMhdPagination } from '@/components/ui/MhdPagination';
import {
  MhdActionsTh,
  MhdTable,
  MhdTableActions,
  MhdTableFooter,
  MhdTd,
  MhdTh,
  MhdTr,
} from '@/components/ui/MhdTable';
import { cn } from '@/utils/cn';
import { useMhdPersonPhotoUrls } from '@/features/people/Hook';
import type { MhdPerson } from '@/features/people/Types';
import { MhdDocumentMergeBatchLauncher } from '@/components/ui/MhdDocumentMergeBatchLauncher';

interface MhdPersonListProps {
  people: MhdPerson[];
  selectedPersonId: string | null;
  isLoading: boolean;
  onSelectPerson: (personId: string) => void;
}

export function MhdPersonList({
  people,
  selectedPersonId,
  isLoading,
  onSelectPerson,
}: MhdPersonListProps) {
  const [selectedPersonIds, setSelectedPersonIds] = useState<Set<string>>(new Set());
  const [launcherOpen, setLauncherOpen] = useState(false);
  const pagination = useMhdPagination(people.length, {
    resetKey: `${people.length}:${people[0]?.id ?? ''}`,
  });
  const visiblePeople = pagination.sliceItems(people);
  const selectedCompanyIds = useMemo(
    () => new Set(people.filter((person) => selectedPersonIds.has(person.id)).map((person) => person.companyId)),
    [people, selectedPersonIds],
  );
  const selectedCompanyId = selectedCompanyIds.size === 1 ? [...selectedCompanyIds][0] : '';
  const visibleIds = visiblePeople.map((person) => person.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedPersonIds.has(id));

  function togglePerson(personId: string) {
    setSelectedPersonIds((current) => {
      const next = new Set(current);
      if (next.has(personId)) next.delete(personId);
      else next.add(personId);
      return next;
    });
  }

  function toggleVisiblePeople() {
    setSelectedPersonIds((current) => {
      const next = new Set(current);
      visibleIds.forEach((id) => (allVisibleSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  }
  // Only the currently visible page's photos, not every loaded person — a
  // company with hundreds of people shouldn't sign hundreds of Storage paths
  // just because they're all in memory for client-side pagination.
  const photoUrlsQuery = useMhdPersonPhotoUrls(visiblePeople.map((person) => person.photoPath));

  if (isLoading) {
    return <MhdCard className="text-sm text-muted-foreground">Loading people...</MhdCard>;
  }

  if (people.length === 0) {
    return (
      <MhdCard className="border border-dashed border-border">
        <MhdEmptyState
          icon={Users}
          title="No people found"
          description="Adjust the company filter or search term."
        />
      </MhdCard>
    );
  }

  return (
    <>
      {selectedPersonIds.size > 0 ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">{selectedPersonIds.size} selected</span>
          <div className="flex items-center gap-2">
            <button type="button" className="text-sm text-muted-foreground underline" onClick={() => setSelectedPersonIds(new Set())}>Clear selection</button>
            <Button disabled={!selectedCompanyId} onClick={() => setLauncherOpen(true)}>Generate Documents</Button>
          </div>
        </div>
      ) : null}
      <MhdCard className="overflow-hidden p-0">
      <MhdTable>
        <thead>
          <tr>
            <MhdTh className="w-10">
              <input type="checkbox" aria-label="Select all people" checked={allVisibleSelected} onChange={toggleVisiblePeople} className="h-4 w-4 rounded" />
            </MhdTh>
            <MhdTh>Person</MhdTh>
            <MhdTh>Company</MhdTh>
            <MhdTh>Email</MhdTh>
            <MhdTh>Phone</MhdTh>
            <MhdTh>Updated</MhdTh>
            <MhdActionsTh />
          </tr>
        </thead>
        <tbody>
          {visiblePeople.map((person) => {
            const selected = person.id === selectedPersonId;
            return (
              <MhdTr
                key={person.id}
                to={`/people/${person.id}`}
                className={cn(selected ? 'bg-accent-tint hover:bg-accent-tint/80' : undefined)}
              >
                <MhdTd>
                  <input
                    type="checkbox"
                    checked={selectedPersonIds.has(person.id)}
                    onChange={() => togglePerson(person.id)}
                    aria-label={`Select ${person.displayName}`}
                    className="h-4 w-4 rounded"
                  />
                </MhdTd>
                <MhdTd>
                  <button
                    type="button"
                    className="text-left"
                    onClick={() => onSelectPerson(person.id)}
                  >
                    <MhdAvatar
                      name={person.displayName}
                      detail={person.referenceId}
                      photoUrl={person.photoPath ? photoUrlsQuery.data?.[person.photoPath] : null}
                    />
                  </button>
                </MhdTd>
                <MhdTd className="text-muted-foreground">
                  {person.companyName ?? 'Company unavailable'}
                </MhdTd>
                <MhdTd className="text-muted-foreground">{person.primaryEmail ?? '-'}</MhdTd>
                <MhdTd className="text-muted-foreground">
                  {person.primaryPhone ?? person.primaryMobile ?? '-'}
                </MhdTd>
                <MhdTd className="whitespace-nowrap text-muted-foreground">
                  {new Date(person.updatedAt).toLocaleDateString()}
                </MhdTd>
                <MhdTableActions
                  viewTo={`/people/${person.id}`}
                  editTo={`/people/${person.id}/edit`}
                />
              </MhdTr>
            );
          })}
        </tbody>
      </MhdTable>
      <MhdTableFooter summary={mhdPaginationSummary(pagination, people.length, 'people')}>
        <MhdPaginationControls pagination={pagination} />
      </MhdTableFooter>
      </MhdCard>
      {launcherOpen ? (
        <MhdDocumentMergeBatchLauncher
          companyId={selectedCompanyId}
          personIds={[...selectedPersonIds]}
          onClose={() => setLauncherOpen(false)}
        />
      ) : null}
    </>
  );
}
