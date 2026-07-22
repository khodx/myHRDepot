import type { MhdPerson } from '@/features/people/Types';

interface MhdPersonListProps {
  people: MhdPerson[];
  selectedPersonId: string | null;
  isLoading: boolean;
  onSelectPerson: (personId: string) => void;
}

export function MhdPersonList({ people, selectedPersonId, isLoading, onSelectPerson }: MhdPersonListProps) {
  if (isLoading) {
    return <div className="rounded-lg border border-slate-200 bg-card p-4 text-sm text-slate-500">Loading people...</div>;
  }

  if (people.length === 0) {
    return <div className="rounded-lg border border-dashed border-slate-300 bg-card p-4 text-sm text-slate-500">No people found.</div>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-card shadow-sm">
      <ul className="divide-y divide-slate-200">
        {people.map((person) => {
          const selected = person.id === selectedPersonId;
          return (
            <li key={person.id}>
              <button
                type="button"
                className={`w-full px-4 py-3 text-left hover:bg-blue-50 ${selected ? 'bg-blue-50' : 'bg-card'}`}
                onClick={() => onSelectPerson(person.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{person.displayName}</p>
                    <p className="text-xs text-slate-500">{person.referenceId}</p>
                    <p className="mt-1 text-sm text-slate-600">{person.companyName ?? 'Company unavailable'}</p>
                  </div>
                  {person.primaryEmail ? <span className="text-xs text-blue-700">{person.primaryEmail}</span> : null}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
