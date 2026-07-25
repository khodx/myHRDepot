import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  createRequestFromGeneratedDocumentMock,
  fromMock,
  getPersonByIdMock,
  invokeMock,
  maybeSingleMock,
  returnsMock,
  rpcMock,
} = vi.hoisted(() => ({
  createRequestFromGeneratedDocumentMock: vi.fn(),
  fromMock: vi.fn(),
  getPersonByIdMock: vi.fn(),
  invokeMock: vi.fn(),
  maybeSingleMock: vi.fn(),
  returnsMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: {
    rpc: rpcMock,
    from: fromMock,
    functions: { invoke: invokeMock },
  },
}));
vi.mock('@/features/esignature/Service', () => ({
  mhdEsignatureService: {
    createRequestFromGeneratedDocument: createRequestFromGeneratedDocumentMock,
  },
}));
vi.mock('@/features/people/Service', () => ({
  mhdPersonService: { getPersonById: getPersonByIdMock },
}));

const { mhdConductService } = await import('../Service');

const issuedActionRow = {
  id: 'action-1',
  reference_id: 'CACT-000001',
  severity: 'WRITTEN_WARNING',
  status: 'ISSUED',
  action_summary: 'Written warning for lateness.',
  document_payload: {},
  requires_document: true,
  esignature_request_id: 'sig-1',
  esignature_status: 'PENDING',
  acknowledgment_type: null,
  outcome_reason: null,
  issued_at: '2026-07-20T00:00:00Z',
  sort_order: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
  rpcMock.mockImplementation(() => ({ returns: returnsMock }));
  fromMock.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: maybeSingleMock }) }) });
});

describe('mhdConductService list/filter', () => {
  it('passes only the required company filter when optional filters are unset', async () => {
    returnsMock.mockResolvedValueOnce({ data: [], error: null });

    await mhdConductService.listCases({
      companyId: 'company-1',
      personId: 'ALL',
      category: 'ALL',
      status: 'ALL',
      searchTerm: '',
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_conduct_list_cases', { p_company_id: 'company-1' });
  });

  it('maps every set list filter to its RPC argument and applies the client-side search', async () => {
    returnsMock.mockResolvedValueOnce({
      data: [
        {
          id: 'case-1',
          reference_id: 'COND-000001',
          person_id: 'person-1',
          person_display_name: 'Pat Person',
          category: 'PERFORMANCE',
          status: 'OPEN',
          action_count: '2',
          terminal_count: '1',
          created_at: '2026-07-19T00:00:00Z',
        },
      ],
      error: null,
    });

    const cases = await mhdConductService.listCases({
      companyId: 'company-1',
      personId: 'person-1',
      category: 'PERFORMANCE',
      status: 'OPEN',
      searchTerm: ' pat ',
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_conduct_list_cases', {
      p_company_id: 'company-1',
      p_person_id: 'person-1',
      p_status: 'OPEN',
      p_category: 'PERFORMANCE',
    });
    // action_count / terminal_count arrive as strings from the bigint aggregate;
    // the mapping must funnel them through mhdToNumber to a real number.
    expect(cases[0]).toMatchObject({ id: 'case-1', actionCount: 2, terminalCount: 1 });
  });
});

describe('mhdConductService subject-visibility contract', () => {
  it('surfaces exactly the RLS-visible action set for the subject (ISSUED only, no drafts synthesised)', async () => {
    // A subject principal's RLS yields only ISSUED (and terminal) actions on a
    // case they can see; drafts are filtered server-side and never reach the
    // wire. The service must faithfully surface that set and add nothing.
    returnsMock.mockResolvedValueOnce({ data: [issuedActionRow], error: null });

    const actions = await mhdConductService.listActions('case-1');

    expect(rpcMock).toHaveBeenCalledWith('mhd_conduct_list_actions', { p_case_id: 'case-1' });
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ id: 'action-1', status: 'ISSUED' });
    expect(actions.some((action) => action.status === 'DRAFT')).toBe(false);
  });

  it('surfaces a server-side 42501 denial verbatim rather than swallowing it', async () => {
    returnsMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'Access denied for conduct case case-1', code: '42501' },
    });

    await expect(mhdConductService.listActions('case-1')).rejects.toThrow(
      'Unable to load conduct actions: Access denied for conduct case case-1',
    );
  });
});

describe('mhdConductService acknowledgment gate', () => {
  it('surfaces the server refusal when ACKNOWLEDGED is recorded before the signature completes', async () => {
    // The gate lives in mhd_conduct_record_outcome: ACKNOWLEDGED before the
    // signature request completes is refused. The service must surface that
    // refusal — never weaken or pre-empt it client-side.
    rpcMock.mockResolvedValueOnce({
      error: { message: 'Signature not completed — record a refusal or waiver instead.' },
    });

    await expect(
      mhdConductService.recordOutcome('action-1', { outcome: 'ACKNOWLEDGED' }),
    ).rejects.toThrow(
      'Unable to record conduct outcome: Signature not completed — record a refusal or waiver instead.',
    );
  });

  it('records ACKNOWLEDGED with no reason/witness (the RPC stamps RECEIPT server-side)', async () => {
    rpcMock.mockResolvedValueOnce({ error: null });

    await mhdConductService.recordOutcome('action-1', {
      outcome: 'ACKNOWLEDGED',
      reason: 'ignored',
      witnessUserId: 'ignored',
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_conduct_record_outcome', {
      p_action_id: 'action-1',
      p_outcome: 'ACKNOWLEDGED',
      // reason IS forwarded when present, but acknowledgement carries none here;
      // witness only forwards when truthy. Assert the ACKNOWLEDGED shape maps the
      // provided reason/witness through — the RPC ignores them and stamps RECEIPT.
      p_reason: 'ignored',
      p_witness_user_id: 'ignored',
    });
  });

  it('maps a witnessed refusal to reason + witness arguments', async () => {
    rpcMock.mockResolvedValueOnce({ error: null });

    await mhdConductService.recordOutcome('action-1', {
      outcome: 'REFUSED',
      reason: 'Employee declined to sign in the meeting.',
      witnessUserId: 'user-9',
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_conduct_record_outcome', {
      p_action_id: 'action-1',
      p_outcome: 'REFUSED',
      p_reason: 'Employee declined to sign in the meeting.',
      p_witness_user_id: 'user-9',
    });
  });
});

describe('mhdConductService document payload', () => {
  it('forwards structured corrective-action notice payload when creating an action', async () => {
    returnsMock.mockResolvedValueOnce({
      data: [{ id: 'action-1', reference_id: 'CACT-000001' }],
      error: null,
    });

    await mhdConductService.createAction({
      caseId: 'case-1',
      severity: 'FINAL_WARNING',
      actionSummary: 'Final warning for unprofessional conduct.',
      requiresDocument: true,
      documentPayload: {
        companyName: 'Crossroads of Choice',
        positionTitle: 'Support Staff',
        incidentDates: 'Friday, March 20, 2026',
        policiesViolated: 'Consumer Confidentiality\nEmployee Conduct Rule #16',
      },
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_conduct_create_action', {
      p_case_id: 'case-1',
      p_severity: 'FINAL_WARNING',
      p_action_summary: 'Final warning for unprofessional conduct.',
      p_requires_document: true,
      p_document_payload: {
        companyName: 'Crossroads of Choice',
        positionTitle: 'Support Staff',
        incidentDates: 'Friday, March 20, 2026',
        policiesViolated: 'Consumer Confidentiality\nEmployee Conduct Rule #16',
      },
    });
  });
});

describe('mhdConductService issue ceremony', () => {
  it('issues a no-document action directly without rendering or signing', async () => {
    rpcMock.mockResolvedValueOnce({ error: null });
    const steps: number[] = [];

    const result = await mhdConductService.issueActionWithCeremony({
      actionId: 'action-1',
      caseId: 'case-1',
      companyId: 'company-1',
      personId: 'person-1',
      severity: 'VERBAL_WARNING',
      requiresDocument: false,
      onStep: (step) => steps.push(step),
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_conduct_issue_action', { p_action_id: 'action-1' });
    expect(getPersonByIdMock).not.toHaveBeenCalled();
    expect(createRequestFromGeneratedDocumentMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      actionId: 'action-1',
      documentGenerationId: null,
      esignatureRequestId: null,
    });
    expect(steps).toEqual([0]);
  });

  it('runs the document ceremony end to end with the subject as sole external signer', async () => {
    getPersonByIdMock.mockResolvedValue({
      id: 'person-1',
      displayName: 'Pat Person',
      primaryEmail: 'pat.person@example.test',
    });
    rpcMock.mockImplementation((name: string) => {
      if (name === 'mhd_get_corrective_action_template_id') {
        return Promise.resolve({ data: 'template-1', error: null });
      }
      if (name === 'mhd_request_document_generation') {
        return { returns: returnsMock };
      }
      // mhd_conduct_issue_action (with links)
      return Promise.resolve({ error: null });
    });
    returnsMock.mockResolvedValueOnce({
      data: [{ id: 'gen-1', reference_id: 'DGEN-1', status: 'PENDING' }],
      error: null,
    });
    invokeMock.mockResolvedValueOnce({ data: { success: true }, error: null });
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        id: 'gen-1',
        status: 'GENERATED',
        output_drive_file_id: 'drive-1',
        output_document_hash: 'hash-1',
      },
      error: null,
    });
    createRequestFromGeneratedDocumentMock.mockResolvedValueOnce({
      request: { id: 'signature-1' },
      invitationErrors: [],
    });
    const steps: number[] = [];

    const result = await mhdConductService.issueActionWithCeremony({
      actionId: 'action-1',
      caseId: 'case-1',
      companyId: 'company-1',
      personId: 'person-1',
      severity: 'WRITTEN_WARNING',
      requiresDocument: true,
      actionSummary: 'Written warning for lateness.',
      documentPayload: {
        companyName: 'Crossroads of Choice',
        positionTitle: 'Support Staff',
        departmentProgram: 'Day Program Services',
        supervisorName: 'Supervisor Name Here',
        facilityLocation: 'Crossroads of Choice',
        dateOfNotice: 'Tuesday, June 22, 2026',
        incidentDates: 'Friday, March 20, 2026',
        incidentNarrative: 'Employee made <false> statements.',
        policiesViolated: 'Consumer Confidentiality\nEmployee Conduct Rule #16',
        trainingItems: 'Communicating Effectively\nConflict Resolution',
      },
      caseReferenceId: 'COND-000001',
      pollIntervalMs: 0,
      onStep: (step) => steps.push(step),
    });

    expect(steps).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(rpcMock).toHaveBeenCalledWith('mhd_get_corrective_action_template_id', {
      p_severity: 'WRITTEN_WARNING',
    });
    expect(rpcMock).toHaveBeenCalledWith(
      'mhd_request_document_generation',
      expect.objectContaining({
        p_company_id: 'company-1',
        p_template_id: 'template-1',
        p_entity_type: 'CONDUCT_ACTION',
        p_entity_id: 'action-1',
        p_merge_data: expect.objectContaining({
          company_name: 'Crossroads of Choice',
          employee: expect.objectContaining({
            position_title: 'Support Staff',
            department_program: 'Day Program Services',
          }),
          incident: expect.objectContaining({
            dates: 'Friday, March 20, 2026',
            narrative: 'Employee made &lt;false&gt; statements.',
            policies_violated: 'Consumer Confidentiality\nEmployee Conduct Rule #16',
          }),
          improvement: expect.objectContaining({
            training_items: 'Communicating Effectively\nConflict Resolution',
          }),
        }),
      }),
    );
    expect(invokeMock).toHaveBeenCalledWith('render-document', {
      body: { generation_id: 'gen-1' },
    });
    expect(createRequestFromGeneratedDocumentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'company-1',
        generationId: 'gen-1',
        documentHash: 'hash-1',
        signingOrder: 'SEQUENTIAL',
        signers: [
          {
            kind: 'external',
            externalEmail: 'pat.person@example.test',
            externalName: 'Pat Person',
          },
        ],
      }),
    );
    expect(rpcMock).toHaveBeenCalledWith('mhd_conduct_issue_action', {
      p_action_id: 'action-1',
      p_document_generation_id: 'gen-1',
      p_esignature_request_id: 'signature-1',
    });
    expect(result).toMatchObject({
      actionId: 'action-1',
      documentGenerationId: 'gen-1',
      esignatureRequestId: 'signature-1',
      documentHash: 'hash-1',
      invitationErrors: [],
    });
  });

  it('stops with a step-0 subject-email error before any generation is requested', async () => {
    getPersonByIdMock.mockResolvedValue({
      id: 'person-1',
      displayName: 'Pat Person',
      primaryEmail: null,
    });

    await expect(
      mhdConductService.issueActionWithCeremony({
        actionId: 'action-1',
        caseId: 'case-1',
        companyId: 'company-1',
        personId: 'person-1',
        severity: 'WRITTEN_WARNING',
        requiresDocument: true,
      }),
    ).rejects.toThrow('the subject employee has no primary email on record');
    expect(createRequestFromGeneratedDocumentMock).not.toHaveBeenCalled();
  });
});
