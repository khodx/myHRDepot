import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '@/app/App';

vi.mock('@/config/env', () => ({
  runtimeEnv: {
    VITE_APP_NAME: 'My HR Depot',
    VITE_APP_ENV: 'test',
    VITE_SUPABASE_URL: 'https://example.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}));

// HomePage now sits behind MhdProtectedRoute and reads useMhdAuth() directly.
// Mocking the hook (not the provider) keeps this a foundation-shell smoke test
// rather than an auth integration test — see 03.1 - Authentication's own Tests/
// for real auth-flow coverage.
vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({
    isLoading: false,
    isAuthenticated: true,
    userEmail: 'admin@example.com',
    authUserId: 'test-user-id',
    profile: null,
    roles: [],
    refreshProfile: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    sendPasswordReset: vi.fn(),
    updatePassword: vi.fn(),
  }),
}));

describe('App foundation', () => {
  it('renders the enterprise foundation landing content', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /my hr depot/i })).toBeInTheDocument();
    expect(screen.getByText(/task management mvp foundation/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /foundation ready/i })).toBeInTheDocument();
  });
});
