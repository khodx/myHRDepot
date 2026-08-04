import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOtp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: mockSupabase,
}));

import { appConfig } from '@/config/appConfig';
import {
  mhdGetCurrentAuthSession,
  mhdSignInWithMagicLink,
  mhdSignInWithPassword,
} from '../Service';

describe('mhdAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the current session', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'auth-user-id', email: 'admin@example.com' } } },
      error: null,
    });

    const result = await mhdGetCurrentAuthSession();
    expect(result.user?.id).toBe('auth-user-id');
  });

  it('signs in with email and password', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { session: { access_token: 'token' }, user: { id: 'auth-user-id' } },
      error: null,
    });

    await mhdSignInWithPassword({ email: 'admin@example.com', password: 'Password123!' });

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'Password123!',
    });
  });

  it('sends a magic link sign-in email', async () => {
    const emailRedirectTo = `${appConfig.appUrl.replace(/\/$/, '')}/`;

    mockSupabase.auth.signInWithOtp.mockResolvedValue({
      data: {},
      error: null,
    });

    await mhdSignInWithMagicLink({ email: 'admin@example.com' });

    expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'admin@example.com',
      options: { emailRedirectTo },
    });
  });
});
