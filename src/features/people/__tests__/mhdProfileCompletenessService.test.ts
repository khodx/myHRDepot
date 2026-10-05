import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MhdProfileCompletenessError,
  mhdIsInsufficientPrivilegeError,
  mhdPersonService,
} from '../Service';

const { returnsMock, rpcMock, orderMock, fromMock } = vi.hoisted(() => {
  const returnsMock = vi.fn();
  const orderMock = vi.fn();
  const selectMock = vi.fn(() => ({ order: orderMock }));
  return {
    returnsMock,
    orderMock,
    rpcMock: vi.fn(() => ({ returns: returnsMock })),
    fromMock: vi.fn(() => ({ select: selectMock })),
  };
});

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock, from: fromMock },
}));

describe('profile completeness service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps incomplete profile rows and passes paging arguments', async () => {
    returnsMock.mockResolvedValueOnce({
      data: [
        {
          person_id: 'p-1',
          person_name: 'Maria Lopez',
          relationship_state: 'EMPLOYEE',
          missing_sections: ['emergency_contact', 'tax_withholding'],
          required_total: 5,
          required_complete: 3,
        },
      ],
      error: null,
    });

    const rows = await mhdPersonService.listIncompleteProfiles({
      companyId: 'c-1',
      limit: 50,
      offset: 100,
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_list_incomplete_profiles', {
      p_company_id: 'c-1',
      p_limit: 50,
      p_offset: 100,
    });
    expect(rows).toEqual([
      {
        personId: 'p-1',
        personName: 'Maria Lopez',
        relationshipState: 'EMPLOYEE',
        missingSections: ['emergency_contact', 'tax_withholding'],
        requiredTotal: 5,
        requiredComplete: 3,
      },
    ]);
  });

  it('maps per-person completeness rows', async () => {
    returnsMock.mockResolvedValueOnce({
      data: [
        {
          section_key: 'address',
          label: 'Home Address',
          sort_order: 2,
          is_required: true,
          is_complete: false,
        },
      ],
      error: null,
    });

    const rows = await mhdPersonService.getPersonProfileCompleteness('p-1');

    expect(rpcMock).toHaveBeenCalledWith('mhd_person_profile_completeness', {
      p_person_id: 'p-1',
    });
    expect(rows[0]).toEqual({
      sectionKey: 'address',
      label: 'Home Address',
      sortOrder: 2,
      isRequired: true,
      isComplete: false,
    });
  });

  it('maps requirement rows including the override flag', async () => {
    returnsMock.mockResolvedValueOnce({
      data: [
        {
          requirement_id: 'r-1',
          company_id: 'c-1',
          relationship_state: 'EMPLOYEE',
          section_key: 'address',
          label: 'Home Address',
          is_required: true,
          is_active: true,
          is_override: true,
        },
      ],
      error: null,
    });

    const rows = await mhdPersonService.listProfileRequirements('c-1');

    expect(rpcMock).toHaveBeenCalledWith('mhd_list_profile_requirements', {
      p_company_id: 'c-1',
    });
    expect(rows[0]).toMatchObject({
      requirementId: 'r-1',
      isOverride: true,
      sectionKey: 'address',
    });
  });

  it('upserts a requirement with the exact RPC argument names', async () => {
    (rpcMock as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: 'req-9',
      error: null,
    });

    const id = await mhdPersonService.upsertProfileRequirement({
      companyId: 'c-1',
      relationshipState: 'EMPLOYEE',
      sectionKey: 'address',
      isRequired: false,
      isActive: true,
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_upsert_profile_requirement', {
      p_company_id: 'c-1',
      p_relationship_state: 'EMPLOYEE',
      p_section_key: 'address',
      p_is_required: false,
      p_is_active: true,
    });
    expect(id).toBe('req-9');
  });

  it('reads section definitions ordered by sort_order', async () => {
    orderMock.mockResolvedValueOnce({
      data: [{ section_key: 'address', label: 'Home Address', description: null, sort_order: 2 }],
      error: null,
    });

    const rows = await mhdPersonService.listProfileSectionDefinitions();

    expect(fromMock).toHaveBeenCalledWith('profile_section_definitions');
    expect(orderMock).toHaveBeenCalledWith('sort_order', { ascending: true });
    expect(rows).toEqual([
      { sectionKey: 'address', label: 'Home Address', description: null, sortOrder: 2 },
    ]);
  });

  it('propagates errors with the SQLSTATE preserved', async () => {
    returnsMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'not allowed', code: '42501' },
    });

    const failure = await mhdPersonService.getPersonProfileCompleteness('p-1').catch((e) => e);

    expect(failure).toBeInstanceOf(MhdProfileCompletenessError);
    expect(failure.message).toContain('not allowed');
    expect(mhdIsInsufficientPrivilegeError(failure)).toBe(true);
  });

  it('propagates list and upsert failures', async () => {
    returnsMock.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });
    await expect(
      mhdPersonService.listIncompleteProfiles({ companyId: 'c-1', limit: 50, offset: 0 }),
    ).rejects.toThrow('Unable to load incomplete profiles: boom');

    (rpcMock as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: null,
      error: { message: 'denied', code: '42501' },
    });
    await expect(
      mhdPersonService.upsertProfileRequirement({
        companyId: 'c-1',
        relationshipState: 'EMPLOYEE',
        sectionKey: 'address',
        isRequired: true,
        isActive: true,
      }),
    ).rejects.toThrow('Unable to save profile requirement: denied');
  });
});
