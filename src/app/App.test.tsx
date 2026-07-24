import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '@/app/App';

vi.mock('@/config/env', () => ({
  runtimeEnv: {
    VITE_APP_NAME: 'My HR Depot',
    VITE_APP_ENV: 'test',
    VITE_SUPABASE_URL: 'https://example.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}));

// The app shell (sidebar/topbar) and MhdProtectedRoute read useMhdAuth()
// directly. Mocking the hook (not the provider) keeps this a foundation-shell
// smoke test rather than an auth integration test — see the authentication
// feature's own tests for real auth-flow coverage.
vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({
    isLoading: false,
    isAuthenticated: true,
    userEmail: 'admin@example.com',
    authUserId: 'test-user-id',
    profile: {
      userId: 'test-user-id',
      email: 'admin@example.com',
      companyId: 'company-1',
      companyName: 'Acme Co',
      isAdmin: true,
      personId: 'person-1',
      displayName: 'Admin User',
      firstName: 'Admin',
      lastName: 'User',
      roleNames: ['Platform Admin'],
    },
    roles: ['Platform Admin'],
    refreshProfile: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    sendPasswordReset: vi.fn(),
    updatePassword: vi.fn(),
  }),
}));

// Keep the smoke test hermetic — the dashboard page otherwise fires Supabase
// RPCs on mount.
vi.mock('@/features/dashboard/Hook', () => ({
  useMhdDashboard: () => ({
    isLoading: false,
    error: null,
    taskSummary: null,
    myTasks: [],
    recentActivity: [],
    lastRefreshed: null,
    refetch: vi.fn(),
  }),
}));

describe('App foundation', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('renders the app shell and redirects "/" to the dashboard', () => {
    render(<App />);

    // Rail wordmark + company card, top bar identity, and the dashboard page
    // all render. ("myHRDepot" is the category-spec wordmark.)
    expect(screen.getByText('myHRDepot')).toBeInTheDocument();
    expect(screen.getByText('Acme Co')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/dashboard');
  });
});
