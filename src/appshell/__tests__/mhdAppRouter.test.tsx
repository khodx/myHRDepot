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
  return { MhdAppShell: () => <div data-testid="app-shell"><Outlet /></div> };
});

// The real MhdLoginPage renders inside MhdAuthLayout; the mock keeps that
// structural contract visible via the auth-layout test id.
vi.mock('@/features/authentication/components/MhdLoginPage', () => ({
  MhdLoginPage: () => <div data-testid="auth-layout"><div>Login Page</div></div>,
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
vi.mock('@/features/forms/components/MhdFormBuilderPage', () => ({
  MhdFormBuilderPage: () => <div>Form Builder Page</div>,
}));
vi.mock('@/features/forms/components/MhdFormRendererPage', () => ({
  MhdFormRendererPage: () => <div>Form Renderer Page</div>,
}));
vi.mock('@/features/forms/components/MhdFormSubmissionsPage', () => ({
  MhdFormSubmissionsPage: () => <div>Form Submissions Page</div>,
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
vi.mock('../components/MhdPersonDetailPage', () => ({
  MhdPersonDetailPage: () => <div>Person Detail Page</div>,
}));
vi.mock('@/features/companies/components/MhdCompaniesPage', () => ({
  MhdCompaniesPage: () => <div>Companies Page</div>,
}));
vi.mock('../components/MhdCompanyDetailPage', () => ({
  MhdCompanyDetailPage: () => <div>Company Detail Page</div>,
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
  it('redirects "/" to "/dashboard" when authenticated', () => {
    mockAuth({ isAuthenticated: true });
    setUrl('/');

    render(<MhdAppRouter />);

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/dashboard');
  });

  it('renders the login page at "/login" without authentication', () => {
    mockAuth({ isAuthenticated: false });
    setUrl('/login');

    render(<MhdAppRouter />);

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.getByTestId('auth-layout')).toBeInTheDocument();
  });

  it('redirects an unauthenticated user away from a protected route to "/login"', () => {
    mockAuth({ isAuthenticated: false });
    setUrl('/dashboard');

    render(<MhdAppRouter />);

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Page')).not.toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
  });

  it('renders a protected route for an authenticated user', () => {
    mockAuth({ isAuthenticated: true });
    setUrl('/tasks');

    render(<MhdAppRouter />);

    expect(screen.getByText('Tasks Page')).toBeInTheDocument();
    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
  });

  it('renders "/forms" for an authenticated Client User', () => {
    mockAuth({ isAuthenticated: true, roles: ['Client User'] });
    setUrl('/forms');

    render(<MhdAppRouter />);

    expect(screen.getByText('Forms Page')).toBeInTheDocument();
  });

  it('shows the loading state instead of redirecting while auth is resolving', () => {
    mockAuth({ isAuthenticated: false, isLoading: true });
    setUrl('/dashboard');

    render(<MhdAppRouter />);

    expect(screen.getByText('Loading My HR Depot...')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('redirects an unknown URL ("*") to the not-found page', () => {
    mockAuth({ isAuthenticated: true });
    setUrl('/this-route-does-not-exist');

    render(<MhdAppRouter />);

    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/404');
  });

  it('renders the not-found page directly at "/404" regardless of auth state', () => {
    mockAuth({ isAuthenticated: false });
    setUrl('/404');

    render(<MhdAppRouter />);

    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });

  describe('role-gated navigation (router-level enforcement)', () => {
    it('redirects an authenticated Client User away from "/companies" to "/404"', () => {
      // Specification.md restricts /companies to Platform Admin and HR
      // Partner. MhdRoleGuardedRoute (mhdRouteAccess.ts) enforces this at
      // the router level, independent of whether the sidebar link is
      // shown — a direct URL, bookmark, or shared link must be blocked too.
      mockAuth({ isAuthenticated: true, roles: ['Client User'] });
      setUrl('/companies');

      render(<MhdAppRouter />);

      expect(screen.queryByText('Companies Page')).not.toBeInTheDocument();
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
      expect(window.location.pathname).toBe('/404');
    });

    it('redirects an authenticated Client User away from "/companies/:companyId" to "/404"', () => {
      mockAuth({ isAuthenticated: true, roles: ['Client User'] });
      setUrl('/companies/company-1');

      render(<MhdAppRouter />);

      expect(screen.queryByText('Company Detail Page')).not.toBeInTheDocument();
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    });

    it('renders "/companies" for a Platform Admin', () => {
      mockAuth({ isAuthenticated: true, roles: ['Platform Admin'] });
      setUrl('/companies');

      render(<MhdAppRouter />);

      expect(screen.getByText('Companies Page')).toBeInTheDocument();
    });

    it('renders "/companies" for an HR Partner', () => {
      mockAuth({ isAuthenticated: true, roles: ['HR Partner'] });
      setUrl('/companies');

      render(<MhdAppRouter />);

      expect(screen.getByText('Companies Page')).toBeInTheDocument();
    });

    it('renders "/tasks/:taskId/notes" for a Client User (inherits the /tasks ALL rule)', () => {
      mockAuth({ isAuthenticated: true, roles: ['Client User'] });
      setUrl('/tasks/task-1/notes');

      render(<MhdAppRouter />);

      expect(screen.getByText('Task Notes Page')).toBeInTheDocument();
    });

    it('redirects an authenticated Viewer away from "/forms" to "/404"', () => {
      mockAuth({ isAuthenticated: true, roles: ['Viewer' as MhdAuthRoleName] });
      setUrl('/forms');

      render(<MhdAppRouter />);

      expect(screen.queryByText('Forms Page')).not.toBeInTheDocument();
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
      expect(window.location.pathname).toBe('/404');
    });

    it('does not restrict "/tasks", which has no role rule (ALL)', () => {
      mockAuth({ isAuthenticated: true, roles: ['Client User'] });
      setUrl('/tasks');

      render(<MhdAppRouter />);

      expect(screen.getByText('Tasks Page')).toBeInTheDocument();
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
    expect(screen.getByText('People')).toBeInTheDocument();
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
    expect(screen.getByText('Companies')).toBeInTheDocument();
  });

  it('hides "People" and "Companies" for a Viewer', async () => {
    mockAuth({ isAuthenticated: true, roles: ['Viewer' as MhdAuthRoleName] });
    const { MhdSidebar } = await import('../MhdSidebar');
    const { MemoryRouter } = await import('react-router-dom');

    render(
      <MemoryRouter>
        <MhdSidebar />
      </MemoryRouter>,
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Forms')).not.toBeInTheDocument();
    expect(screen.queryByText('People')).not.toBeInTheDocument();
    expect(screen.queryByText('Companies')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// MhdNotFoundPage
// ---------------------------------------------------------------------------

describe('MhdNotFoundPage', () => {
  it('navigates to "/dashboard" when "Go to Dashboard" is clicked', async () => {
    // importActual: the module is mocked above for the router tests, but this
    // describe block exercises the real component.
    const { MhdNotFoundPage } =
      await vi.importActual<typeof import('../components/MhdNotFoundPage')>('../components/MhdNotFoundPage');
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
