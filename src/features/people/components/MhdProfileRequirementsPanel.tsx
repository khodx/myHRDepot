import { useState } from 'react';
import { ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdActionsTh, MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdProfileRequirements } from '@/features/people/Hook';
import { mhdFormatRelationshipState } from '@/features/people/ProfileCompletenessAccess';
import type { MhdProfileRequirement } from '@/features/people/Types';
import { MhdProfileRequirementEditModal } from './MhdProfileRequirementEditModal';

interface MhdProfileRequirementsPanelProps {
  companyId: string | null;
}

/** Rules table: which profile sections each relationship state requires for a company. */
export function MhdProfileRequirementsPanel({ companyId }: MhdProfileRequirementsPanelProps) {
  const requirementsQuery = useMhdProfileRequirements(companyId);
  const [editing, setEditing] = useState<MhdProfileRequirement | null>(null);

  if (!companyId) {
    return (
      <MhdCard className="text-sm text-muted-foreground">
        Select a company to see its profile requirements.
      </MhdCard>
    );
  }

  if (requirementsQuery.isLoading) {
    return (
      <MhdCard className="text-sm text-muted-foreground">Loading profile requirements...</MhdCard>
    );
  }

  if (requirementsQuery.isError) {
    return (
      <p
        role="alert"
        className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        {requirementsQuery.error instanceof Error
          ? requirementsQuery.error.message
          : 'Unable to load profile requirements.'}
      </p>
    );
  }

  const requirements = requirementsQuery.data ?? [];

  if (requirements.length === 0) {
    return (
      <MhdCard className="border border-dashed border-border">
        <MhdEmptyState
          icon={ListChecks}
          title="No profile requirements"
          description="No profile requirement rules apply to this company."
        />
      </MhdCard>
    );
  }

  return (
    <>
      <MhdCard className="overflow-hidden p-0">
        <MhdTable>
          <thead>
            <tr>
              <MhdTh>Relationship</MhdTh>
              <MhdTh>Section</MhdTh>
              <MhdTh>Requirement</MhdTh>
              <MhdTh>Status</MhdTh>
              <MhdTh>Source</MhdTh>
              <MhdActionsTh />
            </tr>
          </thead>
          <tbody>
            {requirements.map((requirement) => (
              <MhdTr key={`${requirement.relationshipState}:${requirement.sectionKey}`}>
                <MhdTd className="text-muted-foreground">
                  {mhdFormatRelationshipState(requirement.relationshipState)}
                </MhdTd>
                <MhdTd className="font-medium">{requirement.label}</MhdTd>
                <MhdTd>
                  <MhdBadge variant={requirement.isRequired ? 'info' : 'neutral'}>
                    {requirement.isRequired ? 'Required' : 'Optional'}
                  </MhdBadge>
                </MhdTd>
                <MhdTd>
                  <MhdBadge variant={requirement.isActive ? 'success' : 'neutral'}>
                    {requirement.isActive ? 'Active' : 'Inactive'}
                  </MhdBadge>
                </MhdTd>
                <MhdTd className="text-muted-foreground">
                  {requirement.isOverride ? 'Company Override' : 'Platform Default'}
                </MhdTd>
                <MhdTd className="whitespace-nowrap text-right" data-row-click-ignore>
                  <Button
                    variant="secondary"
                    aria-label={`Edit ${requirement.label} for ${mhdFormatRelationshipState(requirement.relationshipState)}`}
                    onClick={() => setEditing(requirement)}
                  >
                    Edit
                  </Button>
                </MhdTd>
              </MhdTr>
            ))}
          </tbody>
        </MhdTable>
      </MhdCard>
      {editing ? (
        <MhdProfileRequirementEditModal
          companyId={companyId}
          requirement={editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </>
  );
}
