import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MhdProtectedRoute } from '@/features/authentication/components/MhdProtectedRoute';
import { MhdRoleGuardedRoute } from '@/appshell/MhdRoleGuardedRoute';
import { MhdAppShell } from '@/appshell/MhdAppShell';

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
import { MhdFormsPage } from '@/features/forms/components/MhdFormsPage';
import { MhdFormBuilderPage } from '@/features/forms/components/MhdFormBuilderPage';
import { MhdFormRendererPage } from '@/features/forms/components/MhdFormRendererPage';
import { MhdFormSubmissionsPage } from '@/features/forms/components/MhdFormSubmissionsPage';
import { MhdPeoplePage } from '@/features/people/components/MhdPeoplePage';
import { MhdPersonDetailPage } from '@/appshell/components/MhdPersonDetailPage';
import { MhdCompaniesPage } from '@/features/companies/components/MhdCompaniesPage';
import { MhdCompanyDetailPage } from '@/appshell/components/MhdCompanyDetailPage';
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
              <Route path="/forms" element={<MhdFormsPage />} />
              <Route path="/forms/new" element={<MhdFormBuilderPage />} />
              <Route path="/forms/:formId/render" element={<MhdFormRendererPage />} />
              <Route path="/forms/:formId/submissions" element={<MhdFormSubmissionsPage />} />
              <Route path="/forms/:formId" element={<MhdFormBuilderPage />} />
              <Route path="/people" element={<MhdPeoplePage />} />
              <Route path="/people/:personId" element={<MhdPersonDetailPage />} />
              <Route path="/companies" element={<MhdCompaniesPage />} />
              <Route path="/companies/:companyId" element={<MhdCompanyDetailPage />} />
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
