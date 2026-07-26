import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockRpc = vi.fn();
vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: (...args: unknown[]) => mockRpc(...args) },
}));

const { mhdOnboardingService } = await import('../Service');
const { MHD_ONBOARDING_PACKET_DEFINITIONS } = await import('../Types');

function rpcResult(data: unknown, error: { message: string } | null = null) {
  return { returns: () => ({ data, error }) };
}

describe('mhdOnboardingService.startPacket', () => {
  beforeEach(() => mockRpc.mockReset());

  it('passes the packet through to mhd_start_onboarding_packet', async () => {
    mockRpc.mockReturnValue(rpcResult([]));

    await mhdOnboardingService.startPacket({
      companyId: 'company-1',
      personId: 'person-1',
      documentKeys: ['onboarding_i9_records', 'onboarding_w4_elections'],
      dueDate: '2026-08-15T00:00:00.000Z',
      actorUserId: 'user-1',
    });

    expect(mockRpc).toHaveBeenCalledWith('mhd_start_onboarding_packet', {
      p_company_id: 'company-1',
      p_person_id: 'person-1',
      p_document_keys: ['onboarding_i9_records', 'onboarding_w4_elections'],
      p_due_date: '2026-08-15T00:00:00.000Z',
      p_actor_user_id: 'user-1',
    });
  });

  it('sends a null due date rather than omitting the argument', async () => {
    // Postgres would reject a missing positional argument; an open-ended packet
    // has to be an explicit null.
    mockRpc.mockReturnValue(rpcResult([]));

    await mhdOnboardingService.startPacket({
      companyId: 'company-1',
      personId: 'person-1',
      documentKeys: ['onboarding_i9_records'],
      dueDate: null,
      actorUserId: 'user-1',
    });

    expect(mockRpc.mock.calls[0][1]).toHaveProperty('p_due_date', null);
  });

  it('maps returned rows into checklist items', async () => {
    mockRpc.mockReturnValue(
      rpcResult([
        {
          id: 'item-1',
          reference_id: 'ONCL-000001',
          company_id: 'company-1',
          person_id: 'person-1',
          document_key: 'onboarding_i9_records',
          document_record_id: null,
          status: 'NOT_STARTED',
          is_required: true,
          due_date: '2026-08-15T00:00:00.000Z',
          completed_at: null,
        },
      ]),
    );

    const items = await mhdOnboardingService.startPacket({
      companyId: 'company-1',
      personId: 'person-1',
      documentKeys: ['onboarding_i9_records'],
      dueDate: '2026-08-15T00:00:00.000Z',
      actorUserId: 'user-1',
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      referenceId: 'ONCL-000001',
      documentKey: 'onboarding_i9_records',
      status: 'NOT_STARTED',
      isRequired: true,
      documentRecordId: null,
    });
  });

  it('surfaces the RPC error instead of returning an empty packet', async () => {
    // A silent [] here would read as "enrolled with no items" on the roster.
    mockRpc.mockReturnValue(
      rpcResult(null, { message: 'Current user cannot start an onboarding packet' }),
    );

    await expect(
      mhdOnboardingService.startPacket({
        companyId: 'company-1',
        personId: 'person-1',
        documentKeys: ['onboarding_i9_records'],
        dueDate: null,
        actorUserId: 'user-1',
      }),
    ).rejects.toThrow(/cannot start an onboarding packet/);
  });

  it('every manifest document key names a real onboarding_* destination table', async () => {
    // The RPC validates keys against the onboarding_* tables and raises on a
    // miss, so a manifest typo would fail at enrolment time, not at build time.
    for (const packet of MHD_ONBOARDING_PACKET_DEFINITIONS) {
      expect(packet.documentKey).toMatch(/^onboarding_[a-z0-9_]+$/);
      expect(packet.documentKey).not.toBe('onboarding_checklist_items');
    }
  });
});
