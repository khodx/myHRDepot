import { lazy, Suspense } from 'react';
import type { Location } from 'react-router-dom';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { MhdProtectedRoute } from '@/features/authentication/components/MhdProtectedRoute';
import { MhdRoleGuardedRoute } from '@/appshell/MhdRoleGuardedRoute';
import { MhdAppShell } from '@/appshell/MhdAppShell';
import { PublicLayout } from '@/layouts/PublicLayout';

// Auth pages (scaffold's existing authentication feature — canonical)
const MhdLoginPage = lazy(() =>
  import('@/features/authentication/components/MhdLoginPage').then((module) => ({
    default: module.MhdLoginPage,
  })),
);
const MhdForgotPasswordPage = lazy(() =>
  import('@/features/authentication/components/MhdForgotPasswordPage').then((module) => ({
    default: module.MhdForgotPasswordPage,
  })),
);
const MhdResetPasswordPage = lazy(() =>
  import('@/features/authentication/components/MhdResetPasswordPage').then((module) => ({
    default: module.MhdResetPasswordPage,
  })),
);
const MhdAuthCallbackPage = lazy(() =>
  import('@/features/authentication/components/MhdAuthCallbackPage').then((module) => ({
    default: module.MhdAuthCallbackPage,
  })),
);
const MhdCompleteProfilePage = lazy(() =>
  import('@/features/authentication/components/MhdCompleteProfilePage').then((module) => ({
    default: module.MhdCompleteProfilePage,
  })),
);
const MhdEnrollMfaPage = lazy(() =>
  import('@/features/authentication/components/MhdEnrollMfaPage').then((module) => ({
    default: module.MhdEnrollMfaPage,
  })),
);
const MhdMfaChallengePage = lazy(() =>
  import('@/features/authentication/components/MhdMfaChallengePage').then((module) => ({
    default: module.MhdMfaChallengePage,
  })),
);
const MhdAccountSecurityPage = lazy(() =>
  import('@/features/authentication/components/MhdAccountSecurityPage').then((module) => ({
    default: module.MhdAccountSecurityPage,
  })),
);

// App pages
const MhdDashboardPage = lazy(() =>
  import('@/features/dashboard/components/MhdDashboardPage').then((module) => ({
    default: module.MhdDashboardPage,
  })),
);
const MhdTasksPage = lazy(() =>
  import('@/features/tasks/components/MhdTasksPage').then((module) => ({ default: module.MhdTasksPage })),
);
const MhdTaskFormPage = lazy(() =>
  import('@/features/tasks/components/MhdTaskFormPage').then((module) => ({
    default: module.MhdTaskFormPage,
  })),
);
const MhdTaskDetailPage = lazy(() =>
  import('@/appshell/components/MhdTaskDetailPage').then((module) => ({
    default: module.MhdTaskDetailPage,
  })),
);
const MhdTaskNotesPage = lazy(() =>
  import('@/features/notes/components/MhdTaskNotesPage').then((module) => ({
    default: module.MhdTaskNotesPage,
  })),
);
const MhdActivitiesPage = lazy(() =>
  import('@/features/activities/components/MhdActivitiesPage').then((module) => ({
    default: module.MhdActivitiesPage,
  })),
);
const MhdActivityDetailPage = lazy(() =>
  import('@/features/activities/components/MhdActivityDetailPage').then((module) => ({
    default: module.MhdActivityDetailPage,
  })),
);
const MhdTaskActivitiesPage = lazy(() =>
  import('@/features/activities/components/MhdTaskActivitiesPage').then((module) => ({
    default: module.MhdTaskActivitiesPage,
  })),
);
const MhdTaskAttachmentsPage = lazy(() =>
  import('@/features/attachments/components/MhdTaskAttachmentsPage').then((module) => ({
    default: module.MhdTaskAttachmentsPage,
  })),
);
const MhdTaskReportsPage = lazy(() =>
  import('@/features/documents/components/MhdTaskReportsPage').then((module) => ({
    default: module.MhdTaskReportsPage,
  })),
);
const MhdTaskAuditPage = lazy(() =>
  import('@/features/audit/components/MhdTaskAuditPage').then((module) => ({
    default: module.MhdTaskAuditPage,
  })),
);
const MhdAuditReportsPage = lazy(() =>
  import('@/features/audit/components/MhdAuditReportsPage').then((module) => ({
    default: module.MhdAuditReportsPage,
  })),
);
const MhdDocumentsPage = lazy(() =>
  import('@/features/documents/components/MhdDocumentsPage').then((module) => ({
    default: module.MhdDocumentsPage,
  })),
);
const MhdFormsPage = lazy(() =>
  import('@/features/forms/components/MhdFormsPage').then((module) => ({ default: module.MhdFormsPage })),
);
const MhdFormDetailPage = lazy(() =>
  import('@/features/forms/components/MhdFormDetailPage').then((module) => ({
    default: module.MhdFormDetailPage,
  })),
);
const MhdFormBuilderPage = lazy(() =>
  import('@/features/forms/components/MhdFormBuilderPage').then((module) => ({
    default: module.MhdFormBuilderPage,
  })),
);
const MhdFormRendererPage = lazy(() =>
  import('@/features/forms/components/MhdFormRendererPage').then((module) => ({
    default: module.MhdFormRendererPage,
  })),
);
const MhdFormModalRoute = lazy(() =>
  import('@/features/forms/components/MhdFormModalRoute').then((module) => ({
    default: module.MhdFormModalRoute,
  })),
);
const MhdFormSubmissionsPage = lazy(() =>
  import('@/features/forms/components/MhdFormSubmissionsPage').then((module) => ({
    default: module.MhdFormSubmissionsPage,
  })),
);
const MhdPropertyPage = lazy(() =>
  import('@/features/property/components/MhdPropertyPage').then((module) => ({
    default: module.MhdPropertyPage,
  })),
);
const MhdPropertyDetailPage = lazy(() =>
  import('@/features/property/components/MhdPropertyDetailPage').then((module) => ({
    default: module.MhdPropertyDetailPage,
  })),
);
const MhdEsignaturePage = lazy(() =>
  import('@/features/esignature/components/MhdEsignaturePage').then((module) => ({
    default: module.MhdEsignaturePage,
  })),
);
const MhdEsignatureDetailPage = lazy(() =>
  import('@/features/esignature/components/MhdEsignatureDetailPage').then((module) => ({
    default: module.MhdEsignatureDetailPage,
  })),
);
const MhdPublicSigningPage = lazy(() =>
  import('@/features/esignature/components/MhdPublicSigningPage').then((module) => ({
    default: module.MhdPublicSigningPage,
  })),
);
const MhdCertificateVerificationPage = lazy(() =>
  import('@/features/esignature/components/MhdCertificateVerificationPage').then((module) => ({
    default: module.MhdCertificateVerificationPage,
  })),
);
const MhdCommunicationsPage = lazy(() =>
  import('@/features/communications/components/MhdCommunicationsPage').then((module) => ({
    default: module.MhdCommunicationsPage,
  })),
);
const MhdMessagingPage = lazy(() =>
  import('@/features/messaging/components/MhdMessagingPage').then((module) => ({
    default: module.MhdMessagingPage,
  })),
);
const MhdSystemAlertsPage = lazy(() =>
  import('@/features/communications/components/MhdSystemAlertsPage').then((module) => ({
    default: module.MhdSystemAlertsPage,
  })),
);
const MhdAutomationsPage = lazy(() =>
  import('@/features/automations/components/MhdAutomationsPage').then((module) => ({
    default: module.MhdAutomationsPage,
  })),
);
const MhdAutomationRuleDetailPage = lazy(() =>
  import('@/features/automations/components/MhdAutomationRuleDetailPage').then((module) => ({
    default: module.MhdAutomationRuleDetailPage,
  })),
);
const MhdAutomationRunDetailPage = lazy(() =>
  import('@/features/automations/components/MhdAutomationRunDetailPage').then((module) => ({
    default: module.MhdAutomationRunDetailPage,
  })),
);
const MhdAdminSettingsPage = lazy(() =>
  import('@/features/admin/components/MhdAdminSettingsPage').then((module) => ({
    default: module.MhdAdminSettingsPage,
  })),
);
const MhdLabPage = lazy(() =>
  import('@/features/lab/components/MhdLabPage').then((module) => ({
    default: module.MhdLabPage,
  })),
);
const MhdEmployeeFilesPage = lazy(() =>
  import('@/features/employee-files/components/MhdEmployeeFilesPage').then((module) => ({
    default: module.MhdEmployeeFilesPage,
  })),
);
const MhdEmployeeFileCabinetPage = lazy(() =>
  import('@/features/employee-files/components/MhdEmployeeFileCabinetPage').then((module) => ({
    default: module.MhdEmployeeFileCabinetPage,
  })),
);
const MhdEmployeeFileNewRecordPage = lazy(() =>
  import('@/features/employee-files/components/MhdEmployeeFileNewRecordPage').then((module) => ({
    default: module.MhdEmployeeFileNewRecordPage,
  })),
);
const MhdPeoplePage = lazy(() =>
  import('@/features/people/components/MhdPeoplePage').then((module) => ({ default: module.MhdPeoplePage })),
);
const MhdPersonFormPage = lazy(() =>
  import('@/features/people/components/MhdPersonFormPage').then((module) => ({
    default: module.MhdPersonFormPage,
  })),
);
const MhdPersonDetailPage = lazy(() =>
  import('@/appshell/components/MhdPersonDetailPage').then((module) => ({
    default: module.MhdPersonDetailPage,
  })),
);
const MhdUsersPage = lazy(() =>
  import('@/features/users/components/MhdUsersPage').then((module) => ({
    default: module.MhdUsersPage,
  })),
);
const MhdUserInvitePage = lazy(() =>
  import('@/features/users/components/MhdUserInvitePage').then((module) => ({
    default: module.MhdUserInvitePage,
  })),
);
const MhdUserDetailPage = lazy(() =>
  import('@/features/users/components/MhdUserDetailPage').then((module) => ({
    default: module.MhdUserDetailPage,
  })),
);
const MhdUserFormPage = lazy(() =>
  import('@/features/users/components/MhdUserFormPage').then((module) => ({
    default: module.MhdUserFormPage,
  })),
);
const MhdCompaniesPage = lazy(() =>
  import('@/features/companies/components/MhdCompaniesPage').then((module) => ({
    default: module.MhdCompaniesPage,
  })),
);
const MhdCompanyFormPage = lazy(() =>
  import('@/features/companies/components/MhdCompanyFormPage').then((module) => ({
    default: module.MhdCompanyFormPage,
  })),
);
const MhdCompanyDetailPage = lazy(() =>
  import('@/appshell/components/MhdCompanyDetailPage').then((module) => ({
    default: module.MhdCompanyDetailPage,
  })),
);
const MhdApprovalsPage = lazy(() =>
  import('@/features/approvals/components/MhdApprovalsPage').then((module) => ({
    default: module.MhdApprovalsPage,
  })),
);
const MhdApprovalDetailPage = lazy(() =>
  import('@/features/approvals/components/MhdApprovalDetailPage').then((module) => ({
    default: module.MhdApprovalDetailPage,
  })),
);
const MhdPerformancePage = lazy(() =>
  import('@/features/performance/Components/MhdPerformancePage').then((module) => ({
    default: module.MhdPerformancePage,
  })),
);
const MhdReviewDetailPage = lazy(() =>
  import('@/features/performance/Components/MhdReviewDetailPage').then((module) => ({
    default: module.MhdReviewDetailPage,
  })),
);
const MhdCoachingPlanDetailPage = lazy(() =>
  import('@/features/performance/Components/MhdCoachingPlanDetailPage').then((module) => ({
    default: module.MhdCoachingPlanDetailPage,
  })),
);
const MhdFeedbackInvitationsPage = lazy(() =>
  import('@/features/performance/Components/MhdFeedbackInvitationsPage').then((module) => ({
    default: module.MhdFeedbackInvitationsPage,
  })),
);
const MhdReviewTemplatesPage = lazy(() =>
  import('@/features/performance/Components/MhdReviewTemplatesPage').then((module) => ({
    default: module.MhdReviewTemplatesPage,
  })),
);
const MhdFeedbackSettingsPage = lazy(() =>
  import('@/features/performance/Components/MhdFeedbackSettingsPage').then((module) => ({
    default: module.MhdFeedbackSettingsPage,
  })),
);
const MhdOnboardingIndexPage = lazy(() =>
  import('@/features/onboarding/components/MhdOnboardingIndexPage').then((module) => ({
    default: module.MhdOnboardingIndexPage,
  })),
);
const MhdOnboardingPersonPage = lazy(() =>
  import('@/features/onboarding/components/MhdOnboardingPersonPage').then((module) => ({
    default: module.MhdOnboardingPersonPage,
  })),
);
const MhdOffboardingPage = lazy(() =>
  import('@/features/offboarding/components/MhdOffboardingPage').then((module) => ({
    default: module.MhdOffboardingPage,
  })),
);
const MhdOffboardingCaseDetailPage = lazy(() =>
  import('@/features/offboarding/components/MhdOffboardingCaseDetailPage').then((module) => ({
    default: module.MhdOffboardingCaseDetailPage,
  })),
);
const MhdConductPage = lazy(() =>
  import('@/features/conduct/components/MhdConductPage').then((module) => ({ default: module.MhdConductPage })),
);
const MhdConductCaseDetailPage = lazy(() =>
  import('@/features/conduct/components/MhdConductCaseDetailPage').then((module) => ({
    default: module.MhdConductCaseDetailPage,
  })),
);
const MhdSchedulePage = lazy(() =>
  import('@/features/timeattendance/components/MhdSchedulePage').then((module) => ({
    default: module.MhdSchedulePage,
  })),
);
const MhdAttendancePage = lazy(() =>
  import('@/features/timeattendance/components/MhdAttendancePage').then((module) => ({
    default: module.MhdAttendancePage,
  })),
);
const MhdAttendancePolicyPage = lazy(() =>
  import('@/features/timeattendance/components/MhdAttendancePolicyPage').then((module) => ({
    default: module.MhdAttendancePolicyPage,
  })),
);
const MhdJobsPage = lazy(() =>
  import('@/features/jobs/components/MhdJobsPage').then((module) => ({ default: module.MhdJobsPage })),
);
const MhdCompetencyLibraryPage = lazy(() =>
  import('@/features/jobs/components/MhdCompetencyLibraryPage').then((module) => ({
    default: module.MhdCompetencyLibraryPage,
  })),
);
const MhdJobDetailPage = lazy(() =>
  import('@/features/jobs/components/MhdJobDetailPage').then((module) => ({ default: module.MhdJobDetailPage })),
);
const MhdMyJobPage = lazy(() =>
  import('@/features/jobs/components/MhdMyJobPage').then((module) => ({ default: module.MhdMyJobPage })),
);
const MhdMileagePage = lazy(() =>
  import('@/features/mileage/components/MhdMileagePage').then((module) => ({ default: module.MhdMileagePage })),
);
const MhdMileageClaimDetailPage = lazy(() =>
  import('@/features/mileage/components/MhdMileageClaimDetailPage').then((module) => ({
    default: module.MhdMileageClaimDetailPage,
  })),
);
const MhdLeavesPage = lazy(() =>
  import('@/features/leaves/components/MhdLeavesPage').then((module) => ({ default: module.MhdLeavesPage })),
);
const MhdLeaveCaseDetailPage = lazy(() =>
  import('@/features/leaves/components/MhdLeaveCaseDetailPage').then((module) => ({
    default: module.MhdLeaveCaseDetailPage,
  })),
);
const MhdAccommodationsPage = lazy(() =>
  import('@/features/accommodations/components/MhdAccommodationsPage').then((module) => ({
    default: module.MhdAccommodationsPage,
  })),
);
const MhdAccommodationCaseDetailPage = lazy(() =>
  import('@/features/accommodations/components/MhdAccommodationCaseDetailPage').then((module) => ({
    default: module.MhdAccommodationCaseDetailPage,
  })),
);
const MhdInvestigationsPage = lazy(() =>
  import('@/features/investigations/components/MhdInvestigationsPage').then((module) => ({
    default: module.MhdInvestigationsPage,
  })),
);
const MhdInvestigationCaseDetailPage = lazy(() =>
  import('@/features/investigations/components/MhdInvestigationCaseDetailPage').then((module) => ({
    default: module.MhdInvestigationCaseDetailPage,
  })),
);
const MhdTrainingPage = lazy(() =>
  import('@/features/training/components/MhdTrainingPage').then((module) => ({ default: module.MhdTrainingPage })),
);
const MhdMyTrainingRoutePage = lazy(() =>
  import('@/features/training/components/MhdMyTrainingRoutePage').then((module) => ({
    default: module.MhdMyTrainingRoutePage,
  })),
);
const MhdHandbooksPage = lazy(() =>
  import('@/features/handbook/components/MhdHandbooksPage').then((module) => ({
    default: module.MhdHandbooksPage,
  })),
);
const MhdHandbookDetailPage = lazy(() =>
  import('@/features/handbook/components/MhdHandbookDetailPage').then((module) => ({
    default: module.MhdHandbookDetailPage,
  })),
);
const MhdMyHandbooksRoutePage = lazy(() =>
  import('@/features/handbook/components/MhdMyHandbooksRoutePage').then((module) => ({
    default: module.MhdMyHandbooksRoutePage,
  })),
);
const MhdRecruitingRoutePage = lazy(() =>
  import('@/features/recruiting/components/MhdRecruitingRoutePage').then((module) => ({
    default: module.MhdRecruitingRoutePage,
  })),
);
const MhdRequisitionDetailRoutePage = lazy(() =>
  import('@/features/recruiting/components/MhdRequisitionDetailRoutePage').then((module) => ({
    default: module.MhdRequisitionDetailRoutePage,
  })),
);
const MhdRequisitionPipelineRoutePage = lazy(() =>
  import('@/features/recruiting/components/MhdRequisitionPipelineRoutePage').then((module) => ({
    default: module.MhdRequisitionPipelineRoutePage,
  })),
);
const MhdRequisitionInterviewGuideRoutePage = lazy(() =>
  import('@/features/recruiting/components/MhdRequisitionInterviewGuideRoutePage').then((module) => ({
    default: module.MhdRequisitionInterviewGuideRoutePage,
  })),
);
const MhdApplicationDetailRoutePage = lazy(() =>
  import('@/features/recruiting/components/MhdApplicationDetailRoutePage').then((module) => ({
    default: module.MhdApplicationDetailRoutePage,
  })),
);
const MhdApplicationInterviewsRoutePage = lazy(() =>
  import('@/features/recruiting/components/MhdApplicationInterviewsRoutePage').then((module) => ({
    default: module.MhdApplicationInterviewsRoutePage,
  })),
);
const MhdApplicationEvaluationRoutePage = lazy(() =>
  import('@/features/recruiting/components/MhdApplicationEvaluationRoutePage').then((module) => ({
    default: module.MhdApplicationEvaluationRoutePage,
  })),
);
const MhdApplicationOfferRoutePage = lazy(() =>
  import('@/features/recruiting/components/MhdApplicationOfferRoutePage').then((module) => ({
    default: module.MhdApplicationOfferRoutePage,
  })),
);
const MhdInterviewWorksheetRoutePage = lazy(() =>
  import('@/features/recruiting/components/MhdInterviewWorksheetRoutePage').then((module) => ({
    default: module.MhdInterviewWorksheetRoutePage,
  })),
);
const MhdQuestionBankRoutePage = lazy(() =>
  import('@/features/recruiting/components/MhdQuestionBankRoutePage').then((module) => ({
    default: module.MhdQuestionBankRoutePage,
  })),
);
const MhdEeoReportRoutePage = lazy(() =>
  import('@/features/recruiting/components/MhdEeoReportRoutePage').then((module) => ({
    default: module.MhdEeoReportRoutePage,
  })),
);
const MhdApplyPage = lazy(() =>
  import('@/features/recruiting/requisitions/components/MhdApplyPage').then((module) => ({
    default: module.MhdApplyPage,
  })),
);
const MhdNotFoundPage = lazy(() =>
  import('@/appshell/components/MhdNotFoundPage').then((module) => ({
    default: module.MhdNotFoundPage,
  })),
);

export function AppRouter() {
  return (
    <BrowserRouter>
      <MhdAppRoutes />
    </BrowserRouter>
  );
}

function MhdRouteFallback() {
  return (
    <div
      className="flex min-h-[240px] items-center justify-center text-sm text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      Loading...
    </div>
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
      <Suspense fallback={<MhdRouteFallback />}>
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
          {/* Outside MhdAppShell deliberately — a focused, chrome-free form,
              not a sidebar/nav page. MhdProtectedRoute redirects here for any
              authenticated login with no linked person (see that file's own
              gate) before it can reach anything below. */}
          <Route path="/complete-profile" element={<MhdCompleteProfilePage />} />
          <Route path="/enroll-mfa" element={<MhdEnrollMfaPage />} />
          <Route path="/mfa-challenge" element={<MhdMfaChallengePage />} />
          <Route element={<MhdAppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            {/* Role enforcement lives once in mhdRouteAccess.ts and is applied
                here at the router level — MhdSidebar hiding a link is not
                access control, this guard is. */}
            <Route element={<MhdRoleGuardedRoute />}>
              <Route path="/dashboard" element={<MhdDashboardPage />} />
              <Route path="/account/security" element={<MhdAccountSecurityPage />} />
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
              {/* Platform Admin only (mhdRouteAccess) — impersonation ("View
                  As"), user/company management hub, compliance gate status,
                  and privileged activity log. */}
              <Route path="/admin" element={<MhdAdminSettingsPage />} />
              {/* Platform Admin only (mhdRouteAccess) — QA test-data tools,
                  a shared-component preview, and a raw RPC console. */}
              <Route path="/lab" element={<MhdLabPage />} />
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
              <Route path="/users" element={<MhdUsersPage />} />
              <Route path="/users/new" element={<MhdUserInvitePage />} />
              <Route path="/users/:userId/edit" element={<MhdUserFormPage />} />
              <Route path="/users/:userId" element={<MhdUserDetailPage />} />
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
      </Suspense>

      {backgroundLocation ? (
        <Suspense fallback={<MhdRouteFallback />}>
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
        </Suspense>
      ) : null}
    </>
  );
}
