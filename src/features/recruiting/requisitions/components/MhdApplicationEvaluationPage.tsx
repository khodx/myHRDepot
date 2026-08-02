import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdApplicationRecordTabs } from '@/appshell/components/MhdApplicationRecordTabs';
import { MhdCandidateEvaluationPanel } from '../../interviews/components/MhdCandidateEvaluationPanel';
import { useMhdRecruitingApplication } from '../Hook';
import { MhdApplicationStatusBadge } from './MhdApplicationStatusBadge';

interface Props {
  applicationId: string;
  canManage: boolean;
}

/**
 * `/recruiting/applications/:appId/evaluation` — the Evaluation tab (package
 * 2): the competency-weighted rollup and the finalize-recommendation form
 * (finalize is privileged only; the panel itself governs that). Split out of
 * the combined application detail route — see `MhdApplicationRecordTabs`.
 */
export function MhdApplicationEvaluationPage({ applicationId, canManage }: Props) {
  const application = useMhdRecruitingApplication(applicationId);
  const detail = application.data ?? null;

  if (application.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading application…</p>;
  }

  if (application.isError || !detail) {
    return (
      <div className="space-y-6">
        <MhdPageHeader
          backTo="/recruiting"
          backLabel="Requisitions"
          title="Application"
          description="This application could not be found, or you do not have access to it."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        backTo={`/recruiting/applications/${applicationId}`}
        backLabel="Detail"
        title={detail.personDisplayName}
        chips={<MhdApplicationStatusBadge lifecycle={detail.lifecycle} />}
        description={
          <>
            <span className="font-mono">{detail.referenceId}</span> · Requisition:{' '}
            {detail.requisitionTitle}
          </>
        }
      />

      <MhdApplicationRecordTabs appId={applicationId} active="evaluation" showOfferTab={canManage} />

      <MhdCandidateEvaluationPanel applicationId={applicationId} canFinalize={canManage} />
    </div>
  );
}
