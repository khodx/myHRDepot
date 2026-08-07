import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

import { mhdGetComplianceReleaseBlockers, mhdListImpersonationSessions } from '../Service';

describe('mhdGetComplianceReleaseBlockers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps compliance release blocker rows to camelCase', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          module_key: 'LEAVES',
          content_key: 'FMLA_NOTICE',
          version: 2,
          review_status: 'PENDING',
          production_enabled: false,
          blocker: true,
        },
      ],
      error: null,
    });

    const result = await mhdGetComplianceReleaseBlockers();

    expect(rpcMock).toHaveBeenCalledWith('mhd_compliance_release_blockers');
    expect(result).toEqual([
      {
        moduleKey: 'LEAVES',
        contentKey: 'FMLA_NOTICE',
        version: 2,
        reviewStatus: 'PENDING',
        productionEnabled: false,
        blocker: true,
      },
    ]);
  });

  it('returns an empty array when the gate is fully clear', async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });

    const result = await mhdGetComplianceReleaseBlockers();

    expect(result).toEqual([]);
  });

  it('throws a descriptive error when the RPC fails', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'permission denied' } });

    await expect(mhdGetComplianceReleaseBlockers()).rejects.toThrow(
      'Unable to load compliance status: permission denied',
    );
  });
});

describe('mhdListImpersonationSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps impersonation session rows to camelCase and defaults the limit to 50', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'sess-1',
          admin_user_id: 'user-1',
          admin_display_name: 'Alex Admin',
          impersonated_role: 'HR Partner',
          impersonated_company_id: 'company-1',
          impersonated_company_name: 'Acme Co',
          started_at: '2026-08-01T00:00:00.000Z',
          ended_at: null,
        },
      ],
      error: null,
    });

    const result = await mhdListImpersonationSessions();

    expect(rpcMock).toHaveBeenCalledWith('mhd_list_impersonation_sessions', { p_limit: 50 });
    expect(result).toEqual([
      {
        id: 'sess-1',
        adminUserId: 'user-1',
        adminDisplayName: 'Alex Admin',
        impersonatedRole: 'HR Partner',
        impersonatedCompanyId: 'company-1',
        impersonatedCompanyName: 'Acme Co',
        startedAt: '2026-08-01T00:00:00.000Z',
        endedAt: null,
      },
    ]);
  });

  it('passes through a custom limit', async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });

    await mhdListImpersonationSessions(10);

    expect(rpcMock).toHaveBeenCalledWith('mhd_list_impersonation_sessions', { p_limit: 10 });
  });

  it('throws a descriptive error when the RPC fails', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'not authorized' } });

    await expect(mhdListImpersonationSessions()).rejects.toThrow(
      'Unable to load impersonation history: not authorized',
    );
  });
});
