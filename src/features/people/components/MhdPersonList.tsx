import { Users } from 'lucide-react';
import { MhdAvatar } from '@/components/ui/MhdAvatar';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
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
import type { MhdPerson } from '@/features/people/Types';

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

  const visiblePeople = people.slice(0, 10);

  return (
    <MhdCard className="overflow-hidden p-0">
      <MhdTable>
        <thead>
          <tr>
            <MhdTh className="w-10">
              <input type="checkbox" aria-label="Select all people" className="h-4 w-4 rounded" />
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
                    checked={selected}
                    onChange={() => onSelectPerson(person.id)}
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
                    <MhdAvatar name={person.displayName} detail={person.referenceId} />
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
      <MhdTableFooter
        summary={`Showing 1 to ${Math.min(10, people.length)} of ${people.length} people`}
      />
    </MhdCard>
  );
}
