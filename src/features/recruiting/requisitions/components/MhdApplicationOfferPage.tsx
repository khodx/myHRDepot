import { useQueryClient } from '@tanstack/react-query';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdApplicationRecordTabs } from '@/appshell/components/MhdApplicationRecordTabs';
import { MhdOfferPanel } from '../../offers/components/MhdOfferPanel';
import { MhdHirePreviewPanel } from '../../offers/components/MhdHirePreviewPanel';
import { useMhdRecruitingApplication } from '../Hook';
import { MhdApplicationStatusBadge } from './MhdApplicationStatusBadge';

interface PersonOption {
  id: string;
  displayName: string;
}

interface Props {
  applicationId: string;
  reportingManagers: PersonOption[];
}

/**
 * `/recruiting/applications/:appId/offer` — the Offer tab (package 3): extend
 * / manage the offer, the hire handoff, and the onboarding-feed preview.
 * Privileged only — the route hides this tab entirely for a non-privileged
 * viewer (see `MhdApplicationRecordTabs`'s `showOfferTab`), and the RPCs
 * re-check regardless.
 *
 * The offer/interview ceremonies (offer-letter doc-gen, acceptance
 * e-signature) are app-layer injected callbacks. We supply only
 * `buildSignatureUrl` (mirroring the e-sign /sign route) and leave the
 * doc-gen / signature-request callbacks unset — no Doc-Gen/E-Sign RPC is
 * invented here.
 */
export function MhdApplicationOfferPage({ applicationId, reportingManagers }: Props) {
  const application = useMhdRecruitingApplication(applicationId);
  const detail = application.data ?? null;
  const queryClient = useQueryClient();

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

      <MhdApplicationRecordTabs appId={applicationId} active="offer" showOfferTab />

      <MhdOfferPanel
        applicationId={applicationId}
        reportingManagers={reportingManagers}
        buildSignatureUrl={(esignatureRequestId) => `/sign/${esignatureRequestId}`}
        onHired={() => {
          // The handoff created a job_assignment and marked the application
          // HIRED — cross-invalidate package 1's application + requisition
          // queries (this package's hook does not import package 1's service).
          void queryClient.invalidateQueries({ queryKey: ['mhd-recruiting', 'application'] });
          void queryClient.invalidateQueries({ queryKey: ['mhd-recruiting', 'applications'] });
          void queryClient.invalidateQueries({ queryKey: ['mhd-recruiting', 'requisitions'] });
        }}
      />

      <MhdHirePreviewPanel applicationId={applicationId} />
    </div>
  );
}
