import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdApplicationRecordTabs } from '@/appshell/components/MhdApplicationRecordTabs';
import { MhdInterviewList } from '../../interviews/components/MhdInterviewList';
import { MhdInterviewSchedulePanel } from '../../interviews/components/MhdInterviewSchedulePanel';
import { useMhdRecruitingApplication } from '../Hook';
import { MhdApplicationStatusBadge } from './MhdApplicationStatusBadge';

interface Props {
  companyId: string;
  applicationId: string;
  canManage: boolean;
  onOpenWorksheet?: (interviewId: string) => void;
}

/**
 * `/recruiting/applications/:appId/interviews` — the Interviews tab (package
 * 2): the application's scheduled interviews plus the schedule form
 * (privileged only). Split out of the combined application detail route so
 * each recruiting package gets its own routed tab — see
 * `MhdApplicationRecordTabs`.
 */
export function MhdApplicationInterviewsPage({
  companyId,
  applicationId,
  canManage,
  onOpenWorksheet,
}: Props) {
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

      <MhdApplicationRecordTabs appId={applicationId} active="interviews" showOfferTab={canManage} />

      <MhdInterviewList applicationId={applicationId} onOpenWorksheet={onOpenWorksheet} />

      {canManage ? (
        <MhdInterviewSchedulePanel companyId={companyId} applicationId={applicationId} />
      ) : null}
    </div>
  );
}
