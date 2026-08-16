import { Navigate, useParams } from 'react-router-dom';
import { MhdAccommodationCaseRecordTabs } from '@/appshell/components/MhdAccommodationCaseRecordTabs';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAccommodationCase } from '@/features/accommodations/Hook';
import { MhdCorrespondencePanel } from './MhdCorrespondencePanel';

export function MhdAccommodationCaseCorrespondencePage() {
  const { caseId = '' } = useParams<{ caseId: string }>();
  const detail = useMhdAccommodationCase(caseId);
  const record = detail.data;

  if (!caseId) return <Navigate to="/accommodations" replace />;

  return (
    <div className="space-y-6">
      <MhdPageHeader
        backTo={`/accommodations/${caseId}`}
        backLabel="Accommodation Case"
        title="Accommodation Case Correspondence"
        description="Email correspondence attached to this accommodation case."
      />

      <MhdAccommodationCaseRecordTabs caseId={caseId} active="correspondence" />

      {detail.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading case...</p>
      ) : !record ? (
        <p className="text-sm text-muted-foreground">Case not found.</p>
      ) : (
        <MhdCorrespondencePanel
          companyId={record.case.company_id}
          entityType="ACCOMMODATION_CASE"
          entityId={record.case.id}
        />
      )}
    </div>
  );
}
