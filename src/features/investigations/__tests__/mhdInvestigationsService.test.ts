import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

const { mhdInvestigationsService } = await import('../Service');

// The single non-disclosure error. Not-found and not-granted return this
// identical text by design; nothing must be able to tell the two apart.
const DENIAL = 'No such investigation, or access denied';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('mhdInvestigationsService — grant-gated visibility (the access model)', () => {
  it('returns an empty list for an ungranted caller — no error, no leak', async () => {
    // An ungranted admin is not an error case: the grant-filtered RPC simply
    // returns zero rows, and the service surfaces an empty board.
    rpcMock.mockResolvedValueOnce({ data: [], error: null });

    const cases = await mhdInvestigationsService.listCases({
      companyId: 'company-1',
      status: 'ALL',
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_investigation_list', {
      p_company_id: 'company-1',
      p_status: undefined,
    });
    expect(cases).toEqual([]);
  });

  it('never touches the RPC without a company — an empty board, not a query', async () => {
    const cases = await mhdInvestigationsService.listCases({ companyId: null, status: 'ALL' });
    expect(cases).toEqual([]);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('propagates the identical non-disclosure error verbatim from get (denied === not-found)', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: DENIAL } });
    await expect(mhdInvestigationsService.getCase('case-1')).rejects.toMatchObject({
      message: DENIAL,
    });
  });

  it('returns null from get when the RPC yields no row — indistinguishable from absent', async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });
    await expect(mhdInvestigationsService.getCase('case-1')).resolves.toBeNull();
  });

  it('cannot self-grant: grant_access raises the identical non-disclosure error', async () => {
    // An ungranted admin who tries to grant themselves in is refused with the
    // same non-disclosing text — access to grant access is itself access.
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: DENIAL } });

    await expect(
      mhdInvestigationsService.grantAccess({ caseId: 'case-1', userId: 'me' }),
    ).rejects.toMatchObject({ message: DENIAL });

    expect(rpcMock).toHaveBeenCalledWith('mhd_investigation_grant_access', {
      p_case_id: 'case-1',
      p_user_id: 'me',
    });
  });
});

describe('mhdInvestigationsService — confidential-identity masking', () => {
  it('surfaces a confidential party verbatim (null person_id, "(confidential)"), never re-derived', async () => {
    // The mask is applied SERVER-SIDE in list_parties. The service copies the row
    // through and must not infer identity from any other field.
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'party-1',
          party_role: 'COMPLAINANT',
          person_id: null,
          display_name: '(confidential)',
          is_confidential: true,
          has_statement: true,
        },
        {
          id: 'party-2',
          party_role: 'RESPONDENT',
          person_id: 'person-9',
          display_name: 'Dana Doe',
          is_confidential: false,
          has_statement: false,
        },
      ],
      error: null,
    });

    const parties = await mhdInvestigationsService.listParties('case-1');

    expect(rpcMock).toHaveBeenCalledWith('mhd_investigation_list_parties', { p_case_id: 'case-1' });
    expect(parties[0]).toMatchObject({
      id: 'party-1',
      partyRole: 'COMPLAINANT',
      personId: null,
      displayName: '(confidential)',
      isConfidential: true,
      hasStatement: true,
    });
    // The non-confidential respondent keeps a real identity — masking is keyed on
    // is_confidential server-side, never applied client-side.
    expect(parties[1]).toMatchObject({ personId: 'person-9', displayName: 'Dana Doe' });
  });
});
