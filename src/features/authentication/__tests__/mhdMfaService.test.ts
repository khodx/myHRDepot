import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    auth: {
      mfa: {
        enroll: vi.fn(),
        challengeAndVerify: vi.fn(),
        listFactors: vi.fn(),
        unenroll: vi.fn(),
      },
    },
  },
}));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: mockSupabase,
}));

import {
  mhdEnrollTotpFactor,
  mhdListMfaFactors,
  mhdUnenrollMfaFactor,
  mhdVerifyTotpFactor,
} from '../Service';

describe('mhdMfaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enrolls a TOTP factor and maps the response', async () => {
    mockSupabase.auth.mfa.enroll.mockResolvedValue({
      data: {
        id: 'factor-id',
        totp: {
          qr_code: '<svg />',
          secret: 'SECRET123',
          uri: 'otpauth://totp/MyHRDepot',
        },
      },
      error: null,
    });

    const result = await mhdEnrollTotpFactor();

    expect(mockSupabase.auth.mfa.enroll).toHaveBeenCalledWith({ factorType: 'totp' });
    expect(result).toEqual({
      factorId: 'factor-id',
      qrCodeSvg: '<svg />',
      secret: 'SECRET123',
    });
  });

  it('verifies a TOTP factor', async () => {
    mockSupabase.auth.mfa.challengeAndVerify.mockResolvedValue({
      data: {},
      error: null,
    });

    await mhdVerifyTotpFactor('factor-id', '123456');

    expect(mockSupabase.auth.mfa.challengeAndVerify).toHaveBeenCalledWith({
      factorId: 'factor-id',
      code: '123456',
    });
  });

  it('lists MFA factors and maps snake_case fields', async () => {
    mockSupabase.auth.mfa.listFactors.mockResolvedValue({
      data: {
        totp: [
          {
            id: 'verified-factor',
            status: 'verified',
            friendly_name: 'Authenticator',
          },
          {
            id: 'unverified-factor',
            status: 'unverified',
            friendly_name: null,
          },
        ],
      },
      error: null,
    });

    const result = await mhdListMfaFactors();

    expect(mockSupabase.auth.mfa.listFactors).toHaveBeenCalledWith();
    expect(result).toEqual([
      {
        id: 'verified-factor',
        status: 'verified',
        friendlyName: 'Authenticator',
      },
      {
        id: 'unverified-factor',
        status: 'unverified',
        friendlyName: null,
      },
    ]);
  });

  it('unenrolls an MFA factor', async () => {
    mockSupabase.auth.mfa.unenroll.mockResolvedValue({
      data: {},
      error: null,
    });

    await mhdUnenrollMfaFactor('factor-id');

    expect(mockSupabase.auth.mfa.unenroll).toHaveBeenCalledWith({ factorId: 'factor-id' });
  });
});
