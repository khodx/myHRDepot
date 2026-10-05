import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdModal } from '@/components/ui/MhdModal';
import { useMhdUpsertProfileRequirement } from '@/features/people/Hook';
import { mhdFormatRelationshipState } from '@/features/people/ProfileCompletenessAccess';
import { mhdProfileRequirementFormSchema } from '@/features/people/Schemas';
import type { MhdProfileRequirement } from '@/features/people/Types';

interface MhdProfileRequirementEditModalProps {
  companyId: string;
  requirement: MhdProfileRequirement;
  onClose: () => void;
}

const CHECKBOX_CLASS = 'h-4 w-4 rounded border-border';

/**
 * Saving always writes a company override (mhd_upsert_profile_requirement),
 * even when the row shown was still a platform default. Platform defaults
 * themselves are not editable here.
 */
export function MhdProfileRequirementEditModal({
  companyId,
  requirement,
  onClose,
}: MhdProfileRequirementEditModalProps) {
  const upsert = useMhdUpsertProfileRequirement();
  const [isRequired, setIsRequired] = useState(requirement.isRequired);
  const [isActive, setIsActive] = useState(requirement.isActive);
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = mhdProfileRequirementFormSchema.safeParse({
      companyId,
      relationshipState: requirement.relationshipState,
      sectionKey: requirement.sectionKey,
      isRequired,
      isActive,
    });
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? 'Invalid requirement.');
      return;
    }
    setValidationError(null);
    upsert.mutate(parsed.data, { onSuccess: onClose });
  }

  const errorMessage =
    validationError ??
    (upsert.error instanceof Error
      ? upsert.error.message
      : upsert.isError
        ? 'Unable to save.'
        : null);

  return (
    <MhdModal
      onClose={onClose}
      title="Edit Profile Requirement"
      className="relative flex w-full max-w-lg flex-col rounded-lg border border-border bg-background shadow-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Edit Profile Requirement</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {requirement.label} for {mhdFormatRelationshipState(requirement.relationshipState)}.
            Saving creates a company override of the platform default.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            className={CHECKBOX_CLASS}
            checked={isRequired}
            onChange={(event) => setIsRequired(event.target.checked)}
          />
          Required
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            className={CHECKBOX_CLASS}
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
          />
          Active
        </label>

        {errorMessage ? (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {errorMessage}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={upsert.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={upsert.isPending}>
            {upsert.isPending ? 'Saving...' : 'Save Override'}
          </Button>
        </div>
      </form>
    </MhdModal>
  );
}
