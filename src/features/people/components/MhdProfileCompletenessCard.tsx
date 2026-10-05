import { CircleAlert, CircleCheck } from 'lucide-react';
import { MhdCard } from '@/components/ui/MhdCard';
import { useMhdPersonProfileCompleteness } from '@/features/people/Hook';
import { mhdIsInsufficientPrivilegeError } from '@/features/people/Service';

interface MhdProfileCompletenessCardProps {
  personId: string;
}

/**
 * Per-person completeness checklist (presence only, never values). The RPC
 * raises 42501 for callers who may not see it; that renders nothing at all.
 */
export function MhdProfileCompletenessCard({ personId }: MhdProfileCompletenessCardProps) {
  const completenessQuery = useMhdPersonProfileCompleteness(personId);

  if (completenessQuery.isError && mhdIsInsufficientPrivilegeError(completenessQuery.error)) {
    return null;
  }

  const sections = [...(completenessQuery.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const requiredSections = sections.filter((section) => section.isRequired);
  const completeRequired = requiredSections.filter((section) => section.isComplete).length;

  return (
    <MhdCard className="p-6 shadow-sm">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-neutral-900">Profile Completeness</h2>
        {sections.length > 0 ? (
          <span className="text-sm text-neutral-500">
            {completeRequired} of {requiredSections.length} required complete
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        Which profile sections have been filled in. Only whether a section is present is shown,
        never its contents.
      </p>
      {completenessQuery.isLoading ? (
        <p className="mt-2 text-sm text-neutral-500">Loading profile completeness...</p>
      ) : completenessQuery.isError ? (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {completenessQuery.error instanceof Error
            ? completenessQuery.error.message
            : 'Unable to load profile completeness.'}
        </p>
      ) : sections.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-500">No profile sections apply to this person.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {sections.map((section) => (
            <li key={section.sectionKey} className="flex items-center gap-2">
              {section.isComplete ? (
                <CircleCheck className="h-4 w-4 text-green-600" aria-hidden />
              ) : (
                <CircleAlert className="h-4 w-4 text-amber-600" aria-hidden />
              )}
              <span className="text-neutral-900">{section.label}</span>
              <span className="text-neutral-500">
                {section.isComplete ? 'Complete' : 'Missing'}
                {section.isRequired ? '' : ' (optional)'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </MhdCard>
  );
}
