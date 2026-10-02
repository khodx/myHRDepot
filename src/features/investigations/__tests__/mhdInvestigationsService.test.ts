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

describe('mhdInvestigationsService — intake (0366)', () => {
  it('opens the case, parties, source, deadline and interim measures in a single RPC', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ id: 'case-7', reference_id: 'INVC-7' }],
      error: null,
    });

    const result = await mhdInvestigationsService.openFromIntake({
      companyId: 'company-1',
      caseType: 'COMPLAINT',
      allegation: 'Repeated schedule changes without notice.',
      severity: 'MEDIUM',
      confidentiality: 'HIGH',
      assignedInvestigatorUserId: 'user-4',
      parties: [
        {
          partyRole: 'COMPLAINANT',
          personId: 'person-2',
          isConfidential: true,
          statement: 'Raised twice.',
        },
        { partyRole: 'WITNESS', externalName: 'Night-shift contractor' },
      ],
      sourceType: 'GRIEVANCE',
      sourceId: 'grievance-3',
      targetCompletionDate: '2026-11-15',
      interimMeasures: [
        {
          measureType: 'SCHEDULE_CHANGE',
          description: 'Move to the day shift',
          reviewBy: '2026-10-20',
        },
      ],
      conflictAcknowledgment: 'No other qualified investigator is available.',
    });

    expect(result).toMatchObject({ id: 'case-7' });
    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith('mhd_investigation_intake_open', {
      p_company_id: 'company-1',
      p_case_type: 'COMPLAINT',
      p_allegation: 'Repeated schedule changes without notice.',
      p_severity: 'MEDIUM',
      p_confidentiality: 'HIGH',
      p_assigned_investigator: 'user-4',
      p_parties: [
        {
          party_role: 'COMPLAINANT',
          person_id: 'person-2',
          external_name: null,
          is_confidential: true,
          statement: 'Raised twice.',
        },
        {
          party_role: 'WITNESS',
          person_id: null,
          external_name: 'Night-shift contractor',
          is_confidential: false,
          statement: null,
        },
      ],
      p_source_type: 'GRIEVANCE',
      p_source_id: 'grievance-3',
      p_target_completion_date: '2026-11-15',
      p_interim_measures: [
        {
          measure_type: 'SCHEDULE_CHANGE',
          description: 'Move to the day shift',
          effective_from: null,
          review_by: '2026-10-20',
        },
      ],
      p_conflict_acknowledgment: 'No other qualified investigator is available.',
    });
  });

  it('omits the optional arguments it was not given', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ id: 'case-8', reference_id: 'INVC-8' }],
      error: null,
    });
    await mhdInvestigationsService.openFromIntake({
      companyId: 'company-1',
      caseType: 'OTHER',
      allegation: 'A concern.',
    });
    const args = rpcMock.mock.calls[0]?.[1] as Record<string, unknown>;
    for (const key of [
      'p_severity',
      'p_assigned_investigator',
      'p_source_type',
      'p_source_id',
      'p_target_completion_date',
      'p_conflict_acknowledgment',
    ]) {
      expect(args).not.toHaveProperty(key);
    }
    expect(args.p_parties).toEqual([]);
    expect(args.p_interim_measures).toEqual([]);
  });

  it("surfaces the server's refusal, such as a blocking independence finding", async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: {
        message: "Independence check: The investigator is in the respondent's reporting line.",
      },
    });
    await expect(
      mhdInvestigationsService.openFromIntake({
        companyId: 'company-1',
        caseType: 'COMPLAINT',
        allegation: 'x',
      }),
    ).rejects.toThrow(/Independence check/);
  });

  it('maps independence findings, and asks nothing when no investigator is chosen', async () => {
    expect(
      await mhdInvestigationsService.checkConflicts({
        companyId: 'company-1',
        investigatorUserId: null,
        partyPersonIds: [],
        respondentPersonIds: [],
      }),
    ).toEqual([]);
    expect(rpcMock).not.toHaveBeenCalled();

    rpcMock.mockResolvedValueOnce({
      data: {
        conflicts: [
          {
            code: 'INVESTIGATOR_MANAGES_RESPONDENT',
            severity: 'BLOCKING',
            person_id: 'person-5',
            message: "The investigator is in the respondent's reporting line",
          },
          {
            code: 'INVESTIGATOR_MANAGES_PARTY',
            severity: 'ADVISORY',
            person_id: 'person-6',
            message: "The investigator is in a party's reporting line",
          },
        ],
      },
      error: null,
    });
    const findings = await mhdInvestigationsService.checkConflicts({
      companyId: 'company-1',
      investigatorUserId: 'user-4',
      partyPersonIds: ['person-5', 'person-6'],
      respondentPersonIds: ['person-5'],
    });
    expect(findings).toEqual([
      {
        code: 'INVESTIGATOR_MANAGES_RESPONDENT',
        severity: 'BLOCKING',
        personId: 'person-5',
        message: "The investigator is in the respondent's reporting line",
      },
      {
        code: 'INVESTIGATOR_MANAGES_PARTY',
        severity: 'ADVISORY',
        personId: 'person-6',
        message: "The investigator is in a party's reporting line",
      },
    ]);
  });

  it("lists a case's interim measures", async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'measure-1',
          measure_type: 'NO_CONTACT_DIRECTIVE',
          description: 'No contact outside work duties',
          effective_from: '2026-10-01',
          review_by: null,
          status: 'ACTIVE',
          created_at: '2026-10-01T10:00:00Z',
        },
      ],
      error: null,
    });
    const measures = await mhdInvestigationsService.listInterimMeasures('case-7');
    expect(rpcMock).toHaveBeenCalledWith('mhd_investigation_list_interim_measures', {
      p_case_id: 'case-7',
    });
    expect(measures[0]).toMatchObject({
      measureType: 'NO_CONTACT_DIRECTIVE',
      status: 'ACTIVE',
      reviewBy: null,
    });
  });
});
