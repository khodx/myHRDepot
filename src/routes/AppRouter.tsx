import { lazy, Suspense } from 'react';
import type { ComponentType } from 'react';
import type { Location } from 'react-router-dom';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { MhdProtectedRoute } from '@/features/authentication/components/MhdProtectedRoute';
import { MhdRoleGuardedRoute } from '@/appshell/MhdRoleGuardedRoute';
import { MhdAppShell } from '@/appshell/MhdAppShell';
import { PublicLayout } from '@/layouts/PublicLayout';

/**
 * Wraps `lazy(() => import(...).then(...))` for a named (non-default)
 * export. Before 2026-08-06 (audit finding M18), every one of this file's
 * ~101 lazy page imports hand-rolled the `.then((module) => ({ default:
 * module.X }))` boilerplate inline. The `import(literal path)` call is
 * still written directly at each call site (just passed in as `loader`),
 * so Vite's static analysis for code-splitting still sees it.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- each lazily-loaded page has its own distinct props interface; `any` here matches how React's own LazyExoticComponent erases them
function lazyPage<T extends ComponentType<any>>(
  loader: () => Promise<Record<string, T>>,
  exportName: string,
) {
  return lazy(() => loader().then((module) => ({ default: module[exportName] })));
}

// Auth pages (scaffold's existing authentication feature — canonical)
const MhdLoginPage = lazyPage(
  () => import('@/features/authentication/components/MhdLoginPage'),
  'MhdLoginPage',
);
const MhdForgotPasswordPage = lazyPage(
  () => import('@/features/authentication/components/MhdForgotPasswordPage'),
  'MhdForgotPasswordPage',
);
const MhdResetPasswordPage = lazyPage(
  () => import('@/features/authentication/components/MhdResetPasswordPage'),
  'MhdResetPasswordPage',
);
const MhdAuthCallbackPage = lazyPage(
  () => import('@/features/authentication/components/MhdAuthCallbackPage'),
  'MhdAuthCallbackPage',
);
const MhdCompleteProfilePage = lazyPage(
  () => import('@/features/authentication/components/MhdCompleteProfilePage'),
  'MhdCompleteProfilePage',
);
const MhdEnrollMfaPage = lazyPage(
  () => import('@/features/authentication/components/MhdEnrollMfaPage'),
  'MhdEnrollMfaPage',
);
const MhdMfaChallengePage = lazyPage(
  () => import('@/features/authentication/components/MhdMfaChallengePage'),
  'MhdMfaChallengePage',
);
const MhdAccountSecurityPage = lazyPage(
  () => import('@/features/authentication/components/MhdAccountSecurityPage'),
  'MhdAccountSecurityPage',
);

// App pages
const MhdDashboardPage = lazyPage(
  () => import('@/features/dashboard/components/MhdDashboardPage'),
  'MhdDashboardPage',
);
const MhdTasksPage = lazyPage(
  () => import('@/features/tasks/components/MhdTasksPage'),
  'MhdTasksPage',
);
const MhdTaskFormPage = lazyPage(
  () => import('@/features/tasks/components/MhdTaskFormPage'),
  'MhdTaskFormPage',
);
const MhdTaskDetailPage = lazyPage(
  () => import('@/appshell/components/MhdTaskDetailPage'),
  'MhdTaskDetailPage',
);
const MhdSubtaskDetailPage = lazyPage(
  () => import('@/features/tasks/components/MhdSubtaskDetailPage'),
  'MhdSubtaskDetailPage',
);
const MhdTaskNotesPage = lazyPage(
  () => import('@/features/notes/components/MhdTaskNotesPage'),
  'MhdTaskNotesPage',
);
const MhdActivitiesPage = lazyPage(
  () => import('@/features/activities/components/MhdActivitiesPage'),
  'MhdActivitiesPage',
);
const MhdCalendarPage = lazyPage(
  () => import('@/features/calendar/components/MhdCalendarPage'),
  'MhdCalendarPage',
);
const MhdActivityDetailPage = lazyPage(
  () => import('@/features/activities/components/MhdActivityDetailPage'),
  'MhdActivityDetailPage',
);
const MhdActivityMessagesPage = lazyPage(
  () => import('@/features/messaging/components/MhdActivityMessagesPage'),
  'MhdActivityMessagesPage',
);
const MhdTaskActivitiesPage = lazyPage(
  () => import('@/features/activities/components/MhdTaskActivitiesPage'),
  'MhdTaskActivitiesPage',
);
const MhdTaskAttachmentsPage = lazyPage(
  () => import('@/features/attachments/components/MhdTaskAttachmentsPage'),
  'MhdTaskAttachmentsPage',
);
const MhdTaskReportsPage = lazyPage(
  () => import('@/features/documents/components/MhdTaskReportsPage'),
  'MhdTaskReportsPage',
);
const MhdTaskMessagesPage = lazyPage(
  () => import('@/features/messaging/components/MhdTaskMessagesPage'),
  'MhdTaskMessagesPage',
);
const MhdTaskDashboardReportPage = lazyPage(
  () => import('@/features/tasks/components/MhdTaskDashboardReportPage'),
  'MhdTaskDashboardReportPage',
);
const MhdTaskAuditPage = lazyPage(
  () => import('@/features/audit/components/MhdTaskAuditPage'),
  'MhdTaskAuditPage',
);
const MhdAuditReportsPage = lazyPage(
  () => import('@/features/audit/components/MhdAuditReportsPage'),
  'MhdAuditReportsPage',
);
const MhdDocumentsPage = lazyPage(
  () => import('@/features/documents/components/MhdDocumentsPage'),
  'MhdDocumentsPage',
);
const MhdFormsPage = lazyPage(
  () => import('@/features/forms/components/MhdFormsPage'),
  'MhdFormsPage',
);
const MhdFormDetailPage = lazyPage(
  () => import('@/features/forms/components/MhdFormDetailPage'),
  'MhdFormDetailPage',
);
const MhdFormBuilderPage = lazyPage(
  () => import('@/features/forms/components/MhdFormBuilderPage'),
  'MhdFormBuilderPage',
);
const MhdFormRendererPage = lazyPage(
  () => import('@/features/forms/components/MhdFormRendererPage'),
  'MhdFormRendererPage',
);
const MhdFormModalRoute = lazyPage(
  () => import('@/features/forms/components/MhdFormModalRoute'),
  'MhdFormModalRoute',
);
const MhdFormSubmissionsPage = lazyPage(
  () => import('@/features/forms/components/MhdFormSubmissionsPage'),
  'MhdFormSubmissionsPage',
);
const MhdFormLibraryPage = lazyPage(
  () => import('@/features/forms/components/MhdFormLibraryPage'),
  'MhdFormLibraryPage',
);
const MhdPropertyPage = lazyPage(
  () => import('@/features/property/components/MhdPropertyPage'),
  'MhdPropertyPage',
);
const MhdPropertyDetailPage = lazyPage(
  () => import('@/features/property/components/MhdPropertyDetailPage'),
  'MhdPropertyDetailPage',
);
const MhdEsignaturePage = lazyPage(
  () => import('@/features/esignature/components/MhdEsignaturePage'),
  'MhdEsignaturePage',
);
const MhdEsignatureDetailPage = lazyPage(
  () => import('@/features/esignature/components/MhdEsignatureDetailPage'),
  'MhdEsignatureDetailPage',
);
const MhdPublicSigningPage = lazyPage(
  () => import('@/features/esignature/components/MhdPublicSigningPage'),
  'MhdPublicSigningPage',
);
const MhdCertificateVerificationPage = lazyPage(
  () => import('@/features/esignature/components/MhdCertificateVerificationPage'),
  'MhdCertificateVerificationPage',
);
const MhdCommunicationsPage = lazyPage(
  () => import('@/features/communications/components/MhdCommunicationsPage'),
  'MhdCommunicationsPage',
);
const MhdAnnouncementsPage = lazyPage(
  () => import('@/features/announcements/components/MhdAnnouncementsPage'),
  'MhdAnnouncementsPage',
);
const MhdAnnouncementFormPage = lazyPage(
  () => import('@/features/announcements/components/MhdAnnouncementFormPage'),
  'MhdAnnouncementFormPage',
);
const MhdAnnouncementDetailPage = lazyPage(
  () => import('@/features/announcements/components/MhdAnnouncementDetailPage'),
  'MhdAnnouncementDetailPage',
);
const MhdMessagingPage = lazyPage(
  () => import('@/features/messaging/components/MhdMessagingPage'),
  'MhdMessagingPage',
);
const MhdCorrespondenceInboxPage = lazyPage(
  () => import('@/features/correspondence/components/MhdCorrespondenceInboxPage'),
  'MhdCorrespondenceInboxPage',
);
const MhdCorrespondenceAliasSettingsPage = lazyPage(
  () => import('@/features/correspondence/components/MhdCorrespondenceAliasSettingsPage'),
  'MhdCorrespondenceAliasSettingsPage',
);
const MhdSystemAlertsPage = lazyPage(
  () => import('@/features/communications/components/MhdSystemAlertsPage'),
  'MhdSystemAlertsPage',
);
const MhdAutomationsPage = lazyPage(
  () => import('@/features/automations/components/MhdAutomationsPage'),
  'MhdAutomationsPage',
);
const MhdAutomationRuleDetailPage = lazyPage(
  () => import('@/features/automations/components/MhdAutomationRuleDetailPage'),
  'MhdAutomationRuleDetailPage',
);
const MhdAutomationRunDetailPage = lazyPage(
  () => import('@/features/automations/components/MhdAutomationRunDetailPage'),
  'MhdAutomationRunDetailPage',
);
const MhdAdminSettingsPage = lazyPage(
  () => import('@/features/admin/components/MhdAdminSettingsPage'),
  'MhdAdminSettingsPage',
);
const MhdLabPage = lazyPage(() => import('@/features/lab/components/MhdLabPage'), 'MhdLabPage');
const MhdEmployeeFilesPage = lazyPage(
  () => import('@/features/employee-files/components/MhdEmployeeFilesPage'),
  'MhdEmployeeFilesPage',
);
const MhdEmployeeFileCabinetPage = lazyPage(
  () => import('@/features/employee-files/components/MhdEmployeeFileCabinetPage'),
  'MhdEmployeeFileCabinetPage',
);
const MhdEmployeeFileNewRecordPage = lazyPage(
  () => import('@/features/employee-files/components/MhdEmployeeFileNewRecordPage'),
  'MhdEmployeeFileNewRecordPage',
);
const MhdPeoplePage = lazyPage(
  () => import('@/features/people/components/MhdPeoplePage'),
  'MhdPeoplePage',
);
const MhdOrgChartPage = lazyPage(
  () => import('@/features/people/components/MhdOrgChartPage'),
  'MhdOrgChartPage',
);
const MhdPersonFormPage = lazyPage(
  () => import('@/features/people/components/MhdPersonFormPage'),
  'MhdPersonFormPage',
);
const MhdPersonDetailPage = lazyPage(
  () => import('@/appshell/components/MhdPersonDetailPage'),
  'MhdPersonDetailPage',
);
const MhdUsersPage = lazyPage(
  () => import('@/features/users/components/MhdUsersPage'),
  'MhdUsersPage',
);
const MhdUserInvitePage = lazyPage(
  () => import('@/features/users/components/MhdUserInvitePage'),
  'MhdUserInvitePage',
);
const MhdUserDetailPage = lazyPage(
  () => import('@/features/users/components/MhdUserDetailPage'),
  'MhdUserDetailPage',
);
const MhdUserFormPage = lazyPage(
  () => import('@/features/users/components/MhdUserFormPage'),
  'MhdUserFormPage',
);
const MhdCompaniesPage = lazyPage(
  () => import('@/features/companies/components/MhdCompaniesPage'),
  'MhdCompaniesPage',
);
const MhdCompanyFormPage = lazyPage(
  () => import('@/features/companies/components/MhdCompanyFormPage'),
  'MhdCompanyFormPage',
);
const MhdCompanyDetailPage = lazyPage(
  () => import('@/appshell/components/MhdCompanyDetailPage'),
  'MhdCompanyDetailPage',
);
const MhdApprovalsPage = lazyPage(
  () => import('@/features/approvals/components/MhdApprovalsPage'),
  'MhdApprovalsPage',
);
const MhdApprovalDetailPage = lazyPage(
  () => import('@/features/approvals/components/MhdApprovalDetailPage'),
  'MhdApprovalDetailPage',
);
const MhdPerformancePage = lazyPage(
  () => import('@/features/performance/Components/MhdPerformancePage'),
  'MhdPerformancePage',
);
const MhdReviewDetailPage = lazyPage(
  () => import('@/features/performance/Components/MhdReviewDetailPage'),
  'MhdReviewDetailPage',
);
const MhdCoachingPlanDetailPage = lazyPage(
  () => import('@/features/performance/Components/MhdCoachingPlanDetailPage'),
  'MhdCoachingPlanDetailPage',
);
const MhdFeedbackInvitationsPage = lazyPage(
  () => import('@/features/performance/Components/MhdFeedbackInvitationsPage'),
  'MhdFeedbackInvitationsPage',
);
const MhdReviewTemplatesPage = lazyPage(
  () => import('@/features/performance/Components/MhdReviewTemplatesPage'),
  'MhdReviewTemplatesPage',
);
const MhdFeedbackSettingsPage = lazyPage(
  () => import('@/features/performance/Components/MhdFeedbackSettingsPage'),
  'MhdFeedbackSettingsPage',
);
const MhdOnboardingIndexPage = lazyPage(
  () => import('@/features/onboarding/components/MhdOnboardingIndexPage'),
  'MhdOnboardingIndexPage',
);
const MhdOnboardingPersonPage = lazyPage(
  () => import('@/features/onboarding/components/MhdOnboardingPersonPage'),
  'MhdOnboardingPersonPage',
);
const MhdOffboardingPage = lazyPage(
  () => import('@/features/offboarding/components/MhdOffboardingPage'),
  'MhdOffboardingPage',
);
const MhdOffboardingCaseDetailPage = lazyPage(
  () => import('@/features/offboarding/components/MhdOffboardingCaseDetailPage'),
  'MhdOffboardingCaseDetailPage',
);
const MhdConductPage = lazyPage(
  () => import('@/features/conduct/components/MhdConductPage'),
  'MhdConductPage',
);
const MhdConductCaseDetailPage = lazyPage(
  () => import('@/features/conduct/components/MhdConductCaseDetailPage'),
  'MhdConductCaseDetailPage',
);
const MhdSchedulePage = lazyPage(
  () => import('@/features/timeattendance/components/MhdSchedulePage'),
  'MhdSchedulePage',
);
const MhdAttendancePage = lazyPage(
  () => import('@/features/timeattendance/components/MhdAttendancePage'),
  'MhdAttendancePage',
);
const MhdAttendancePolicyPage = lazyPage(
  () => import('@/features/timeattendance/components/MhdAttendancePolicyPage'),
  'MhdAttendancePolicyPage',
);
const MhdJobsPage = lazyPage(() => import('@/features/jobs/components/MhdJobsPage'), 'MhdJobsPage');
const MhdJobDescriptionWizard = lazyPage(
  () => import('@/features/jobs/components/MhdJobDescriptionWizard'),
  'MhdJobDescriptionWizard',
);
const MhdCompetencyLibraryPage = lazyPage(
  () => import('@/features/jobs/components/MhdCompetencyLibraryPage'),
  'MhdCompetencyLibraryPage',
);
const MhdJobDetailPage = lazyPage(
  () => import('@/features/jobs/components/MhdJobDetailPage'),
  'MhdJobDetailPage',
);
const MhdMyJobPage = lazyPage(
  () => import('@/features/jobs/components/MhdMyJobPage'),
  'MhdMyJobPage',
);
const MhdMileagePage = lazyPage(
  () => import('@/features/mileage/components/MhdMileagePage'),
  'MhdMileagePage',
);
const MhdMileageClaimDetailPage = lazyPage(
  () => import('@/features/mileage/components/MhdMileageClaimDetailPage'),
  'MhdMileageClaimDetailPage',
);
const MhdLeavesPage = lazyPage(
  () => import('@/features/leaves/components/MhdLeavesPage'),
  'MhdLeavesPage',
);
const MhdLeaveTypeLibraryPage = lazyPage(
  () => import('@/features/leaves/components/MhdLeaveTypeLibraryPage'),
  'MhdLeaveTypeLibraryPage',
);
const MhdLeaveCaseDetailPage = lazyPage(
  () => import('@/features/leaves/components/MhdLeaveCaseDetailPage'),
  'MhdLeaveCaseDetailPage',
);
const MhdLeaveCaseMessagesPage = lazyPage(
  () => import('@/features/messaging/components/MhdLeaveCaseMessagesPage'),
  'MhdLeaveCaseMessagesPage',
);
const MhdLeaveCaseCorrespondencePage = lazyPage(
  () => import('@/features/correspondence/components/MhdLeaveCaseCorrespondencePage'),
  'MhdLeaveCaseCorrespondencePage',
);
const MhdAccommodationsPage = lazyPage(
  () => import('@/features/accommodations/components/MhdAccommodationsPage'),
  'MhdAccommodationsPage',
);
const MhdAccommodationOptionCatalogPage = lazyPage(
  () => import('@/features/accommodations/components/MhdAccommodationOptionCatalogPage'),
  'MhdAccommodationOptionCatalogPage',
);
const MhdAccommodationCaseDetailPage = lazyPage(
  () => import('@/features/accommodations/components/MhdAccommodationCaseDetailPage'),
  'MhdAccommodationCaseDetailPage',
);
const MhdAccommodationCaseMessagesPage = lazyPage(
  () => import('@/features/messaging/components/MhdAccommodationCaseMessagesPage'),
  'MhdAccommodationCaseMessagesPage',
);
const MhdAccommodationCaseCorrespondencePage = lazyPage(
  () => import('@/features/correspondence/components/MhdAccommodationCaseCorrespondencePage'),
  'MhdAccommodationCaseCorrespondencePage',
);
const MhdInvestigationsPage = lazyPage(
  () => import('@/features/investigations/components/MhdInvestigationsPage'),
  'MhdInvestigationsPage',
);
const MhdInvestigationCaseDetailPage = lazyPage(
  () => import('@/features/investigations/components/MhdInvestigationCaseDetailPage'),
  'MhdInvestigationCaseDetailPage',
);
const MhdTrainingPage = lazyPage(
  () => import('@/features/training/components/MhdTrainingPage'),
  'MhdTrainingPage',
);
const MhdMyTrainingRoutePage = lazyPage(
  () => import('@/features/training/components/MhdMyTrainingRoutePage'),
  'MhdMyTrainingRoutePage',
);
const MhdHandbooksPage = lazyPage(
  () => import('@/features/handbook/components/MhdHandbooksPage'),
  'MhdHandbooksPage',
);
const MhdHandbookSectionLibraryPage = lazyPage(
  () => import('@/features/handbook/components/MhdHandbookSectionLibraryPage'),
  'MhdHandbookSectionLibraryPage',
);
const MhdHandbookDetailPage = lazyPage(
  () => import('@/features/handbook/components/MhdHandbookDetailPage'),
  'MhdHandbookDetailPage',
);
const MhdMyHandbooksRoutePage = lazyPage(
  () => import('@/features/handbook/components/MhdMyHandbooksRoutePage'),
  'MhdMyHandbooksRoutePage',
);
const MhdChecklistLibraryPage = lazyPage(
  () => import('@/features/checklists/components/MhdChecklistLibraryPage'),
  'MhdChecklistLibraryPage',
);
const MhdMyChecklistsPage = lazyPage(
  () => import('@/features/checklists/components/MhdMyChecklistsPage'),
  'MhdMyChecklistsPage',
);
const MhdChecklistInstanceDetailPage = lazyPage(
  () => import('@/features/checklists/components/MhdChecklistInstanceDetailPage'),
  'MhdChecklistInstanceDetailPage',
);
const MhdPolicyLibraryPage = lazyPage(
  () => import('@/features/policies/components/MhdPolicyLibraryPage'),
  'MhdPolicyLibraryPage',
);
const MhdMyPoliciesPage = lazyPage(
  () => import('@/features/policies/components/MhdMyPoliciesPage'),
  'MhdMyPoliciesPage',
);
const MhdMemorandumsPage = lazyPage(
  () => import('@/features/memorandums/components/MhdMemorandumsPage'),
  'MhdMemorandumsPage',
);
const MhdMyMemorandumsPage = lazyPage(
  () => import('@/features/memorandums/components/MhdMyMemorandumsPage'),
  'MhdMyMemorandumsPage',
);
const MhdRecruitingRoutePage = lazyPage(
  () => import('@/features/recruiting/components/MhdRecruitingRoutePage'),
  'MhdRecruitingRoutePage',
);
const MhdRequisitionDetailRoutePage = lazyPage(
  () => import('@/features/recruiting/components/MhdRequisitionDetailRoutePage'),
  'MhdRequisitionDetailRoutePage',
);
const MhdRequisitionPipelineRoutePage = lazyPage(
  () => import('@/features/recruiting/components/MhdRequisitionPipelineRoutePage'),
  'MhdRequisitionPipelineRoutePage',
);
const MhdRequisitionInterviewGuideRoutePage = lazyPage(
  () => import('@/features/recruiting/components/MhdRequisitionInterviewGuideRoutePage'),
  'MhdRequisitionInterviewGuideRoutePage',
);
const MhdApplicationDetailRoutePage = lazyPage(
  () => import('@/features/recruiting/components/MhdApplicationDetailRoutePage'),
  'MhdApplicationDetailRoutePage',
);
const MhdApplicationCorrespondencePage = lazyPage(
  () => import('@/features/correspondence/components/MhdApplicationCorrespondencePage'),
  'MhdApplicationCorrespondencePage',
);
const MhdApplicationInterviewsRoutePage = lazyPage(
  () => import('@/features/recruiting/components/MhdApplicationInterviewsRoutePage'),
  'MhdApplicationInterviewsRoutePage',
);
const MhdApplicationEvaluationRoutePage = lazyPage(
  () => import('@/features/recruiting/components/MhdApplicationEvaluationRoutePage'),
  'MhdApplicationEvaluationRoutePage',
);
const MhdApplicationOfferRoutePage = lazyPage(
  () => import('@/features/recruiting/components/MhdApplicationOfferRoutePage'),
  'MhdApplicationOfferRoutePage',
);
const MhdInterviewWorksheetRoutePage = lazyPage(
  () => import('@/features/recruiting/components/MhdInterviewWorksheetRoutePage'),
  'MhdInterviewWorksheetRoutePage',
);
const MhdQuestionBankRoutePage = lazyPage(
  () => import('@/features/recruiting/components/MhdQuestionBankRoutePage'),
  'MhdQuestionBankRoutePage',
);
const MhdEeoReportRoutePage = lazyPage(
  () => import('@/features/recruiting/components/MhdEeoReportRoutePage'),
  'MhdEeoReportRoutePage',
);
const MhdApplyPage = lazyPage(
  () => import('@/features/recruiting/requisitions/components/MhdApplyPage'),
  'MhdApplyPage',
);
const MhdNotFoundPage = lazyPage(
  () => import('@/appshell/components/MhdNotFoundPage'),
  'MhdNotFoundPage',
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
                <Route path="/tasks/:taskId/messages" element={<MhdTaskMessagesPage />} />
                <Route
                  path="/tasks/:taskId/subtasks/:subtaskId"
                  element={<MhdSubtaskDetailPage />}
                />
                <Route path="/tasks/dashboard-report" element={<MhdTaskDashboardReportPage />} />
                {/* Platform Admin / HR Partner only — see the dedicated
                  '/tasks/:taskId/audit' segment-pattern rule in
                  mhdRouteAccess.ts, which precedes the general '/tasks'
                  'ALL' rule above via array order. */}
                <Route path="/tasks/:taskId/audit" element={<MhdTaskAuditPage />} />
                <Route path="/activities" element={<MhdActivitiesPage />} />
                <Route path="/activities/:activityId" element={<MhdActivityDetailPage />} />
                <Route
                  path="/activities/:activityId/messages"
                  element={<MhdActivityMessagesPage />}
                />
                <Route path="/calendar" element={<MhdCalendarPage />} />
                <Route path="/reports" element={<MhdDocumentsPage />} />
                <Route path="/forms" element={<MhdFormsPage />} />
                {/* Forms Studio/Library split (2026-08-18). '/forms/studio'
                    aliases the existing Studio list; '/forms' keeps working
                    unchanged for any existing deep link. */}
                <Route path="/forms/studio" element={<MhdFormsPage />} />
                <Route path="/forms/library" element={<MhdFormLibraryPage />} />
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
                <Route path="/communications/announcements" element={<MhdAnnouncementsPage />} />
                <Route path="/communications/announcements/new" element={<MhdAnnouncementFormPage />} />
                <Route path="/communications/announcements/:announcementId/edit" element={<MhdAnnouncementFormPage />} />
                <Route path="/communications/announcements/:announcementId" element={<MhdAnnouncementDetailPage />} />
                <Route path="/communications/messaging" element={<MhdMessagingPage />} />
                <Route path="/communications/inbox" element={<MhdCorrespondenceInboxPage />} />
                <Route
                  path="/communications/routing"
                  element={<MhdCorrespondenceAliasSettingsPage />}
                />
                <Route path="/communications/system-alerts" element={<MhdSystemAlertsPage />} />
                <Route path="/automations" element={<MhdAutomationsPage />} />
                {/* Both inherit the /automations rule via mhdCanAccessRoute's
                  prefix match. Arming inside the rule page is gated separately
                  on mhdCanArmAutomations (Platform Admin only). */}
                <Route
                  path="/automations/rules/:ruleId"
                  element={<MhdAutomationRuleDetailPage />}
                />
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
                <Route path="/people/org-chart" element={<MhdOrgChartPage />} />
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
                <Route
                  path="/performance/coaching/:planId"
                  element={<MhdCoachingPlanDetailPage />}
                />
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
                <Route path="/jobs/new" element={<MhdJobDescriptionWizard />} />
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
                <Route path="/leaves/policy-library" element={<MhdLeaveTypeLibraryPage />} />
                <Route path="/leaves" element={<MhdLeavesPage />} />
                <Route path="/leaves/:caseId" element={<MhdLeaveCaseDetailPage />} />
                <Route path="/leaves/:caseId/messages" element={<MhdLeaveCaseMessagesPage />} />
                <Route path="/leaves/:caseId/correspondence" element={<MhdLeaveCaseCorrespondencePage />} />
                <Route
                  path="/accommodations/option-library"
                  element={<MhdAccommodationOptionCatalogPage />}
                />
                <Route path="/accommodations" element={<MhdAccommodationsPage />} />
                <Route
                  path="/accommodations/:caseId"
                  element={<MhdAccommodationCaseDetailPage />}
                />
                <Route
                  path="/accommodations/:caseId/messages"
                  element={<MhdAccommodationCaseMessagesPage />}
                />
                <Route
                  path="/accommodations/:caseId/correspondence"
                  element={<MhdAccommodationCaseCorrespondencePage />}
                />
                {/* Investigations — the strictest access model. The route admits
                  Platform Admin / HR Partner / Client Admin (see mhdRouteAccess);
                  /investigations/:caseId inherits that rule via the guard's
                  prefix match. Route access only lets these roles NAVIGATE — case
                  visibility is grant-based server-side, so an ungranted admin sees
                  an empty board and cannot open any case. Client User and Viewer
                  are excluded; there is deliberately NO subject-facing route. Both
                  pages read useMhdAuth/useParams themselves. */}
                <Route path="/investigations" element={<MhdInvestigationsPage />} />
                <Route
                  path="/investigations/:caseId"
                  element={<MhdInvestigationCaseDetailPage />}
                />
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
                {/* Handbook Studio/Library split (2026-08-18). '/handbooks/studio'
                    aliases the existing admin wizard (per the implementer's
                    own recommendation — it's already the Studio surface,
                    gated to the same roles; building a duplicate would
                    violate the shared-architecture standard). */}
                <Route path="/handbooks/studio" element={<MhdHandbooksPage />} />
                <Route path="/handbooks/library" element={<MhdHandbookSectionLibraryPage />} />
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
                <Route path="/checklists" element={<MhdChecklistLibraryPage />} />
                <Route path="/checklists/:instanceId" element={<MhdChecklistInstanceDetailPage />} />
                <Route path="/my-checklists" element={<MhdMyChecklistsPage />} />
                <Route path="/policies" element={<MhdPolicyLibraryPage />} />
                <Route path="/my-policies" element={<MhdMyPoliciesPage />} />
                <Route path="/memorandums" element={<MhdMemorandumsPage />} />
                <Route path="/my-memorandums" element={<MhdMyMemorandumsPage />} />
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
                  path="/recruiting/applications/:appId/correspondence"
                  element={<MhdApplicationCorrespondencePage />}
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
