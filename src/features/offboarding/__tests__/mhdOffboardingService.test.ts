import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  createActivityMock,
  createRequestFromGeneratedDocumentMock,
  fromMock,
  invokeMock,
  listActivitiesMock,
  listAssignmentsMock,
  maybeSingleMock,
  returnsMock,
  rpcMock,
} = vi.hoisted(() => ({
  createActivityMock: vi.fn(),
  createRequestFromGeneratedDocumentMock: vi.fn(),
  fromMock: vi.fn(),
  invokeMock: vi.fn(),
  listActivitiesMock: vi.fn(),
  listAssignmentsMock: vi.fn(),
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
vi.mock('@/features/activities/Service', () => ({
  mhdActivityService: { createActivity: createActivityMock, listActivities: listActivitiesMock },
}));
vi.mock('@/features/esignature/Service', () => ({
  mhdEsignatureService: {
    createRequestFromGeneratedDocument: createRequestFromGeneratedDocumentMock,
  },
}));
vi.mock('@/features/property/Service', () => ({
  mhdPropertyService: { listAssignments: listAssignmentsMock },
}));

const { mhdOffboardingService } = await import('../Service');

const caseRow = {
  id: 'case-1',
  reference_id: 'OFFC-000001',
  company_id: 'company-1',
  company_name: 'Acme',
  person_id: 'person-1',
  person_display_name: 'Pat Person',
  person_primary_email: 'pat.person@example.com',
  initiated_by_user_id: 'hr-1',
  initiator_display_name: 'Harper HR',
  separation_type: 'RESIGNATION',
  status: 'ACTIVE',
  separation_date: '2026-08-01',
  last_working_day: '2026-08-15',
  reason_summary: null,
  eligible_for_rehire: null,
  exit_interview_activity_id: null,
  cancel_reason: null,
  completed_at: null,
  required_done_count: 0,
  required_total_count: 4,
  outstanding_property_count: 1,
  created_at: '2026-07-19T00:00:00Z',
  created_by: 'hr-1',
  updated_at: '2026-07-19T00:00:00Z',
  updated_by: 'hr-1',
};

const exitAcknowledgmentItemRow = {
  id: 'item-exit',
  reference_id: 'OFCL-000002',
  case_id: 'case-1',
  item_key: 'exit_acknowledgment',
  title: 'Exit acknowledgment signed',
  description: null,
  is_required: true,
  status: 'PENDING',
  status_reason: null,
  assigned_user_id: null,
  assignee_display_name: null,
  due_date: null,
  linked_entity_type: null,
  linked_entity_id: null,
  linked_esignature_status: null,
  linked_drive_file_id: null,
  sort_order: 2,
  completed_at: null,
  completed_by: null,
  created_at: '2026-07-19T00:00:00Z',
  created_by: 'hr-1',
  updated_at: '2026-07-19T00:00:00Z',
  updated_by: 'hr-1',
};

beforeEach(() => {
  vi.clearAllMocks();
  rpcMock.mockImplementation(() => ({ returns: returnsMock }));
  fromMock.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: maybeSingleMock }) }) });
});

describe('mhdOffboardingService', () => {
  it('passes only the required list filter when optional filters are unset', async () => {
    returnsMock.mockResolvedValueOnce({ data: [], error: null });

    await mhdOffboardingService.listCases({
      companyId: 'company-1',
      personId: 'ALL',
      separationType: 'ALL',
      status: 'ALL',
      searchTerm: '',
      from: '',
      to: '',
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_list_offboarding_cases', {
      p_company_id: 'company-1',
    });
  });

  it('maps every set list filter to its RPC argument', async () => {
    returnsMock.mockResolvedValueOnce({ data: [caseRow], error: null });

    const cases = await mhdOffboardingService.listCases({
      companyId: 'company-1',
      personId: 'person-1',
      separationType: 'RESIGNATION',
      status: 'ACTIVE',
      searchTerm: ' pat ',
      from: '2026-07-01',
      to: '2026-09-01',
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_list_offboarding_cases', {
      p_company_id: 'company-1',
      p_person_id: 'person-1',
      p_separation_type: 'RESIGNATION',
      p_status: 'ACTIVE',
      p_search: 'pat',
      p_from: '2026-07-01',
      p_to: '2026-09-01',
    });
    expect(cases[0]).toMatchObject({
      id: 'case-1',
      personPrimaryEmail: 'pat.person@example.com',
      outstandingPropertyCount: 1,
    });
  });

  it('preserves the subject-sees-nothing contract: empty list and a surfaced 42501 detail denial', async () => {
    returnsMock.mockResolvedValueOnce({ data: [], error: null }).mockResolvedValueOnce({
      data: null,
      error: { message: 'Access denied for offboarding case case-1', code: '42501' },
    });

    const cases = await mhdOffboardingService.listCases({
      companyId: 'company-1',
      personId: 'person-1',
      separationType: 'ALL',
      status: 'ALL',
      searchTerm: '',
      from: '',
      to: '',
    });
    expect(cases).toEqual([]);

    await expect(mhdOffboardingService.getCaseById('case-1')).rejects.toThrow(
      'Unable to load offboarding case: Access denied for offboarding case case-1',
    );
  });

  it('omits the cancel reason on transition unless one is provided', async () => {
    rpcMock.mockResolvedValue({ error: null });

    await mhdOffboardingService.transitionCase('case-1', {
      newStatus: 'COMPLETED',
      cancelReason: '  ',
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_transition_offboarding_case', {
      p_case_id: 'case-1',
      p_new_status: 'COMPLETED',
    });

    await mhdOffboardingService.transitionCase('case-1', {
      newStatus: 'CANCELLED',
      cancelReason: 'Rescinded.',
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_transition_offboarding_case', {
      p_case_id: 'case-1',
      p_new_status: 'CANCELLED',
      p_cancel_reason: 'Rescinded.',
    });
  });

  it('sends explicit unknown rehire eligibility as null and omits untouched eligibility', async () => {
    rpcMock.mockResolvedValue({ error: null });

    await mhdOffboardingService.updateCase('case-1', {
      eligibleForRehire: null,
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_update_offboarding_case', {
      p_case_id: 'case-1',
      p_eligible_for_rehire: null,
    });

    await mhdOffboardingService.updateCase('case-1', {});
    expect(rpcMock).toHaveBeenLastCalledWith('mhd_update_offboarding_case', {
      p_case_id: 'case-1',
    });
  });

  it('maps a waiver to p_status/p_reason and sends evidence links only as a pair', async () => {
    rpcMock.mockResolvedValue({ error: null });

    await mhdOffboardingService.updateItem('item-1', {
      status: 'WAIVED',
      reason: 'Nothing issued.',
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_update_offboarding_item', {
      p_item_id: 'item-1',
      p_status: 'WAIVED',
      p_reason: 'Nothing issued.',
    });

    await mhdOffboardingService.updateItem('item-1', {
      linkedEntityType: 'ESIGNATURE_REQUEST',
      linkedEntityId: null,
    });
    expect(rpcMock).toHaveBeenLastCalledWith('mhd_update_offboarding_item', {
      p_item_id: 'item-1',
    });
  });

  it('surfaces only ISSUED assignments as outstanding property', async () => {
    listAssignmentsMock.mockResolvedValueOnce([
      { id: 'assignment-1', status: 'ISSUED' },
      { id: 'assignment-2', status: 'RETURNED' },
      { id: 'assignment-3', status: 'ISSUED' },
    ]);

    const outstanding = await mhdOffboardingService.listOutstandingProperty('person-1');

    expect(listAssignmentsMock).toHaveBeenCalledWith({ personId: 'person-1' });
    expect(outstanding.map((assignment) => assignment.id)).toEqual([
      'assignment-1',
      'assignment-3',
    ]);
  });

  it('uses the Activities contract and rejects unrelated activity types', async () => {
    listActivitiesMock.mockResolvedValueOnce([]);
    await mhdOffboardingService.listExitInterviewActivities('company-1', 'person-1');
    expect(listActivitiesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'company-1',
        personId: 'person-1',
        activityType: 'EXIT_INTERVIEW',
      }),
    );

    await expect(
      mhdOffboardingService.createExitInterviewActivity({
        companyId: 'company-1',
        activityType: 'PHONE_CALL' as never,
        title: 'Not permitted',
      }),
    ).rejects.toThrow('The Offboarding module only creates EXIT_INTERVIEW or MEETING activities.');
    expect(createActivityMock).not.toHaveBeenCalled();
  });

  it('runs the exit ceremony end to end with the subject as sole external signer', async () => {
    rpcMock.mockImplementation((name: string) => {
      if (name === 'mhd_get_exit_acknowledgment_template_id') {
        return Promise.resolve({ data: 'template-1', error: null });
      }
      if (
        name === 'mhd_get_offboarding_case' ||
        name === 'mhd_request_document_generation' ||
        name === 'mhd_list_offboarding_items'
      ) {
        return { returns: returnsMock };
      }
      return Promise.resolve({ error: null });
    });
    returnsMock
      .mockResolvedValueOnce({ data: [caseRow], error: null })
      .mockResolvedValueOnce({
        data: [{ id: 'gen-1', reference_id: 'DGEN-1', status: 'PENDING' }],
        error: null,
      })
      .mockResolvedValueOnce({ data: [exitAcknowledgmentItemRow], error: null })
      .mockResolvedValueOnce({ data: [caseRow], error: null });
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

    const result = await mhdOffboardingService.generateExitDocumentForCase({
      caseId: 'case-1',
      pollIntervalMs: 0,
      onStep: (step) => steps.push(step),
    });

    expect(steps).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(rpcMock).toHaveBeenCalledWith('mhd_get_exit_acknowledgment_template_id');
    expect(rpcMock).toHaveBeenCalledWith(
      'mhd_request_document_generation',
      expect.objectContaining({
        p_company_id: 'company-1',
        p_template_id: 'template-1',
        p_entity_type: 'OFFBOARDING_CASE',
        p_entity_id: 'case-1',
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
          { kind: 'external', externalEmail: 'pat.person@example.com', externalName: 'Pat Person' },
        ],
      }),
    );
    expect(rpcMock).toHaveBeenCalledWith('mhd_update_offboarding_item', {
      p_item_id: 'item-exit',
      p_linked_entity_type: 'ESIGNATURE_REQUEST',
      p_linked_entity_id: 'signature-1',
    });
    expect(result).toMatchObject({
      documentGenerationId: 'gen-1',
      esignatureRequestId: 'signature-1',
      documentHash: 'hash-1',
      invitationErrors: [],
    });
  });

  it('fails step 5 with a step-numbered error when the subject has no primary email', async () => {
    const emailLessCase = { ...caseRow, person_primary_email: null };
    rpcMock.mockImplementation((name: string) => {
      if (name === 'mhd_get_offboarding_case' || name === 'mhd_request_document_generation') {
        return { returns: returnsMock };
      }
      return Promise.resolve({ error: null });
    });
    returnsMock
      .mockResolvedValueOnce({ data: [emailLessCase], error: null })
      .mockResolvedValueOnce({
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

    await expect(
      mhdOffboardingService.generateExitDocumentForCase({
        caseId: 'case-1',
        templateId: 'template-1',
        pollIntervalMs: 0,
      }),
    ).rejects.toThrow(
      'Exit document step 5 (create signature request) failed: the separating employee has no primary email on record.',
    );
    expect(createRequestFromGeneratedDocumentMock).not.toHaveBeenCalled();
  });
});
