import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '@/app/App';

// Hoisted so the mock factory below returns the SAME function reference on
// every call. MhdProtectedRoute's mfaGate effect depends on `listMfaFactors`
// by identity — a fresh vi.fn() per render (as an inline arrow-function
// mock would produce) reruns the effect every render, which sets state,
// which re-renders, which reruns the effect again: an infinite loop that
// exhausts the test worker's heap instead of failing cleanly.
const mockListMfaFactors = vi.hoisted(() =>
  vi.fn().mockResolvedValue([{ id: 'factor-1', status: 'verified', friendlyName: 'Authenticator' }]),
);

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
    // MhdProtectedRoute's MFA gate calls this on mount; a verified factor
    // keeps this smoke test on /dashboard instead of redirecting to
    // /enroll-mfa. See MhdProtectedRoute.tsx's mfaGate effect.
    listMfaFactors: mockListMfaFactors,
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

  it('renders the app shell and redirects "/" to the dashboard', async () => {
    render(<App />);

    // Rail wordmark + company card, top bar identity, and the dashboard page
    // all render. ("myHRDepot" is the category-spec wordmark.)
    expect(await screen.findByText('myHRDepot')).toBeInTheDocument();
    expect(screen.getByText('Acme Co')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/dashboard');
  });
});
