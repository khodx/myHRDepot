import { useEffect, useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Link, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { MhdProtectedRoute } from '../components/MhdProtectedRoute';
import type { MhdMfaFactor } from '../Types';

const { mockSupabase, mockUseMhdAuth } = vi.hoisted(() => ({
  mockSupabase: {
    auth: {
      mfa: {
        getAuthenticatorAssuranceLevel: vi.fn(),
      },
    },
  },
  mockUseMhdAuth: vi.fn(),
}));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: mockSupabase,
}));

vi.mock('../Hook', () => ({
  useMhdAuth: () => mockUseMhdAuth(),
}));

const mockListMfaFactors = vi.fn<() => Promise<MhdMfaFactor[]>>();

function profileWithPerson(personId: string | null = 'person-1') {
  return { personId };
}

function mockAuth({
  isAuthenticated = true,
  isLoading = false,
  personId = 'person-1',
  listMfaFactors = mockListMfaFactors,
}: {
  isAuthenticated?: boolean;
  isLoading?: boolean;
  personId?: string | null;
  listMfaFactors?: () => Promise<MhdMfaFactor[]>;
} = {}) {
  mockUseMhdAuth.mockReturnValue({
    isAuthenticated,
    isLoading,
    profile: isAuthenticated ? profileWithPerson(personId) : null,
    listMfaFactors,
  });
}

function mockSatisfiedMfa() {
  mockListMfaFactors.mockResolvedValue([
    { id: 'f1', status: 'verified', friendlyName: 'Authenticator' },
  ]);
  mockSupabase.auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
    data: { currentLevel: 'aal2', nextLevel: 'aal2' },
    error: null,
  });
}

function MfaChallengeProbe() {
  const location = useLocation();
  const from = location.state?.from?.pathname ?? 'missing';

  return (
    <div>
      <div>MFA challenge page</div>
      <div>Challenge from: {from}</div>
    </div>
  );
}

function OrdinaryOne() {
  return (
    <div>
      <div>Ordinary one page</div>
      <Link to="/ordinary-two">Go to ordinary two</Link>
    </div>
  );
}

function renderProtectedRoute(initialEntries: string[] = ['/dashboard']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={<MhdProtectedRoute />}>
          <Route index element={<div>Protected content</div>} />
          <Route path="dashboard" element={<div>Dashboard page</div>} />
          <Route path="complete-profile" element={<div>Complete profile page</div>} />
          <Route path="enroll-mfa" element={<div>Enroll MFA page</div>} />
          <Route path="mfa-challenge" element={<MfaChallengeProbe />} />
          <Route path="ordinary-one" element={<OrdinaryOne />} />
          <Route path="ordinary-two" element={<div>Ordinary two page</div>} />
        </Route>
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('MhdProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListMfaFactors.mockResolvedValue([]);
    mockSupabase.auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal1' },
      error: null,
    });
    // Every test below verifies real enforcement behavior and must hold as
    // if in production — Vitest's default test mode otherwise leaves
    // import.meta.env.DEV true, which would silently make the app-entry
    // redirects below (the ones this suite exists to check) never fire.
    // The 2026-08-16 dev-only-relaxation describe block further down
    // overrides this per test.
    vi.stubEnv('DEV', false);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders only the loading state while authentication is loading', () => {
    mockAuth({ isAuthenticated: false, isLoading: true });

    renderProtectedRoute();

    expect(screen.getByText('Loading My HR Depot...')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated accounts to login', async () => {
    mockAuth({ isAuthenticated: false });

    renderProtectedRoute();

    expect(await screen.findByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard page')).not.toBeInTheDocument();
  });

  it('redirects authenticated accounts with no linked person to complete profile', async () => {
    mockAuth({ personId: null });

    renderProtectedRoute(['/dashboard']);

    expect(await screen.findByText('Complete profile page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard page')).not.toBeInTheDocument();
  });

  it('redirects linked accounts away from complete profile to dashboard', async () => {
    mockAuth();
    mockSatisfiedMfa();

    renderProtectedRoute(['/complete-profile']);

    expect(await screen.findByText('Dashboard page')).toBeInTheDocument();
    expect(screen.queryByText('Complete profile page')).not.toBeInTheDocument();
  });

  it('redirects linked accounts with zero verified MFA factors to enrollment', async () => {
    mockAuth();
    mockListMfaFactors.mockResolvedValue([]);
    mockSupabase.auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal1' },
      error: null,
    });

    renderProtectedRoute(['/dashboard']);

    expect(await screen.findByText('Enroll MFA page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard page')).not.toBeInTheDocument();
  });

  it('redirects accounts with a verified factor but aal1 session to MFA challenge with from state', async () => {
    mockAuth();
    mockListMfaFactors.mockResolvedValue([
      { id: 'f1', status: 'verified', friendlyName: 'Authenticator' },
    ]);
    mockSupabase.auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal2' },
      error: null,
    });

    renderProtectedRoute(['/dashboard']);

    expect(await screen.findByText('MFA challenge page')).toBeInTheDocument();
    expect(screen.getByText('Challenge from: /dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard page')).not.toBeInTheDocument();
  });

  it('renders protected content when MFA is fully satisfied', async () => {
    mockAuth();
    mockSatisfiedMfa();

    renderProtectedRoute(['/']);

    expect(await screen.findByText('Protected content')).toBeInTheDocument();
    expect(screen.queryByText('Enroll MFA page')).not.toBeInTheDocument();
    expect(screen.queryByText('MFA challenge page')).not.toBeInTheDocument();
  });

  it.each(['/enroll-mfa', '/mfa-challenge'])(
    'redirects fully satisfied accounts away from "%s" to dashboard',
    async (path) => {
      mockAuth();
      mockSatisfiedMfa();

      renderProtectedRoute([path]);

      expect(await screen.findByText('Dashboard page')).toBeInTheDocument();
      expect(screen.queryByText('Enroll MFA page')).not.toBeInTheDocument();
      expect(screen.queryByText('MFA challenge page')).not.toBeInTheDocument();
    },
  );

  it('renders the MFA status error when factor loading fails', async () => {
    mockAuth();
    mockListMfaFactors.mockRejectedValue(new Error('Unable to load MFA factors.'));

    renderProtectedRoute(['/dashboard']);

    expect(await screen.findByText('Unable to load MFA factors.')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard page')).not.toBeInTheDocument();
    expect(screen.queryByText('Enroll MFA page')).not.toBeInTheDocument();
  });

  it('renders the MFA status error when assurance level loading fails', async () => {
    mockAuth();
    mockListMfaFactors.mockResolvedValue([
      { id: 'f1', status: 'verified', friendlyName: 'Authenticator' },
    ]);
    mockSupabase.auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: null,
      error: new Error('Unable to verify MFA status.'),
    });

    renderProtectedRoute(['/dashboard']);

    expect(await screen.findByText('Unable to verify MFA status.')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard page')).not.toBeInTheDocument();
    expect(screen.queryByText('MFA challenge page')).not.toBeInTheDocument();
  });

  it('does not re-check MFA when navigating between ordinary already-satisfied pages', async () => {
    mockAuth();
    mockSatisfiedMfa();

    renderProtectedRoute(['/ordinary-one']);

    expect(await screen.findByText('Ordinary one page')).toBeInTheDocument();
    expect(mockListMfaFactors).toHaveBeenCalledTimes(1);
    expect(mockSupabase.auth.mfa.getAuthenticatorAssuranceLevel).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('link', { name: /go to ordinary two/i }));

    expect(await screen.findByText('Ordinary two page')).toBeInTheDocument();
    expect(mockListMfaFactors).toHaveBeenCalledTimes(1);
    expect(mockSupabase.auth.mfa.getAuthenticatorAssuranceLevel).toHaveBeenCalledTimes(1);
  });

  it('does not flash through /enroll-mfa while auth is still resolving on a fresh load', async () => {
    // Reproduces the real MhdAuthProvider sequence a hard page load goes
    // through — isAuthenticated/profile start false/null and flip to
    // true/populated a tick later — which a static mockAuth() never
    // exercises. Regression coverage for the mfaGate effect briefly settling
    // to "no verified factor" on the transient unauthenticated render.
    mockSatisfiedMfa();

    function MhdAuthTransitionHarness() {
      const [resolved, setResolved] = useState(false);

      useEffect(() => {
        const timer = setTimeout(() => setResolved(true), 0);
        return () => clearTimeout(timer);
      }, []);

      mockUseMhdAuth.mockReturnValue(
        resolved
          ? {
              isAuthenticated: true,
              isLoading: false,
              profile: profileWithPerson('person-1'),
              listMfaFactors: mockListMfaFactors,
            }
          : { isAuthenticated: false, isLoading: true, profile: null, listMfaFactors: mockListMfaFactors },
      );

      return (
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/" element={<MhdProtectedRoute />}>
              <Route path="dashboard" element={<div>Dashboard page</div>} />
              <Route path="enroll-mfa" element={<div>Enroll MFA page</div>} />
            </Route>
            <Route path="/login" element={<div>Login page</div>} />
          </Routes>
        </MemoryRouter>
      );
    }

    render(<MhdAuthTransitionHarness />);

    expect(await screen.findByText('Dashboard page')).toBeInTheDocument();
    expect(screen.queryByText('Enroll MFA page')).not.toBeInTheDocument();
  });

  describe('2026-08-16 dev-build-only app-entry relaxation', () => {
    it('DEV=true: an account with no verified factor reaches the app instead of enrollment', async () => {
      vi.stubEnv('DEV', true);
      mockAuth();
      mockListMfaFactors.mockResolvedValue([]);
      mockSupabase.auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
        data: { currentLevel: 'aal1', nextLevel: 'aal1' },
        error: null,
      });

      renderProtectedRoute(['/dashboard']);

      expect(await screen.findByText('Dashboard page')).toBeInTheDocument();
      expect(screen.queryByText('Enroll MFA page')).not.toBeInTheDocument();
    });

    it('DEV=true: an account with a verified factor but an aal1 session reaches the app instead of the challenge', async () => {
      vi.stubEnv('DEV', true);
      mockAuth();
      mockListMfaFactors.mockResolvedValue([
        { id: 'f1', status: 'verified', friendlyName: 'Authenticator' },
      ]);
      mockSupabase.auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
        data: { currentLevel: 'aal1', nextLevel: 'aal2' },
        error: null,
      });

      renderProtectedRoute(['/dashboard']);

      expect(await screen.findByText('Dashboard page')).toBeInTheDocument();
      expect(screen.queryByText('MFA challenge page')).not.toBeInTheDocument();
    });

    it('DEV=false: the same unenrolled account still redirects to enrollment (the relaxation is genuinely gated, not accidentally unconditional)', async () => {
      vi.stubEnv('DEV', false);
      mockAuth();
      mockListMfaFactors.mockResolvedValue([]);
      mockSupabase.auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
        data: { currentLevel: 'aal1', nextLevel: 'aal1' },
        error: null,
      });

      renderProtectedRoute(['/dashboard']);

      expect(await screen.findByText('Enroll MFA page')).toBeInTheDocument();
      expect(screen.queryByText('Dashboard page')).not.toBeInTheDocument();
    });

    it('DEV=true: an account that already fully satisfies MFA is unaffected (still no bypass of already-verified state)', async () => {
      vi.stubEnv('DEV', true);
      mockAuth();
      mockSatisfiedMfa();

      renderProtectedRoute(['/']);

      expect(await screen.findByText('Protected content')).toBeInTheDocument();
      expect(screen.queryByText('Enroll MFA page')).not.toBeInTheDocument();
      expect(screen.queryByText('MFA challenge page')).not.toBeInTheDocument();
    });
  });
});
