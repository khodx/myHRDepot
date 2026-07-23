import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { mhdRecruitingIsPrivileged } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdApplicationDetailPage } from '../requisitions/components/MhdApplicationDetailPage';
import { useMhdRecruitingPeople } from '../requisitions/Hook';
import { MhdInterviewList } from '../interviews/components/MhdInterviewList';
import { MhdInterviewSchedulePanel } from '../interviews/components/MhdInterviewSchedulePanel';
import { MhdCandidateEvaluationPanel } from '../interviews/components/MhdCandidateEvaluationPanel';
import { MhdOfferPanel } from '../offers/components/MhdOfferPanel';
import { MhdHirePreviewPanel } from '../offers/components/MhdHirePreviewPanel';

/**
 * `/recruiting/applications/:appId` — the single application, composed across all
 * three recruiting packages: the applicant record + stage controls (package 1),
 * the interviews / scorecards / competency-weighted evaluation (package 2), and
 * the offers + the hire handoff + the onboarding-feed preview (package 3).
 *
 * EEO NOTE: this is a recruiter/HM decision surface, so it renders NO EEO
 * self-identification — none of the composed panels reads that partition. The only
 * EEO read anywhere is the Platform-Admin aggregate at /recruiting/eeo.
 *
 * The offer/interview ceremonies (offer-letter doc-gen, acceptance e-signature)
 * are app-layer injected callbacks. We supply only `buildSignatureUrl` (mirroring
 * the e-sign /sign route) and leave the doc-gen / signature-request callbacks
 * unset — no Doc-Gen/E-Sign RPC is invented here.
 */
export function MhdApplicationDetailRoutePage() {
  const { appId } = useParams<{ appId: string }>();
  const { profile, roles } = useMhdAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const companyId = profile?.companyId ?? null;
  const canManage = mhdRecruitingIsPrivileged(roles);

  const people = useMhdRecruitingPeople(canManage ? companyId : null);
  const reportingManagers = useMemo(
    () =>
      (people.data ?? []).map((person) => ({
        id: person.id,
        displayName:
          person.preferredName || [person.firstName, person.lastName].filter(Boolean).join(' '),
      })),
    [people.data],
  );

  if (!companyId || !appId) {
    return (
      <div className="text-sm text-muted-foreground">
        This application could not be resolved for your account.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MhdApplicationDetailPage
        companyId={companyId}
        applicationId={appId}
        canManage={canManage}
        onBack={() => navigate(-1)}
      />

      <div className="space-y-6">
        <MhdInterviewList
          applicationId={appId}
          onOpenWorksheet={(interviewId) => navigate(`/recruiting/interviews/${interviewId}`)}
        />

        {canManage ? (
          <MhdInterviewSchedulePanel companyId={companyId} applicationId={appId} />
        ) : null}

        <MhdCandidateEvaluationPanel applicationId={appId} canFinalize={canManage} />

        {canManage ? (
          <MhdOfferPanel
            applicationId={appId}
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
        ) : null}

        {canManage ? <MhdHirePreviewPanel applicationId={appId} /> : null}
      </div>
    </div>
  );
}
