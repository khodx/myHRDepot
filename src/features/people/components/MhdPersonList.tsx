import { Users } from 'lucide-react';
import { MhdAvatar } from '@/components/ui/MhdAvatar';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
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
      <MhdCard className="border-dashed">
        <MhdEmptyState
          icon={Users}
          title="No people found"
          description="Adjust the company filter or search term."
        />
      </MhdCard>
    );
  }

  return (
    <MhdCard className="overflow-hidden p-0">
      <ul className="divide-y divide-border">
        {people.map((person) => {
          const selected = person.id === selectedPersonId;
          return (
            <li key={person.id}>
              <button
                type="button"
                className={cn(
                  'w-full px-4 py-3 text-left transition-colors hover:bg-accent-tint/60',
                  selected ? 'bg-accent-tint' : 'bg-card',
                )}
                onClick={() => onSelectPerson(person.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <MhdAvatar
                    name={person.displayName}
                    detail={`${person.referenceId} · ${person.companyName ?? 'Company unavailable'}`}
                  />
                  {person.primaryEmail ? (
                    <span className="text-xs text-accent-hover">{person.primaryEmail}</span>
                  ) : null}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </MhdCard>
  );
}
