import type { Location } from 'react-router-dom';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { MhdProtectedRoute } from '@/features/authentication/components/MhdProtectedRoute';
import { MhdRoleGuardedRoute } from '@/appshell/MhdRoleGuardedRoute';
import { MhdAppShell } from '@/appshell/MhdAppShell';
import { PublicLayout } from '@/layouts/PublicLayout';

// Auth pages (scaffold's existing authentication feature — canonical)
import { MhdLoginPage } from '@/features/authentication/components/MhdLoginPage';
import { MhdForgotPasswordPage } from '@/features/authentication/components/MhdForgotPasswordPage';
import { MhdResetPasswordPage } from '@/features/authentication/components/MhdResetPasswordPage';
import { MhdAuthCallbackPage } from '@/features/authentication/components/MhdAuthCallbackPage';

// App pages
import { MhdDashboardPage } from '@/features/dashboard/components/MhdDashboardPage';
import { MhdTasksPage } from '@/features/tasks/components/MhdTasksPage';
import { MhdTaskFormPage } from '@/features/tasks/components/MhdTaskFormPage';
import { MhdTaskDetailPage } from '@/appshell/components/MhdTaskDetailPage';
import { MhdTaskNotesPage } from '@/features/notes/components/MhdTaskNotesPage';
import { MhdActivitiesPage } from '@/features/activities/components/MhdActivitiesPage';
import { MhdActivityDetailPage } from '@/features/activities/components/MhdActivityDetailPage';
import { MhdTaskActivitiesPage } from '@/features/activities/components/MhdTaskActivitiesPage';
import { MhdTaskAttachmentsPage } from '@/features/attachments/components/MhdTaskAttachmentsPage';
import { MhdTaskReportsPage } from '@/features/documents/components/MhdTaskReportsPage';
import { MhdTaskAuditPage } from '@/features/audit/components/MhdTaskAuditPage';
import { MhdAuditReportsPage } from '@/features/audit/components/MhdAuditReportsPage';
import { MhdDocumentsPage } from '@/features/documents/components/MhdDocumentsPage';
import { MhdFormsPage } from '@/features/forms/components/MhdFormsPage';
import { MhdFormDetailPage } from '@/features/forms/components/MhdFormDetailPage';
import { MhdFormBuilderPage } from '@/features/forms/components/MhdFormBuilderPage';
import { MhdFormRendererPage } from '@/features/forms/components/MhdFormRendererPage';
import { MhdFormModalRoute } from '@/features/forms/components/MhdFormModalRoute';
import { MhdFormSubmissionsPage } from '@/features/forms/components/MhdFormSubmissionsPage';
import { MhdPropertyPage } from '@/features/property/components/MhdPropertyPage';
import { MhdPropertyDetailPage } from '@/features/property/components/MhdPropertyDetailPage';
import { MhdEsignaturePage } from '@/features/esignature/components/MhdEsignaturePage';
import { MhdEsignatureDetailPage } from '@/features/esignature/components/MhdEsignatureDetailPage';
import { MhdPublicSigningPage } from '@/features/esignature/components/MhdPublicSigningPage';
import { MhdCertificateVerificationPage } from '@/features/esignature/components/MhdCertificateVerificationPage';
import { MhdCommunicationsPage } from '@/features/communications/components/MhdCommunicationsPage';
import { MhdMessagingPage } from '@/features/messaging/components/MhdMessagingPage';
import { MhdSystemAlertsPage } from '@/features/communications/components/MhdSystemAlertsPage';
import { MhdAutomationsPage } from '@/features/automations/components/MhdAutomationsPage';
import { MhdAutomationRuleDetailPage } from '@/features/automations/components/MhdAutomationRuleDetailPage';
import { MhdAutomationRunDetailPage } from '@/features/automations/components/MhdAutomationRunDetailPage';
import { MhdEmployeeFilesPage } from '@/features/employee-files/components/MhdEmployeeFilesPage';
import { MhdEmployeeFileCabinetPage } from '@/features/employee-files/components/MhdEmployeeFileCabinetPage';
import { MhdEmployeeFileNewRecordPage } from '@/features/employee-files/components/MhdEmployeeFileNewRecordPage';
import { MhdPeoplePage } from '@/features/people/components/MhdPeoplePage';
import { MhdPersonFormPage } from '@/features/people/components/MhdPersonFormPage';
import { MhdPersonDetailPage } from '@/appshell/components/MhdPersonDetailPage';
import { MhdCompaniesPage } from '@/features/companies/components/MhdCompaniesPage';
import { MhdCompanyFormPage } from '@/features/companies/components/MhdCompanyFormPage';
import { MhdCompanyDetailPage } from '@/appshell/components/MhdCompanyDetailPage';
import { MhdApprovalsPage } from '@/features/approvals/components/MhdApprovalsPage';
import { MhdPerformancePage } from '@/features/performance/Components/MhdPerformancePage';
import { MhdReviewDetailPage } from '@/features/performance/Components/MhdReviewDetailPage';
import { MhdCoachingPlanDetailPage } from '@/features/performance/Components/MhdCoachingPlanDetailPage';
import { MhdFeedbackInvitationsPage } from '@/features/performance/Components/MhdFeedbackInvitationsPage';
import { MhdReviewTemplatesPage } from '@/features/performance/Components/MhdReviewTemplatesPage';
import { MhdFeedbackSettingsPage } from '@/features/performance/Components/MhdFeedbackSettingsPage';
import { MhdOnboardingIndexPage } from '@/features/onboarding/components/MhdOnboardingIndexPage';
import { MhdOnboardingPersonPage } from '@/features/onboarding/components/MhdOnboardingPersonPage';
import { MhdOffboardingPage } from '@/features/offboarding/components/MhdOffboardingPage';
import { MhdOffboardingCaseDetailPage } from '@/features/offboarding/components/MhdOffboardingCaseDetailPage';
import { MhdConductPage } from '@/features/conduct/components/MhdConductPage';
import { MhdConductCaseDetailPage } from '@/features/conduct/components/MhdConductCaseDetailPage';
import { MhdSchedulePage } from '@/features/timeattendance/components/MhdSchedulePage';
import { MhdAttendancePage } from '@/features/timeattendance/components/MhdAttendancePage';
import { MhdAttendancePolicyPage } from '@/features/timeattendance/components/MhdAttendancePolicyPage';
import { MhdJobsPage } from '@/features/jobs/components/MhdJobsPage';
import { MhdCompetencyLibraryPage } from '@/features/jobs/components/MhdCompetencyLibraryPage';
import { MhdJobDetailPage } from '@/features/jobs/components/MhdJobDetailPage';
import { MhdMyJobPage } from '@/features/jobs/components/MhdMyJobPage';
import { MhdMileagePage } from '@/features/mileage/components/MhdMileagePage';
import { MhdMileageClaimDetailPage } from '@/features/mileage/components/MhdMileageClaimDetailPage';
import { MhdLeavesPage } from '@/features/leaves/components/MhdLeavesPage';
import { MhdLeaveCaseDetailPage } from '@/features/leaves/components/MhdLeaveCaseDetailPage';
import { MhdAccommodationsPage } from '@/features/accommodations/components/MhdAccommodationsPage';
import { MhdAccommodationCaseDetailPage } from '@/features/accommodations/components/MhdAccommodationCaseDetailPage';
import { MhdInvestigationsPage } from '@/features/investigations/components/MhdInvestigationsPage';
import { MhdInvestigationCaseDetailPage } from '@/features/investigations/components/MhdInvestigationCaseDetailPage';
import { MhdTrainingPage } from '@/features/training/components/MhdTrainingPage';
import { MhdMyTrainingRoutePage } from '@/features/training/components/MhdMyTrainingRoutePage';
import { MhdHandbooksPage } from '@/features/handbook/components/MhdHandbooksPage';
import { MhdHandbookDetailPage } from '@/features/handbook/components/MhdHandbookDetailPage';
import { MhdMyHandbooksRoutePage } from '@/features/handbook/components/MhdMyHandbooksRoutePage';
import { MhdApprovalDetailPage } from '@/features/approvals/components/MhdApprovalDetailPage';
import { MhdRecruitingRoutePage } from '@/features/recruiting/components/MhdRecruitingRoutePage';
import { MhdRequisitionDetailRoutePage } from '@/features/recruiting/components/MhdRequisitionDetailRoutePage';
import { MhdRequisitionPipelineRoutePage } from '@/features/recruiting/components/MhdRequisitionPipelineRoutePage';
import { MhdRequisitionInterviewGuideRoutePage } from '@/features/recruiting/components/MhdRequisitionInterviewGuideRoutePage';
import { MhdApplicationDetailRoutePage } from '@/features/recruiting/components/MhdApplicationDetailRoutePage';
import { MhdApplicationInterviewsRoutePage } from '@/features/recruiting/components/MhdApplicationInterviewsRoutePage';
import { MhdApplicationEvaluationRoutePage } from '@/features/recruiting/components/MhdApplicationEvaluationRoutePage';
import { MhdApplicationOfferRoutePage } from '@/features/recruiting/components/MhdApplicationOfferRoutePage';
import { MhdInterviewWorksheetRoutePage } from '@/features/recruiting/components/MhdInterviewWorksheetRoutePage';
import { MhdQuestionBankRoutePage } from '@/features/recruiting/components/MhdQuestionBankRoutePage';
import { MhdEeoReportRoutePage } from '@/features/recruiting/components/MhdEeoReportRoutePage';
import { MhdApplyPage } from '@/features/recruiting/requisitions/components/MhdApplyPage';
import { MhdNotFoundPage } from '@/appshell/components/MhdNotFoundPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <MhdAppRoutes />
    </BrowserRouter>
  );
}

/**
 * React Router "background location" modal pattern (the same one used by
 * React Router's own gallery-photo-modal examples). `/forms/:formId/render`
 * keeps its route/URL exactly as-is — deep-linkable, shareable, refreshable —
 * but when reached via an in-app Link/navigate carrying
 * `state.backgroundLocation`, it renders as a modal OVER the background
 * page's route instead of replacing it:
 *
 *  - The main `<Routes>` below renders at `backgroundLocation` when present,
 *    so the page the user was "really" on keeps rendering underneath.
 *  - A second `<Routes>` renders ONLY when a backgroundLocation is present,
 *    at the real current location, containing just the modal-eligible route.
 *    This renders the modal ADDITIONALLY, without unmounting the page below.
 *  - A direct load / refresh / shared link has no `backgroundLocation` in
 *    history state, so `/forms/:formId/render` falls through to the main
 *    `<Routes>` tree and renders as an ordinary full page.
 */
function MhdAppRoutes() {
  const location = useLocation();
  const backgroundLocation = (location.state as { backgroundLocation?: Location } | null)
    ?.backgroundLocation;

  return (
    <>
      <Routes location={backgroundLocation || location}>
        {/* Public auth routes */}
        <Route path="/login" element={<MhdLoginPage />} />
        <Route path="/forgot-password" element={<MhdForgotPasswordPage />} />
        <Route path="/reset-password" element={<MhdResetPasswordPage />} />
        <Route path="/auth/callback" element={<MhdAuthCallbackPage />} />
        <Route element={<PublicLayout />}>
          <Route path="/sign/:token" element={<MhdPublicSigningPage />} />
          <Route path="/verify/:code" element={<MhdCertificateVerificationPage />} />
          {/* The public, UNAUTHENTICATED applicant apply page. It sits OUTSIDE the
              MhdProtectedRoute guard entirely — no session, no role guard — and
              reads its single-use invite token from the ?token= query string,
              mirroring the /sign/:token e-signature route. The token is the sole
              credential; both RPCs it calls are security-definer and token-gated.
              The voluntary EEO self-identification it collects is write-only. */}
          <Route path="/apply" element={<MhdApplyPage />} />
        </Route>

        {/* Protected app routes */}
        <Route element={<MhdProtectedRoute />}>
          <Route element={<MhdAppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            {/* Role enforcement lives once in mhdRouteAccess.ts and is applied
                here at the router level — MhdSidebar hiding a link is not
                access control, this guard is. */}
            <Route element={<MhdRoleGuardedRoute />}>
              <Route path="/dashboard" element={<MhdDashboardPage />} />
              <Route path="/tasks" element={<MhdTasksPage />} />
              <Route path="/tasks/new" element={<MhdTaskFormPage />} />
              <Route path="/tasks/:taskId/edit" element={<MhdTaskFormPage />} />
              <Route path="/tasks/:taskId" element={<MhdTaskDetailPage />} />
              {/* Inherit the /tasks 'ALL' rule via mhdCanAccessRoute's prefix match. */}
              <Route path="/tasks/:taskId/notes" element={<MhdTaskNotesPage />} />
              <Route path="/tasks/:taskId/activities" element={<MhdTaskActivitiesPage />} />
              <Route path="/tasks/:taskId/attachments" element={<MhdTaskAttachmentsPage />} />
              <Route path="/tasks/:taskId/reports" element={<MhdTaskReportsPage />} />
              {/* Platform Admin / HR Partner only — see the dedicated
                  '/tasks/:taskId/audit' segment-pattern rule in
                  mhdRouteAccess.ts, which precedes the general '/tasks'
                  'ALL' rule above via array order. */}
              <Route path="/tasks/:taskId/audit" element={<MhdTaskAuditPage />} />
              <Route path="/activities" element={<MhdActivitiesPage />} />
              <Route path="/activities/:activityId" element={<MhdActivityDetailPage />} />
              <Route path="/reports" element={<MhdDocumentsPage />} />
              <Route path="/forms" element={<MhdFormsPage />} />
              <Route path="/forms/new" element={<MhdFormBuilderPage />} />
              <Route path="/forms/:formId/render" element={<MhdFormRendererPage />} />
              <Route path="/forms/:formId/submissions" element={<MhdFormSubmissionsPage />} />
              <Route path="/forms/:formId/edit" element={<MhdFormBuilderPage />} />
              <Route path="/forms/:formId" element={<MhdFormDetailPage />} />
              <Route path="/property" element={<MhdPropertyPage />} />
              <Route path="/property/:itemId" element={<MhdPropertyDetailPage />} />
              <Route path="/esignature" element={<MhdEsignaturePage />} />
              <Route path="/esignature/:requestId" element={<MhdEsignatureDetailPage />} />
              <Route path="/communications" element={<MhdCommunicationsPage />} />
              <Route path="/communications/messaging" element={<MhdMessagingPage />} />
              <Route path="/communications/system-alerts" element={<MhdSystemAlertsPage />} />
              <Route path="/automations" element={<MhdAutomationsPage />} />
              {/* Both inherit the /automations rule via mhdCanAccessRoute's
                  prefix match. Arming inside the rule page is gated separately
                  on mhdCanArmAutomations (Platform Admin only). */}
              <Route path="/automations/rules/:ruleId" element={<MhdAutomationRuleDetailPage />} />
              <Route path="/automations/runs/:runId" element={<MhdAutomationRunDetailPage />} />
              <Route path="/employees" element={<MhdEmployeeFilesPage />} />
              <Route
                path="/employees/:personId/files/new"
                element={<MhdEmployeeFileNewRecordPage />}
              />
              <Route path="/employees/:personId" element={<MhdEmployeeFileCabinetPage />} />
              <Route path="/people" element={<MhdPeoplePage />} />
              <Route path="/people/new" element={<MhdPersonFormPage />} />
              <Route path="/people/:personId/edit" element={<MhdPersonFormPage />} />
              <Route path="/people/:personId" element={<MhdPersonDetailPage />} />
              <Route path="/companies" element={<MhdCompaniesPage />} />
              <Route path="/companies/new" element={<MhdCompanyFormPage />} />
              <Route path="/companies/:companyId/edit" element={<MhdCompanyFormPage />} />
              <Route path="/companies/:companyId" element={<MhdCompanyDetailPage />} />
              <Route path="/approvals" element={<MhdApprovalsPage />} />
              <Route path="/approvals/:approvalId" element={<MhdApprovalDetailPage />} />
              {/* Timeline is the second record tab (MhdApprovalRecordTabs) —
                  the comment conversation, split out of the single-page
                  detail view. It inherits the /approvals access rule via the
                  guard's prefix match. */}
              <Route
                path="/approvals/:approvalId/timeline"
                element={<MhdApprovalDetailPage tab="timeline" />}
              />
              <Route path="/performance" element={<MhdPerformancePage />} />
              {/* v2 (PRF2) surfaces. /performance/invitations is the rater-facing
                  route — it never loads the review, only the caller's own
                  invitations. /templates and /settings are privileged config;
                  their narrower access rules precede /performance in
                  mhdRouteAccess. Static paths, so the router matches them ahead of
                  /performance/reviews/:reviewId regardless of declaration order. */}
              <Route path="/performance/invitations" element={<MhdFeedbackInvitationsPage />} />
              <Route path="/performance/templates" element={<MhdReviewTemplatesPage />} />
              <Route path="/performance/settings" element={<MhdFeedbackSettingsPage />} />
              <Route path="/performance/reviews/:reviewId" element={<MhdReviewDetailPage />} />
              <Route path="/performance/coaching/:planId" element={<MhdCoachingPlanDetailPage />} />
              {/* Onboarding. /onboarding/:personId inherits the /onboarding
                  rule via the guard's prefix match. The same checklist card is
                  still embedded in /people/:personId; these routes give the
                  module its own reachable surface. */}
              <Route path="/onboarding" element={<MhdOnboardingIndexPage />} />
              <Route path="/onboarding/:personId" element={<MhdOnboardingPersonPage />} />
              <Route path="/offboarding" element={<MhdOffboardingPage />} />
              <Route path="/offboarding/:caseId" element={<MhdOffboardingCaseDetailPage />} />
              {/* Conduct. Admin-only (see mhdRouteAccess); /conduct/:caseId
                  inherits the /conduct rule via the guard's prefix match. There
                  is no subject-facing Conduct route — the subject reaches their
                  issued document only through the /sign/:token signing link. */}
              <Route path="/conduct" element={<MhdConductPage />} />
              <Route path="/conduct/:caseId" element={<MhdConductCaseDetailPage />} />
              <Route path="/schedule" element={<MhdSchedulePage />} />
              {/* /attendance/policy is privileged-only; its rule precedes
                  /attendance in mhdRouteAccess so the guard does not let it
                  inherit the broader /attendance rule. */}
              <Route path="/attendance/policy" element={<MhdAttendancePolicyPage />} />
              <Route path="/attendance" element={<MhdAttendancePage />} />
              {/* Job Descriptions. /jobs/competencies is a static child and is
                  ranked ahead of /jobs/:jobId by the router, so "competencies" is
                  never captured as a jobId. /my-job is a SEPARATE employee route,
                  never a filtered /jobs — see mhdRouteAccess. */}
              <Route path="/jobs" element={<MhdJobsPage />} />
              <Route path="/jobs/competencies" element={<MhdCompetencyLibraryPage />} />
              <Route path="/jobs/:jobId" element={<MhdJobDetailPage />} />
              <Route path="/my-job" element={<MhdMyJobPage />} />
              {/* Mileage & Reimbursement. /mileage is the tabbed Trips/Claims/
                  IRS rates/Company rate list surface; the page reads
                  useMhdAuth and renders the privileged company view or the
                  employee's own trips/claims. Viewer is excluded via
                  mhdRouteAccess. /mileage/claims/:claimId is a single claim's
                  own detail page (lines, totals, and workflow actions) and
                  inherits the /mileage access rule via the guard's prefix
                  match. */}
              <Route path="/mileage" element={<MhdMileagePage />} />
              <Route path="/mileage/claims/:claimId" element={<MhdMileageClaimDetailPage />} />
              {/* Leaves of Absence. /leaves/:caseId inherits the /leaves rule via
                  the guard's prefix match. Both pages read useMhdAuth themselves:
                  privileged roles administer the company board, a Client User sees
                  their OWN cases, Viewer is excluded via mhdRouteAccess. The
                  medical-certification note is masked server-side to all but
                  Platform Admin / HR Partner. */}
              <Route path="/leaves" element={<MhdLeavesPage />} />
              <Route path="/leaves/:caseId" element={<MhdLeaveCaseDetailPage />} />
              <Route path="/accommodations" element={<MhdAccommodationsPage />} />
              <Route path="/accommodations/:caseId" element={<MhdAccommodationCaseDetailPage />} />
              {/* Investigations — the strictest access model. The route admits
                  Platform Admin / HR Partner / Client Admin (see mhdRouteAccess);
                  /investigations/:caseId inherits that rule via the guard's
                  prefix match. Route access only lets these roles NAVIGATE — case
                  visibility is grant-based server-side, so an ungranted admin sees
                  an empty board and cannot open any case. Client User and Viewer
                  are excluded; there is deliberately NO subject-facing route. Both
                  pages read useMhdAuth/useParams themselves. */}
              <Route path="/investigations" element={<MhdInvestigationsPage />} />
              <Route path="/investigations/:caseId" element={<MhdInvestigationCaseDetailPage />} />
              {/* Audit Reports — company-wide counterpart to
                  /tasks/:taskId/audit. Platform Admin / HR Partner only, same
                  gate as the per-task timeline (see mhdRouteAccess.ts and
                  mhd_list_audit_events's server-side 42501 check). No
                  subject-facing route, same as Investigations/Conduct. */}
              <Route path="/audit-reports" element={<MhdAuditReportsPage />} />
              {/* Training & Development. Two SEPARATE routes, never one filtered
                  surface: /training is the admin catalog + compliance board
                  (Platform Admin / HR Partner / Client Admin), /my-training is the
                  employee's own assignments and completions (Client User only).
                  Viewer is excluded from both (see mhdRouteAccess). Both pages read
                  useMhdAuth themselves. The status badge renders the server-derived
                  compliance_status; nothing recomputes expiry client-side. Global
                  courses are read-only to every tenant admin. */}
              <Route path="/training" element={<MhdTrainingPage />} />
              <Route path="/my-training" element={<MhdMyTrainingRoutePage />} />
              {/* Handbook Engine. Two SEPARATE routes, never one filtered surface:
                  /handbooks is the admin wizard + acknowledgment board (Platform
                  Admin / HR Partner / Client Admin), /handbooks/:handbookId is the
                  per-handbook wizard and inherits that rule via the guard's prefix
                  match. /my-handbooks is the employee's own acknowledgment surface
                  (Client User only). Viewer is excluded from all three (see
                  mhdRouteAccess). Every clause body rendered here carries a visible
                  attorney-content-pending banner — this is a SHELL wave, content is
                  attorney-flagged placeholder. All pages read useMhdAuth themselves. */}
              <Route path="/handbooks" element={<MhdHandbooksPage />} />
              <Route path="/handbooks/:handbookId" element={<MhdHandbookDetailPage />} />
              {/* Acknowledgments is the second record tab
                  (MhdHandbookRecordTabs) — the ack board split out of the
                  single-page wizard view. It inherits the /handbooks access
                  rule via the guard's prefix match. */}
              <Route
                path="/handbooks/:handbookId/acknowledgments"
                element={<MhdHandbookDetailPage tab="acknowledgments" />}
              />
              <Route path="/my-handbooks" element={<MhdMyHandbooksRoutePage />} />
              {/* Recruiting / ATS. Static child routes (/recruiting/eeo,
                  /recruiting/questions, /recruiting/interviews/:id) are ranked
                  ahead of the parameterised ones by the router. Access is enforced
                  in mhdRouteAccess: /recruiting/eeo is Platform-Admin only,
                  /recruiting/interviews/:id admits any authenticated non-Viewer
                  (server RLS scopes the worksheet), and /recruiting + the
                  requisition/application detail routes are Platform Admin / HR
                  Partner / Client Admin. The public /apply page is a SEPARATE
                  route in the public block above, outside this guard entirely. All
                  route-entry pages read useMhdAuth themselves. NO EEO renders on
                  any recruiter/HM/interviewer surface.

                  Each of the requisition and application record pages is now
                  split into its own routed tabs (MhdRequisitionRecordTabs /
                  MhdApplicationRecordTabs), mirroring MhdTaskRecordTabs:
                  requisition Detail/Pipeline/Interview Guide and application
                  Detail/Interviews/Evaluation/Offer. Every sub-route inherits
                  the parent's access rule via the guard's prefix match. */}
              <Route path="/recruiting" element={<MhdRecruitingRoutePage />} />
              <Route path="/recruiting/eeo" element={<MhdEeoReportRoutePage />} />
              <Route path="/recruiting/questions" element={<MhdQuestionBankRoutePage />} />
              <Route
                path="/recruiting/interviews/:interviewId"
                element={<MhdInterviewWorksheetRoutePage />}
              />
              <Route
                path="/recruiting/requisitions/:reqId"
                element={<MhdRequisitionDetailRoutePage />}
              />
              <Route
                path="/recruiting/requisitions/:reqId/pipeline"
                element={<MhdRequisitionPipelineRoutePage />}
              />
              <Route
                path="/recruiting/requisitions/:reqId/interview-guide"
                element={<MhdRequisitionInterviewGuideRoutePage />}
              />
              <Route
                path="/recruiting/applications/:appId"
                element={<MhdApplicationDetailRoutePage />}
              />
              <Route
                path="/recruiting/applications/:appId/interviews"
                element={<MhdApplicationInterviewsRoutePage />}
              />
              <Route
                path="/recruiting/applications/:appId/evaluation"
                element={<MhdApplicationEvaluationRoutePage />}
              />
              <Route
                path="/recruiting/applications/:appId/offer"
                element={<MhdApplicationOfferRoutePage />}
              />
            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="/404" element={<MhdNotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>

      {backgroundLocation ? (
        <Routes>
          {/* Same guard nesting as the canonical route above (MhdProtectedRoute
              then MhdRoleGuardedRoute) — this second <Routes> tree is a
              separate route match, so the auth/role check has to be applied
              here explicitly rather than inherited. Deliberately excludes
              MhdAppShell: the background page (rendered by the <Routes>
              above, already inside its own MhdAppShell) supplies the
              sidebar/top bar chrome, and the modal is only ever an overlay
              on top of it. */}
          <Route element={<MhdProtectedRoute />}>
            <Route element={<MhdRoleGuardedRoute />}>
              <Route path="/forms/:formId/render" element={<MhdFormModalRoute />} />
            </Route>
          </Route>
        </Routes>
      ) : null}
    </>
  );
}
