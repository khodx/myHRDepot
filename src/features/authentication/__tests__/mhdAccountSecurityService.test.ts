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
  mhdConsumeMfaRecoveryCode,
  mhdCountUnusedRecoveryCodes,
  mhdGenerateMfaRecoveryCodes,
  mhdListTrustedDevices,
  mhdRevokeTrustedDevice,
} from '../Service';

describe('mhdAccountSecurityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists trusted devices and maps snake_case fields', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: [
        {
          id: 'device-1',
          label: 'Chrome on Windows',
          first_seen_at: '2026-08-01T10:00:00Z',
          last_seen_at: '2026-08-04T10:00:00Z',
          revoked_at: null,
        },
        {
          id: 'device-2',
          label: null,
          first_seen_at: '2026-07-01T10:00:00Z',
          last_seen_at: '2026-07-02T10:00:00Z',
          revoked_at: '2026-07-03T10:00:00Z',
        },
      ],
      error: null,
    });

    const result = await mhdListTrustedDevices();

    expect(mockSupabase.rpc).toHaveBeenCalledWith('mhd_list_trusted_devices');
    expect(result).toEqual([
      {
        id: 'device-1',
        label: 'Chrome on Windows',
        firstSeenAt: '2026-08-01T10:00:00Z',
        lastSeenAt: '2026-08-04T10:00:00Z',
        revokedAt: null,
      },
      {
        id: 'device-2',
        label: null,
        firstSeenAt: '2026-07-01T10:00:00Z',
        lastSeenAt: '2026-07-02T10:00:00Z',
        revokedAt: '2026-07-03T10:00:00Z',
      },
    ]);
  });

  it('revokes a trusted device', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: null,
      error: null,
    });

    await mhdRevokeTrustedDevice('device-id');

    expect(mockSupabase.rpc).toHaveBeenCalledWith('mhd_revoke_trusted_device', {
      p_device_id: 'device-id',
    });
  });

  it('generates MFA recovery codes', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: ['code-1', 'code-2'],
      error: null,
    });

    const result = await mhdGenerateMfaRecoveryCodes();

    expect(mockSupabase.rpc).toHaveBeenCalledWith('mhd_generate_mfa_recovery_codes');
    expect(result).toEqual(['code-1', 'code-2']);
  });

  it('counts unused MFA recovery codes', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: 8,
      error: null,
    });

    const result = await mhdCountUnusedRecoveryCodes();

    expect(mockSupabase.rpc).toHaveBeenCalledWith('mhd_count_unused_recovery_codes');
    expect(result).toBe(8);
  });

  it('consumes an MFA recovery code', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: null,
      error: null,
    });

    await mhdConsumeMfaRecoveryCode('recovery-code');

    expect(mockSupabase.rpc).toHaveBeenCalledWith('mhd_consume_mfa_recovery_code', {
      p_code: 'recovery-code',
    });
  });
});
