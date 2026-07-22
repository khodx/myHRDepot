import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
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
import { MhdTaskDetailPage } from '@/appshell/components/MhdTaskDetailPage';
import { MhdTaskNotesPage } from '@/features/notes/components/MhdTaskNotesPage';
import { MhdActivitiesPage } from '@/features/activities/components/MhdActivitiesPage';
import { MhdActivityDetailPage } from '@/features/activities/components/MhdActivityDetailPage';
import { MhdFormsPage } from '@/features/forms/components/MhdFormsPage';
import { MhdFormBuilderPage } from '@/features/forms/components/MhdFormBuilderPage';
import { MhdFormRendererPage } from '@/features/forms/components/MhdFormRendererPage';
import { MhdFormSubmissionsPage } from '@/features/forms/components/MhdFormSubmissionsPage';
import { MhdPropertyPage } from '@/features/property/components/MhdPropertyPage';
import { MhdPropertyDetailPage } from '@/features/property/components/MhdPropertyDetailPage';
import { MhdEsignaturePage } from '@/features/esignature/components/MhdEsignaturePage';
import { MhdEsignatureDetailPage } from '@/features/esignature/components/MhdEsignatureDetailPage';
import { MhdPublicSigningPage } from '@/features/esignature/components/MhdPublicSigningPage';
import { MhdPeoplePage } from '@/features/people/components/MhdPeoplePage';
import { MhdPersonDetailPage } from '@/appshell/components/MhdPersonDetailPage';
import { MhdCompaniesPage } from '@/features/companies/components/MhdCompaniesPage';
import { MhdCompanyDetailPage } from '@/appshell/components/MhdCompanyDetailPage';
import { MhdApprovalsPage } from '@/features/approvals/components/MhdApprovalsPage';
import { MhdPerformancePage } from '@/features/performance/Components/MhdPerformancePage';
import { MhdReviewDetailPage } from '@/features/performance/Components/MhdReviewDetailPage';
import { MhdCoachingPlanDetailPage } from '@/features/performance/Components/MhdCoachingPlanDetailPage';
import { MhdFeedbackInvitationsPage } from '@/features/performance/Components/MhdFeedbackInvitationsPage';
import { MhdReviewTemplatesPage } from '@/features/performance/Components/MhdReviewTemplatesPage';
import { MhdFeedbackSettingsPage } from '@/features/performance/Components/MhdFeedbackSettingsPage';
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
import { MhdApprovalDetailPage } from '@/features/approvals/components/MhdApprovalDetailPage';
import { MhdNotFoundPage } from '@/appshell/components/MhdNotFoundPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={<MhdLoginPage />} />
        <Route path="/forgot-password" element={<MhdForgotPasswordPage />} />
        <Route path="/reset-password" element={<MhdResetPasswordPage />} />
        <Route path="/auth/callback" element={<MhdAuthCallbackPage />} />
        <Route element={<PublicLayout />}>
          <Route path="/sign/:token" element={<MhdPublicSigningPage />} />
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
              <Route path="/tasks/:taskId" element={<MhdTaskDetailPage />} />
              {/* Inherits the /tasks 'ALL' rule via mhdCanAccessRoute's prefix match. */}
              <Route path="/tasks/:taskId/notes" element={<MhdTaskNotesPage />} />
              <Route path="/activities" element={<MhdActivitiesPage />} />
              <Route path="/activities/:activityId" element={<MhdActivityDetailPage />} />
              <Route path="/forms" element={<MhdFormsPage />} />
              <Route path="/forms/new" element={<MhdFormBuilderPage />} />
              <Route path="/forms/:formId/render" element={<MhdFormRendererPage />} />
              <Route path="/forms/:formId/submissions" element={<MhdFormSubmissionsPage />} />
              <Route path="/forms/:formId" element={<MhdFormBuilderPage />} />
              <Route path="/property" element={<MhdPropertyPage />} />
              <Route path="/property/:itemId" element={<MhdPropertyDetailPage />} />
              <Route path="/esignature" element={<MhdEsignaturePage />} />
              <Route path="/esignature/:requestId" element={<MhdEsignatureDetailPage />} />
              <Route path="/people" element={<MhdPeoplePage />} />
              <Route path="/people/:personId" element={<MhdPersonDetailPage />} />
              <Route path="/companies" element={<MhdCompaniesPage />} />
              <Route path="/companies/:companyId" element={<MhdCompanyDetailPage />} />
              <Route path="/approvals" element={<MhdApprovalsPage />} />
              <Route path="/approvals/:approvalId" element={<MhdApprovalDetailPage />} />
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
              {/* Mileage & Reimbursement. A single tabbed route; the page reads
                  useMhdAuth and renders the privileged company view or the
                  employee's own trips/claims. Viewer is excluded via
                  mhdRouteAccess. */}
              <Route path="/mileage" element={<MhdMileagePage />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="/404" element={<MhdNotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
