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
    rpc: vi.fn(),
  },
}));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: mockSupabase,
}));

import {
  mhdEnrollTotpFactor,
  mhdListMfaFactors,
  mhdRegisterTrustedDevice,
  mhdUnenrollMfaFactor,
  mhdVerifyTotpFactor,
} from '../Service';

describe('mhdMfaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enrolls a TOTP factor and maps the response', async () => {
    mockSupabase.auth.mfa.listFactors.mockResolvedValue({ data: { totp: [] }, error: null });
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

  it('clears a stale unverified TOTP factor before enrolling a new one', async () => {
    mockSupabase.auth.mfa.listFactors.mockResolvedValue({
      data: {
        totp: [{ id: 'verified-factor', status: 'verified', friendly_name: 'Authenticator' }],
        all: [
          { id: 'abandoned-factor', factor_type: 'totp', status: 'unverified', friendly_name: null },
          { id: 'verified-factor', factor_type: 'totp', status: 'verified', friendly_name: 'Authenticator' },
        ],
      },
      error: null,
    });
    mockSupabase.auth.mfa.unenroll.mockResolvedValue({ data: {}, error: null });
    mockSupabase.auth.mfa.enroll.mockResolvedValue({
      data: {
        id: 'new-factor-id',
        totp: { qr_code: '<svg />', secret: 'SECRET456', uri: 'otpauth://totp/MyHRDepot' },
      },
      error: null,
    });

    const result = await mhdEnrollTotpFactor();

    // Only the abandoned UNVERIFIED factor is cleared — an already-verified
    // factor is a real completed enrollment and must never be touched here.
    expect(mockSupabase.auth.mfa.unenroll).toHaveBeenCalledTimes(1);
    expect(mockSupabase.auth.mfa.unenroll).toHaveBeenCalledWith({ factorId: 'abandoned-factor' });
    expect(result.factorId).toBe('new-factor-id');
  });

  it('coalesces overlapping enroll calls onto a single request', async () => {
    mockSupabase.auth.mfa.listFactors.mockResolvedValue({ data: { totp: [] }, error: null });
    let resolveEnroll: (value: unknown) => void = () => {};
    mockSupabase.auth.mfa.enroll.mockReturnValue(
      new Promise((resolve) => {
        resolveEnroll = resolve;
      }),
    );

    const first = mhdEnrollTotpFactor();
    const second = mhdEnrollTotpFactor();

    resolveEnroll({
      data: {
        id: 'shared-factor-id',
        totp: { qr_code: '<svg />', secret: 'SHARED123', uri: 'otpauth://totp/MyHRDepot' },
      },
      error: null,
    });

    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(mockSupabase.auth.mfa.enroll).toHaveBeenCalledTimes(1);
    expect(firstResult).toEqual(secondResult);
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

  it('registers a trusted device with a generated browser token and label', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: 'trusted-device-id',
      error: null,
    });

    await mhdRegisterTrustedDevice('Chrome on Windows');

    expect(mockSupabase.rpc).toHaveBeenCalledWith('mhd_register_trusted_device', {
      p_device_token: expect.any(String),
      p_label: 'Chrome on Windows',
    });
  });

  it('wraps trusted device RPC errors', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: null,
      error: { message: 'RPC failed' },
    });

    await expect(mhdRegisterTrustedDevice('Chrome on Windows')).rejects.toThrow(
      'Unable to register trusted device: RPC failed',
    );
  });
});
