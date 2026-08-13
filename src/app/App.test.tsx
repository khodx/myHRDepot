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

// MhdProtectedRoute calls mhdSupabase.auth.mfa.getAuthenticatorAssuranceLevel()
// directly (not through useMhdAuth()). Left unmocked, that hits a REAL
// supabase-js GoTrueClient (see src/lib/supabase/supabaseClient.ts) pointed at
// the fake URL below — persistSession/autoRefreshToken are on, so the client
// runs its own internal _initialize() before the call resolves. That's fast
// and deterministic in isolation, but under this suite's full parallel run
// (100+ files, many workers) it occasionally took long enough to exceed
// Testing Library's default 1000ms findBy* timeout, flaking this test only
// under load — reproduced 2026-08-05. Mocking the client keeps this smoke
// test hermetic (same reasoning as mocking the dashboard hook below) and
// removes the real async client from the test entirely, rather than papering
// over the race with a longer timeout.
//
// MhdAuthProvider (still rendered in App's tree — mocking the Hook above
// doesn't remove the Provider itself) independently calls auth.getSession()
// and auth.onAuthStateChange() on mount, regardless of the Hook mock, so
// those need stubs too or the provider's own effect throws.
vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      mfa: {
        getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
          data: { currentLevel: 'aal2', nextLevel: 'aal2' },
          error: null,
        }),
      },
    },
  },
}));

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
      companyIsPlatformOrg: true,
      isAdmin: true,
      personId: 'person-1',
      displayName: 'Admin User',
      firstName: 'Admin',
      lastName: 'User',
      preferredName: null,
      roleNames: ['Platform Admin'],
      realIsAdmin: true,
      realRoleNames: ['Platform Admin'],
      impersonation: {
        isImpersonating: false,
        sessionId: null,
        role: null,
        companyId: null,
        companyName: null,
        startedAt: null,
      },
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
    // MhdDashboardPage is React.lazy()-loaded (see AppRouter.tsx); the
    // default 1000ms findBy* timeout is tight enough that this dynamic
    // import's resolution can exceed it under this suite's full parallel
    // run (100+ files across several workers), even though it resolves
    // comfortably fast standalone or under light load — reproduced
    // 2026-08-05. A longer timeout here is the correct fix for a real
    // Suspense/lazy-chunk boundary, not a timing race to paper over.
    // The dashboard's title was replaced by a time-of-day greeting banner
    // (see MhdDashboardGreetingBanner) — assert on its "Good <time>, Admin!"
    // heading instead of a literal "Dashboard" title.
    expect(
      await screen.findByRole('heading', { name: /^good (morning|afternoon|evening), admin!$/i }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/dashboard');
  });
});
