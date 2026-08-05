import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
});
