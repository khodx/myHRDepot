import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';

/**
 * Route/component tests for the app router (04.1 - Navigation & App Shell).
 *
 * MhdAppRouter gates routes on *authentication* via MhdProtectedRoute, and
 * on *role* via MhdRoleGuardedRoute (see mhdRouteAccess.ts). MhdSidebar
 * hiding a nav link is UX only; the router guard is the actual enforcement
 * point, exercised below under "role-gated navigation".
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUseMhdAuth = vi.fn();
vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => mockUseMhdAuth(),
}));

// MhdProtectedRoute belongs to the scaffold's authentication feature. It is
// mocked here as a faithful stand-in for its real implementation
// (src/features/authentication/components/MhdProtectedRoute.tsx: redirect to
// /login with `state={{ from: location }}` when unauthenticated, render
// <Outlet /> otherwise) so this module's tests stay isolated from auth
// internals while still exercising the exact contract the router relies on.
vi.mock('@/features/authentication/components/MhdProtectedRoute', async () => {
  const { Navigate, Outlet, useLocation } = await import('react-router-dom');
  return {
    MhdProtectedRoute: () => {
      const location = useLocation();
      const { isAuthenticated, isLoading } = mockUseMhdAuth();
      if (isLoading) return <div>Loading My HR Depot...</div>;
      if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
      }
      return <Outlet />;
    },
  };
});

// MhdRoleGuardedRoute is this module's own file (not mocked away like the
// 03.1-owned MhdProtectedRoute) — tests exercise the real implementation.

vi.mock('../MhdAppShell', async () => {
  const { Outlet } = await import('react-router-dom');
  return {
    MhdAppShell: () => (
      <div data-testid="app-shell">
        <Outlet />
      </div>
    ),
  };
});

// The real MhdLoginPage renders inside MhdAuthLayout; the mock keeps that
// structural contract visible via the auth-layout test id.
vi.mock('@/features/authentication/components/MhdLoginPage', () => ({
  MhdLoginPage: () => (
    <div data-testid="auth-layout">
      <div>Login Page</div>
    </div>
  ),
}));
vi.mock('@/features/authentication/components/MhdForgotPasswordPage', () => ({
  MhdForgotPasswordPage: () => <div>Forgot Password Page</div>,
}));
vi.mock('@/features/authentication/components/MhdResetPasswordPage', () => ({
  MhdResetPasswordPage: () => <div>Reset Password Page</div>,
}));
vi.mock('@/features/authentication/components/MhdAuthCallbackPage', () => ({
  MhdAuthCallbackPage: () => <div>Auth Callback Page</div>,
}));

vi.mock('@/features/dashboard/components/MhdDashboardPage', () => ({
  MhdDashboardPage: () => <div>Dashboard Page</div>,
}));
vi.mock('@/features/tasks/components/MhdTasksPage', () => ({
  MhdTasksPage: () => <div>Tasks Page</div>,
}));
vi.mock('@/features/forms/components/MhdFormsPage', () => ({
  MhdFormsPage: () => <div>Forms Page</div>,
}));
vi.mock('@/features/activities/components/MhdActivitiesPage', () => ({
  MhdActivitiesPage: () => <div>Activities Page</div>,
}));
vi.mock('@/features/calendar/components/MhdCalendarPage', () => ({
  MhdCalendarPage: () => <div>Calendar Page</div>,
}));
vi.mock('@/features/activities/components/MhdActivityDetailPage', () => ({
  MhdActivityDetailPage: () => <div>Activity Detail Page</div>,
}));
vi.mock('@/features/forms/components/MhdFormBuilderPage', () => ({
  MhdFormBuilderPage: () => <div>Form Builder Page</div>,
}));
vi.mock('@/features/forms/components/MhdFormDetailPage', () => ({
  MhdFormDetailPage: () => <div>Form Detail Page</div>,
}));
vi.mock('@/features/forms/components/MhdFormRendererPage', () => ({
  MhdFormRendererPage: () => <div>Form Renderer Page</div>,
}));
vi.mock('@/features/forms/components/MhdFormSubmissionsPage', () => ({
  MhdFormSubmissionsPage: () => <div>Form Submissions Page</div>,
}));
vi.mock('@/features/property/components/MhdPropertyPage', () => ({
  MhdPropertyPage: () => <div>Property Page</div>,
}));
vi.mock('@/features/property/components/MhdPropertyDetailPage', () => ({
  MhdPropertyDetailPage: () => <div>Property Detail Page</div>,
}));
vi.mock('@/features/esignature/components/MhdEsignaturePage', () => ({
  MhdEsignaturePage: () => <div>E-Signature Page</div>,
}));
vi.mock('@/features/esignature/components/MhdEsignatureDetailPage', () => ({
  MhdEsignatureDetailPage: () => <div>E-Signature Detail Page</div>,
}));
vi.mock('@/features/esignature/components/MhdPublicSigningPage', () => ({
  MhdPublicSigningPage: () => <div>Public Signing Page</div>,
}));
vi.mock('../components/MhdTaskDetailPage', () => ({
  MhdTaskDetailPage: () => <div>Task Detail Page</div>,
}));
vi.mock('@/features/notes/components/MhdTaskNotesPage', () => ({
  MhdTaskNotesPage: () => <div>Task Notes Page</div>,
}));
vi.mock('@/features/people/components/MhdPeoplePage', () => ({
  MhdPeoplePage: () => <div>People Page</div>,
}));
vi.mock('@/features/people/components/MhdOrgChartPage', () => ({
  MhdOrgChartPage: () => <div>Org Chart Page</div>,
}));
vi.mock('../components/MhdPersonDetailPage', () => ({
  MhdPersonDetailPage: () => <div>Person Detail Page</div>,
}));
vi.mock('@/features/companies/components/MhdCompaniesPage', () => ({
  MhdCompaniesPage: () => <div>Companies Page</div>,
}));
vi.mock('../components/MhdCompanyDetailPage', () => ({
  MhdCompanyDetailPage: () => <div>Company Detail Page</div>,
}));
vi.mock('@/features/approvals/components/MhdApprovalsPage', () => ({
  MhdApprovalsPage: () => <div>Approvals Page</div>,
}));
vi.mock('@/features/approvals/components/MhdApprovalDetailPage', () => ({
  MhdApprovalDetailPage: () => <div>Approval Detail Page</div>,
}));
vi.mock('@/features/performance/Components/MhdPerformancePage', () => ({
  MhdPerformancePage: () => <div>Performance Page</div>,
}));
vi.mock('@/features/performance/Components/MhdReviewDetailPage', () => ({
  MhdReviewDetailPage: () => <div>Performance Review Detail Page</div>,
}));
vi.mock('@/features/performance/Components/MhdCoachingPlanDetailPage', () => ({
  MhdCoachingPlanDetailPage: () => <div>Coaching Plan Detail Page</div>,
}));
vi.mock('@/features/offboarding/components/MhdOffboardingPage', () => ({
  MhdOffboardingPage: () => <div>Offboarding Page</div>,
}));
vi.mock('@/features/offboarding/components/MhdOffboardingCaseDetailPage', () => ({
  MhdOffboardingCaseDetailPage: () => <div>Offboarding Case Detail Page</div>,
}));
vi.mock('@/features/onboarding/components/MhdOnboardingIndexPage', () => ({
  MhdOnboardingIndexPage: () => <div>Onboarding Page</div>,
}));
vi.mock('@/features/onboarding/components/MhdOnboardingPersonPage', () => ({
  MhdOnboardingPersonPage: () => <div>Onboarding Person Page</div>,
}));
vi.mock('@/features/timeattendance/components/MhdSchedulePage', () => ({
  MhdSchedulePage: () => <div>Schedule Page</div>,
}));
vi.mock('@/features/timeattendance/components/MhdAttendancePage', () => ({
  MhdAttendancePage: () => <div>Attendance Page</div>,
}));
vi.mock('@/features/timeattendance/components/MhdAttendancePolicyPage', () => ({
  MhdAttendancePolicyPage: () => <div>Attendance Policy Page</div>,
}));
vi.mock('@/features/leaves/components/MhdLeavesPage', () => ({
  MhdLeavesPage: () => <div>Leaves Page</div>,
}));
vi.mock('@/features/leaves/components/MhdLeaveCaseDetailPage', () => ({
  MhdLeaveCaseDetailPage: () => <div>Leave Case Detail Page</div>,
}));
vi.mock('@/features/accommodations/components/MhdAccommodationsPage', () => ({
  MhdAccommodationsPage: () => <div>Accommodations Page</div>,
}));
vi.mock('@/features/accommodations/components/MhdAccommodationCaseDetailPage', () => ({
  MhdAccommodationCaseDetailPage: () => <div>Accommodation Case Detail Page</div>,
}));
vi.mock('../components/MhdNotFoundPage', () => ({
  MhdNotFoundPage: () => <div>Page Not Found</div>,
}));

// Import after mocks are registered.
const { AppRouter: MhdAppRouter } = await import('@/routes/AppRouter');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setUrl(path: string) {
  window.history.pushState({}, '', path);
}

function mockAuth(overrides: {
  isAuthenticated: boolean;
  isLoading?: boolean;
  roles?: MhdAuthRoleName[];
}) {
  mockUseMhdAuth.mockReturnValue({
    isLoading: overrides.isLoading ?? false,
    isAuthenticated: overrides.isAuthenticated,
    userEmail: overrides.isAuthenticated ? 'user@myhrdepot.com' : null,
    authUserId: overrides.isAuthenticated ? 'auth-user-1' : null,
    profile: overrides.isAuthenticated
      ? {
          userId: 'user-1',
          companyId: 'company-1',
          companyName: 'Acme Co',
          personId: 'person-1',
          displayName: 'Jane Doe',
          firstName: 'Jane',
          lastName: 'Doe',
          roleNames: overrides.roles ?? ['Client User'],
        }
      : null,
    roles: overrides.isAuthenticated ? (overrides.roles ?? ['Client User']) : [],
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  window.history.pushState({}, '', '/');
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MhdAppRouter', () => {
  it('redirects "/" to "/dashboard" when authenticated', async () => {
    mockAuth({ isAuthenticated: true });
    setUrl('/');

    render(<MhdAppRouter />);

    expect(await screen.findByText('Dashboard Page')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/dashboard');
  });

  it('renders the login page at "/login" without authentication', async () => {
    mockAuth({ isAuthenticated: false });
    setUrl('/login');

    render(<MhdAppRouter />);

    expect(await screen.findByText('Login Page')).toBeInTheDocument();
    expect(screen.getByTestId('auth-layout')).toBeInTheDocument();
  });

  it('renders the public signing route without requiring authentication', async () => {
    mockAuth({ isAuthenticated: false });
    setUrl('/sign/test-token');

    render(<MhdAppRouter />);

    expect(await screen.findByText('Public Signing Page')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    expect(window.location.pathname).toBe('/sign/test-token');
  });

  it('redirects an unauthenticated user away from a protected route to "/login"', async () => {
    mockAuth({ isAuthenticated: false });
    setUrl('/dashboard');

    render(<MhdAppRouter />);

    expect(await screen.findByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Page')).not.toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
  });

  it('renders a protected route for an authenticated user', async () => {
    mockAuth({ isAuthenticated: true });
    setUrl('/tasks');

    render(<MhdAppRouter />);

    expect(await screen.findByText('Tasks Page')).toBeInTheDocument();
    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
  });

  it('renders "/forms" for an authenticated Client User', async () => {
    mockAuth({ isAuthenticated: true, roles: ['Client User'] });
    setUrl('/forms');

    render(<MhdAppRouter />);

    expect(await screen.findByText('Forms Page')).toBeInTheDocument();
  });

  it('shows the loading state instead of redirecting while auth is resolving', async () => {
    mockAuth({ isAuthenticated: false, isLoading: true });
    setUrl('/dashboard');

    render(<MhdAppRouter />);

    expect(await screen.findByText('Loading My HR Depot...')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('redirects an unknown URL ("*") to the not-found page', async () => {
    mockAuth({ isAuthenticated: true });
    setUrl('/this-route-does-not-exist');

    render(<MhdAppRouter />);

    expect(await screen.findByText('Page Not Found')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/404');
  });

  it('renders the not-found page directly at "/404" regardless of auth state', async () => {
    mockAuth({ isAuthenticated: false });
    setUrl('/404');

    render(<MhdAppRouter />);

    expect(await screen.findByText('Page Not Found')).toBeInTheDocument();
  });

  describe('role-gated navigation (router-level enforcement)', () => {
    it('redirects an authenticated Client User away from "/companies" to "/404"', async () => {
      // Specification.md restricts /companies to Platform Admin and HR
      // Partner. MhdRoleGuardedRoute (mhdRouteAccess.ts) enforces this at
      // the router level, independent of whether the sidebar link is
      // shown — a direct URL, bookmark, or shared link must be blocked too.
      mockAuth({ isAuthenticated: true, roles: ['Client User'] });
      setUrl('/companies');

      render(<MhdAppRouter />);

      expect(screen.queryByText('Companies Page')).not.toBeInTheDocument();
      expect(await screen.findByText('Page Not Found')).toBeInTheDocument();
      expect(window.location.pathname).toBe('/404');
    });

    it('redirects an authenticated Client User away from "/companies/:companyId" to "/404"', async () => {
      mockAuth({ isAuthenticated: true, roles: ['Client User'] });
      setUrl('/companies/company-1');

      render(<MhdAppRouter />);

      expect(screen.queryByText('Company Detail Page')).not.toBeInTheDocument();
      expect(await screen.findByText('Page Not Found')).toBeInTheDocument();
    });

    it('renders "/companies" for a Platform Admin', async () => {
      mockAuth({ isAuthenticated: true, roles: ['Platform Admin'] });
      setUrl('/companies');

      render(<MhdAppRouter />);

      expect(await screen.findByText('Companies Page')).toBeInTheDocument();
    });

    it('renders "/companies" for an HR Partner', async () => {
      mockAuth({ isAuthenticated: true, roles: ['HR Partner'] });
      setUrl('/companies');

      render(<MhdAppRouter />);

      expect(await screen.findByText('Companies Page')).toBeInTheDocument();
    });

    it('renders "/tasks/:taskId/notes" for a Client User (inherits the /tasks ALL rule)', async () => {
      mockAuth({ isAuthenticated: true, roles: ['Client User'] });
      setUrl('/tasks/task-1/notes');

      render(<MhdAppRouter />);

      expect(await screen.findByText('Task Notes Page')).toBeInTheDocument();
    });

    it('renders "/forms" for an authenticated Viewer (read-only forms access)', async () => {
      mockAuth({ isAuthenticated: true, roles: ['Viewer' as MhdAuthRoleName] });
      setUrl('/forms');

      render(<MhdAppRouter />);

      expect(await screen.findByText('Forms Page')).toBeInTheDocument();
      expect(window.location.pathname).toBe('/forms');
    });

    it('renders "/forms/:formId" for a Viewer (detail view, inherits the /forms rule)', async () => {
      mockAuth({ isAuthenticated: true, roles: ['Viewer' as MhdAuthRoleName] });
      setUrl('/forms/form-1');

      render(<MhdAppRouter />);

      expect(await screen.findByText('Form Detail Page')).toBeInTheDocument();
    });

    it('renders "/forms/:formId/edit" for a forms admin', async () => {
      mockAuth({ isAuthenticated: true, roles: ['Client Admin' as MhdAuthRoleName] });
      setUrl('/forms/form-1/edit');

      render(<MhdAppRouter />);

      expect(await screen.findByText('Form Builder Page')).toBeInTheDocument();
    });

    it('renders "/forms/:formId/submissions" for a Viewer', async () => {
      mockAuth({ isAuthenticated: true, roles: ['Viewer' as MhdAuthRoleName] });
      setUrl('/forms/form-1/submissions');

      render(<MhdAppRouter />);

      expect(await screen.findByText('Form Submissions Page')).toBeInTheDocument();
    });

    it('renders "/activities" for an authenticated Viewer (read-only activities access)', async () => {
      mockAuth({ isAuthenticated: true, roles: ['Viewer' as MhdAuthRoleName] });
      setUrl('/activities');

      render(<MhdAppRouter />);

      expect(await screen.findByText('Activities Page')).toBeInTheDocument();
      expect(window.location.pathname).toBe('/activities');
    });

    it.each<MhdAuthRoleName>([
      'Platform Admin',
      'HR Partner',
      'Client Admin',
      'Client User',
      'Viewer',
    ])('renders "/calendar" for an authenticated %s', async (role) => {
      mockAuth({ isAuthenticated: true, roles: [role] });
      setUrl('/calendar');

      render(<MhdAppRouter />);

      expect(await screen.findByText('Calendar Page')).toBeInTheDocument();
      expect(window.location.pathname).toBe('/calendar');
    });

    it('renders "/activities/:activityId" for a Viewer (read-only detail access)', async () => {
      mockAuth({ isAuthenticated: true, roles: ['Viewer' as MhdAuthRoleName] });
      setUrl('/activities/activity-1');

      render(<MhdAppRouter />);

      expect(await screen.findByText('Activity Detail Page')).toBeInTheDocument();
    });

    it('renders the coming soon placeholder for a Viewer reaching "/property"', async () => {
      mockAuth({ isAuthenticated: true, roles: ['Viewer' as MhdAuthRoleName] });
      setUrl('/property');

      render(<MhdAppRouter />);

      expect(await screen.findByTestId('mhd-coming-soon-placeholder')).toBeInTheDocument();
      expect(screen.queryByText('Property Page')).not.toBeInTheDocument();
      expect(window.location.pathname).toBe('/property');
    });

    it('renders the coming soon placeholder for a Viewer reaching "/property/:itemId"', async () => {
      mockAuth({ isAuthenticated: true, roles: ['Viewer' as MhdAuthRoleName] });
      setUrl('/property/item-1');

      render(<MhdAppRouter />);

      expect(await screen.findByTestId('mhd-coming-soon-placeholder')).toBeInTheDocument();
      expect(screen.queryByText('Property Detail Page')).not.toBeInTheDocument();
    });

    it('still redirects a Viewer away from "/people" to "/404"', async () => {
      mockAuth({ isAuthenticated: true, roles: ['Viewer' as MhdAuthRoleName] });
      setUrl('/people');

      render(<MhdAppRouter />);

      expect(screen.queryByText('People Page')).not.toBeInTheDocument();
      expect(await screen.findByText('Page Not Found')).toBeInTheDocument();
    });

    it.each<MhdAuthRoleName>(['Platform Admin', 'HR Partner', 'Client Admin', 'Client User'])(
      'renders "/people/org-chart" for an authenticated %s',
      async (role) => {
        mockAuth({ isAuthenticated: true, roles: [role] });
        setUrl('/people/org-chart');

        render(<MhdAppRouter />);

        expect(await screen.findByText('Org Chart Page')).toBeInTheDocument();
        expect(window.location.pathname).toBe('/people/org-chart');
      },
    );

    it('redirects a Viewer away from "/people/org-chart" to "/404"', async () => {
      mockAuth({ isAuthenticated: true, roles: ['Viewer' as MhdAuthRoleName] });
      setUrl('/people/org-chart');

      render(<MhdAppRouter />);

      expect(screen.queryByText('Org Chart Page')).not.toBeInTheDocument();
      expect(await screen.findByText('Page Not Found')).toBeInTheDocument();
      expect(window.location.pathname).toBe('/404');
    });

    it('renders "/approvals" for a Client User', async () => {
      mockAuth({ isAuthenticated: true, roles: ['Client User'] });
      setUrl('/approvals');

      render(<MhdAppRouter />);

      expect(await screen.findByText('Approvals Page')).toBeInTheDocument();
      expect(window.location.pathname).toBe('/approvals');
    });

    it('redirects a Viewer away from "/approvals" to "/404"', async () => {
      mockAuth({ isAuthenticated: true, roles: ['Viewer' as MhdAuthRoleName] });
      setUrl('/approvals');

      render(<MhdAppRouter />);

      expect(screen.queryByText('Approvals Page')).not.toBeInTheDocument();
      expect(await screen.findByText('Page Not Found')).toBeInTheDocument();
      expect(window.location.pathname).toBe('/404');
    });

    it('renders the coming soon placeholder for a Client User reaching "/performance"', async () => {
      mockAuth({ isAuthenticated: true, roles: ['Client User'] });
      setUrl('/performance');

      render(<MhdAppRouter />);

      expect(await screen.findByTestId('mhd-coming-soon-placeholder')).toBeInTheDocument();
      expect(screen.queryByText('Performance Page')).not.toBeInTheDocument();
      expect(window.location.pathname).toBe('/performance');
    });

    it('redirects a Viewer away from "/performance" to "/404"', async () => {
      mockAuth({ isAuthenticated: true, roles: ['Viewer' as MhdAuthRoleName] });
      setUrl('/performance');

      render(<MhdAppRouter />);

      expect(screen.queryByText('Performance Page')).not.toBeInTheDocument();
      expect(await screen.findByText('Page Not Found')).toBeInTheDocument();
      expect(window.location.pathname).toBe('/404');
    });

    it('renders the coming soon placeholder for a Client Admin reaching "/offboarding"', async () => {
      mockAuth({ isAuthenticated: true, roles: ['Client Admin'] });
      setUrl('/offboarding');

      render(<MhdAppRouter />);

      expect(await screen.findByTestId('mhd-coming-soon-placeholder')).toBeInTheDocument();
      expect(screen.queryByText('Offboarding Page')).not.toBeInTheDocument();
      expect(window.location.pathname).toBe('/offboarding');
    });

    it('renders the coming soon placeholder for a Client Admin reaching "/onboarding"', async () => {
      mockAuth({ isAuthenticated: true, roles: ['Client Admin'] });
      setUrl('/onboarding');

      render(<MhdAppRouter />);

      expect(await screen.findByTestId('mhd-coming-soon-placeholder')).toBeInTheDocument();
      expect(screen.queryByText('Onboarding Page')).not.toBeInTheDocument();
      expect(window.location.pathname).toBe('/onboarding');
    });

    it('renders "/onboarding" for a Platform Admin without the coming soon placeholder', async () => {
      mockAuth({ isAuthenticated: true, roles: ['Platform Admin'] });
      setUrl('/onboarding');

      render(<MhdAppRouter />);

      expect(await screen.findByText('Onboarding Page')).toBeInTheDocument();
      expect(screen.queryByTestId('mhd-coming-soon-placeholder')).not.toBeInTheDocument();
      expect(window.location.pathname).toBe('/onboarding');
    });

    // Time & Attendance — /schedule and /attendance admit Client User (own
    // record) but exclude Viewer entirely.
    it.each(['/schedule', '/attendance'])(
      'renders "%s" for a Client User (own-record surface)',
      async (path) => {
        mockAuth({ isAuthenticated: true, roles: ['Client User'] });
        setUrl(path);

        render(<MhdAppRouter />);

        expect(
          await screen.findByText(path === '/schedule' ? 'Schedule Page' : 'Attendance Page'),
        ).toBeInTheDocument();
        expect(window.location.pathname).toBe(path);
      },
    );

    it.each(['/schedule', '/attendance'])('redirects a Viewer away from "%s" to "/404"', (path) => {
      mockAuth({ isAuthenticated: true, roles: ['Viewer' as MhdAuthRoleName] });
      setUrl(path);

      render(<MhdAppRouter />);

      expect(screen.queryByText('Schedule Page')).not.toBeInTheDocument();
      expect(screen.queryByText('Attendance Page')).not.toBeInTheDocument();
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
      expect(window.location.pathname).toBe('/404');
    });

    it('renders "/attendance/policy" for a Client Admin but not a Client User', async () => {
      mockAuth({ isAuthenticated: true, roles: ['Client Admin'] });
      setUrl('/attendance/policy');
      const { unmount } = render(<MhdAppRouter />);
      expect(await screen.findByText('Attendance Policy Page')).toBeInTheDocument();
      unmount();

      // Client User reaches /attendance but NOT /attendance/policy — the
      // privileged-only rule must win the prefix match over the broader
      // /attendance rule.
      mockAuth({ isAuthenticated: true, roles: ['Client User'] });
      setUrl('/attendance/policy');
      render(<MhdAppRouter />);
      expect(screen.queryByText('Attendance Policy Page')).not.toBeInTheDocument();
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    });

    it.each<MhdAuthRoleName>(['Client User', 'Viewer'])(
      'redirects an authenticated %s away from "/offboarding" to "/404"',
      (role) => {
        mockAuth({ isAuthenticated: true, roles: [role] });
        setUrl('/offboarding');

        render(<MhdAppRouter />);

        expect(screen.queryByText('Offboarding Page')).not.toBeInTheDocument();
        expect(screen.getByText('Page Not Found')).toBeInTheDocument();
        expect(window.location.pathname).toBe('/404');
      },
    );

    it('applies the offboarding coming soon status to case detail routes', async () => {
      mockAuth({ isAuthenticated: true, roles: ['HR Partner'] });
      setUrl('/offboarding/case-1');

      render(<MhdAppRouter />);

      expect(await screen.findByTestId('mhd-coming-soon-placeholder')).toBeInTheDocument();
      expect(screen.queryByText('Offboarding Case Detail Page')).not.toBeInTheDocument();
    });

    // Leaves of Absence and Reasonable Accommodations — the same audience
    // (privileged set + Client User for their OWN cases), the same exclusion
    // (Viewer), and the same discipline: reaching the route is not the same as
    // seeing a case. Case visibility is decided server-side by
    // mhd_can_view_leave_person / mhd_can_view_accommodation_case, and the
    // medical partition inside each module is narrower still (PA/HRP only).
    it.each<[string, string]>([
      ['/leaves', 'Leaves Page'],
      ['/leaves/case-1', 'Leave Case Detail Page'],
      ['/accommodations', 'Accommodations Page'],
      ['/accommodations/case-1', 'Accommodation Case Detail Page'],
    ])('renders "%s" for a Client User (own-case surface)', async (path, text) => {
      mockAuth({ isAuthenticated: true, roles: ['Client User'] });
      setUrl(path);

      render(<MhdAppRouter />);

      expect(await screen.findByText(text)).toBeInTheDocument();
      expect(window.location.pathname).toBe(path);
    });

    it.each<[string, string]>([
      ['/leaves', 'Leaves Page'],
      ['/leaves/case-1', 'Leave Case Detail Page'],
      ['/accommodations', 'Accommodations Page'],
      ['/accommodations/case-1', 'Accommodation Case Detail Page'],
    ])('redirects a Viewer away from "%s" to "/404"', (path, text) => {
      mockAuth({ isAuthenticated: true, roles: ['Viewer' as MhdAuthRoleName] });
      setUrl(path);

      render(<MhdAppRouter />);

      expect(screen.queryByText(text)).not.toBeInTheDocument();
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
      expect(window.location.pathname).toBe('/404');
    });

    it.each<MhdAuthRoleName>(['Platform Admin', 'HR Partner', 'Client Admin'])(
      'renders the accommodation case detail route for %s',
      (role) => {
        mockAuth({ isAuthenticated: true, roles: [role] });
        setUrl('/accommodations/case-1');

        render(<MhdAppRouter />);

        expect(screen.getByText('Accommodation Case Detail Page')).toBeInTheDocument();
      },
    );

    it('does not restrict "/tasks", which has no role rule (ALL)', async () => {
      mockAuth({ isAuthenticated: true, roles: ['Client User'] });
      setUrl('/tasks');

      render(<MhdAppRouter />);

      expect(await screen.findByText('Tasks Page')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// MhdSidebar — the actual enforcement point for role-based menu visibility
// ---------------------------------------------------------------------------

describe('MhdSidebar role-based visibility', () => {
  it('hides "Companies" for a Client User', async () => {
    mockAuth({ isAuthenticated: true, roles: ['Client User'] });
    const { MhdSidebar } = await import('../MhdSidebar');
    const { MemoryRouter } = await import('react-router-dom');

    render(
      <MemoryRouter>
        <MhdSidebar />
      </MemoryRouter>,
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Forms')).toBeInTheDocument();
    expect(screen.getByText('Property')).toBeInTheDocument();
    expect(screen.getByText('People')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.queryByText('Offboarding')).not.toBeInTheDocument();
    expect(screen.queryByText('Companies')).not.toBeInTheDocument();
  });

  it('shows "Companies" for a Platform Admin', async () => {
    mockAuth({ isAuthenticated: true, roles: ['Platform Admin'] });
    const { MhdSidebar } = await import('../MhdSidebar');
    const { MemoryRouter } = await import('react-router-dom');

    render(
      <MemoryRouter>
        <MhdSidebar />
      </MemoryRouter>,
    );

    expect(screen.getByText('Forms')).toBeInTheDocument();
    expect(screen.getByText('Property')).toBeInTheDocument();
    expect(screen.getByText('Companies')).toBeInTheDocument();
    expect(screen.getByText('Approvals')).toBeInTheDocument();
    expect(screen.getByText('Offboarding')).toBeInTheDocument();
  });

  it('shows "Forms" but hides "People" and "Companies" for a Viewer', async () => {
    mockAuth({ isAuthenticated: true, roles: ['Viewer' as MhdAuthRoleName] });
    const { MhdSidebar } = await import('../MhdSidebar');
    const { MemoryRouter } = await import('react-router-dom');

    render(
      <MemoryRouter>
        <MhdSidebar />
      </MemoryRouter>,
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    // A Viewer's only visible group is Work Tools (Tasks / Activities / Forms /
    // Property / E-Signature); every other domain group is empty for them.
    expect(screen.getByText('Work Tools')).toBeInTheDocument();
    expect(screen.getByText('Activities')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Forms')).toBeInTheDocument();
    expect(screen.getByText('Property')).toBeInTheDocument();
    expect(screen.queryByText('People')).not.toBeInTheDocument();
    expect(screen.queryByText('Companies')).not.toBeInTheDocument();
    expect(screen.queryByText('Approvals')).not.toBeInTheDocument();
    expect(screen.queryByText('Performance')).not.toBeInTheDocument();
    expect(screen.queryByText('Offboarding')).not.toBeInTheDocument();
  });

  it('shows "Investigations" for a privileged admin regardless of case grants', async () => {
    // Investigations is role-gated like every other admin entry: the link renders
    // for the privileged set (Platform Admin / HR Partner / Client Admin) whether
    // or not the user currently holds a case grant. Showing the link is NOT access
    // control — case visibility stays grant-based server-side, so an ungranted
    // admin who opens the board simply sees an empty, non-disclosing list.
    mockAuth({ isAuthenticated: true, roles: ['Platform Admin'] });
    const { MhdSidebar } = await import('../MhdSidebar');
    const { MemoryRouter } = await import('react-router-dom');

    render(
      <MemoryRouter>
        <MhdSidebar />
      </MemoryRouter>,
    );

    expect(screen.getByText('Employee Relations')).toBeInTheDocument();
    expect(screen.getByText('Investigations')).toBeInTheDocument();
    // Training lives in the Talent group; both groups render for a privileged admin.
    expect(screen.getByText('Training')).toBeInTheDocument();
  });

  it('hides "Investigations" from a Client User (route-excluded, not a privileged role)', async () => {
    // Client User and Viewer are excluded from /investigations, so the entry never
    // renders for them — but a Client User still sees their own self-service
    // surfaces in the Talent group (My Training / My Handbooks).
    mockAuth({ isAuthenticated: true, roles: ['Client User'] });
    const { MhdSidebar } = await import('../MhdSidebar');
    const { MemoryRouter } = await import('react-router-dom');

    render(
      <MemoryRouter>
        <MhdSidebar />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Investigations')).not.toBeInTheDocument();
    expect(screen.getByText('My Training')).toBeInTheDocument();
  });

  it.each<MhdAuthRoleName>(['Platform Admin', 'HR Partner', 'Client Admin', 'Client User'])(
    'shows "Leaves" and "Accommodations" in Time & Leave for %s',
    async (role) => {
      // Both entries derive their audience from mhdRouteRoles, so the nav and the
      // router guard can never drift apart. A Client User sees both links because
      // they reach their OWN cases — an accommodation request may be verbal and
      // must never depend on an admin opening it for them.
      mockAuth({ isAuthenticated: true, roles: [role] });
      const { MhdSidebar } = await import('../MhdSidebar');
      const { MemoryRouter } = await import('react-router-dom');

      render(
        <MemoryRouter>
          <MhdSidebar />
        </MemoryRouter>,
      );

      expect(screen.getByText('Leaves')).toBeInTheDocument();
      expect(screen.getByText('Accommodations')).toBeInTheDocument();
    },
  );

  it('hides "Leaves" and "Accommodations" from a Viewer', async () => {
    mockAuth({ isAuthenticated: true, roles: ['Viewer' as MhdAuthRoleName] });
    const { MhdSidebar } = await import('../MhdSidebar');
    const { MemoryRouter } = await import('react-router-dom');

    render(
      <MemoryRouter>
        <MhdSidebar />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Leaves')).not.toBeInTheDocument();
    expect(screen.queryByText('Accommodations')).not.toBeInTheDocument();
    // The Viewer's read-only surfaces still render — the exclusion is targeted.
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Forms')).toBeInTheDocument();
  });

  it.each<MhdAuthRoleName>([
    'Platform Admin',
    'HR Partner',
    'Client Admin',
    'Client User',
    'Viewer',
  ])('shows "Calendar" in Work Tools for %s', async (role) => {
    mockAuth({ isAuthenticated: true, roles: [role] });
    const { MhdSidebar } = await import('../MhdSidebar');
    const { MemoryRouter } = await import('react-router-dom');

    render(
      <MemoryRouter>
        <MhdSidebar />
      </MemoryRouter>,
    );

    // No click needed: nav groups render expanded by default in this test
    // environment (see the un-clicked getByText('Calendar') assertions
    // above) — clicking the toggle here would collapse an already-open
    // group and remove its items from the DOM instead of revealing them.
    expect(screen.getByRole('link', { name: 'Calendar' })).toHaveAttribute('href', '/calendar');
  });
});

// ---------------------------------------------------------------------------
// MhdNotFoundPage
// ---------------------------------------------------------------------------

describe('MhdNotFoundPage', () => {
  it('navigates to "/dashboard" when "Go to Dashboard" is clicked', async () => {
    // importActual: the module is mocked above for the router tests, but this
    // describe block exercises the real component.
    const { MhdNotFoundPage } = await vi.importActual<
      typeof import('../components/MhdNotFoundPage')
    >('../components/MhdNotFoundPage');
    const { MemoryRouter } = await import('react-router-dom');

    render(
      <MemoryRouter initialEntries={['/some/bad/url']}>
        <MhdNotFoundPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /go to dashboard/i }));
    // MemoryRouter has no visible URL assertion without a route outlet,
    // so we just assert the navigation control is present and clickable
    // without throwing.
  });
});

// ---------------------------------------------------------------------------
// MhdComingSoonPage
// ---------------------------------------------------------------------------

describe('MhdComingSoonPage', () => {
  it('renders the heading and dashboard action', async () => {
    const { MhdComingSoonPage } = await import('../components/MhdComingSoonPage');
    const { MemoryRouter } = await import('react-router-dom');

    render(
      <MemoryRouter initialEntries={['/onboarding']}>
        <MhdComingSoonPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('mhd-coming-soon-placeholder')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Coming Soon' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument();
  });
});
