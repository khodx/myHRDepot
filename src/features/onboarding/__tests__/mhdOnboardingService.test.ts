import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mhdOnboardingService } from '../Service';

const {
  rpcReturnsMock,
  rpcMock,
  fromLookupReturnsMock,
  fromMock,
  fromInsertMock,
  fromInsertSingleMock,
  listFormsForCompanyMock,
} = vi.hoisted(() => {
  const rpcReturnsMock = vi.fn();
  const rpcMock = vi.fn(() => ({ returns: rpcReturnsMock }));
  const fromLookupReturnsMock = vi.fn();
  const fromLimitMock = vi.fn(() => ({ returns: fromLookupReturnsMock }));
  const fromEqMock = vi.fn(() => ({ limit: fromLimitMock }));
  const fromSelectMock = vi.fn(() => ({ eq: fromEqMock }));
  const fromInsertSingleMock = vi.fn();
  const fromInsertSelectMock = vi.fn(() => ({ single: fromInsertSingleMock }));
  const fromInsertMock = vi.fn(() => ({ select: fromInsertSelectMock }));
  const fromMock = vi.fn(() => ({ select: fromSelectMock, insert: fromInsertMock }));
  const listFormsForCompanyMock = vi.fn();

  return {
    rpcReturnsMock,
    rpcMock,
    fromLookupReturnsMock,
    fromMock,
    fromInsertMock,
    fromInsertSingleMock,
    listFormsForCompanyMock,
  };
});

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: {
    rpc: rpcMock,
    from: fromMock,
  },
}));

vi.mock('@/features/forms/Service', () => ({
  mhdFormService: {
    listFormsForCompany: (...args: unknown[]) => listFormsForCompanyMock(...args),
  },
}));

describe('mhdOnboardingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists the onboarding checklist for a person', async () => {
    rpcReturnsMock.mockResolvedValueOnce({
      data: [
        {
          id: '01CHECKLIST',
          reference_id: 'ONCL-000001',
          company_id: '01COMPANY',
          person_id: '01PERSON',
          document_key: 'onboarding_handbook_acknowledgments',
          document_record_id: null,
          status: 'NOT_STARTED',
          is_required: true,
          due_date: null,
          completed_at: null,
        },
      ],
      error: null,
    });

    const items = await mhdOnboardingService.getChecklistForPerson('01PERSON');

    expect(rpcMock).toHaveBeenCalledWith('mhd_get_onboarding_checklist_for_person', {
      p_person_id: '01PERSON',
    });
    expect(items).toHaveLength(1);
    expect(items[0].documentKey).toBe('onboarding_handbook_acknowledgments');
    expect(items[0].status).toBe('NOT_STARTED');
  });

  it('returns an empty list when a person has no checklist items yet', async () => {
    rpcReturnsMock.mockResolvedValueOnce({ data: null, error: null });

    const items = await mhdOnboardingService.getChecklistForPerson('01PERSON');

    expect(items).toEqual([]);
  });

  it('upserts a checklist item after applying a submitted form onto an existing onboarding row', async () => {
    fromLookupReturnsMock.mockResolvedValueOnce({
      data: [{ id: '01I9RECORD' }],
      error: null,
    });
    rpcReturnsMock.mockResolvedValueOnce({
      data: [{ destination_record_id: '01I9RECORD' }],
      error: null,
    });
    rpcReturnsMock.mockResolvedValueOnce({
      data: [
        {
          id: '01CHECKLIST',
          reference_id: 'ONCL-000001',
          company_id: '01COMPANY',
          person_id: '01PERSON',
          document_key: 'onboarding_i9_records',
          document_record_id: '01I9RECORD',
          status: 'SUBMITTED',
          is_required: true,
          due_date: null,
          completed_at: null,
        },
      ],
      error: null,
    });

    const result = await mhdOnboardingService.upsertChecklistItemFromSubmittedForm({
      companyId: '01COMPANY',
      personId: '01PERSON',
      documentKey: 'onboarding_i9_records',
      submissionId: '01SUBMISSION',
      actorUserId: '01USER',
    });

    expect(fromMock).toHaveBeenCalledWith('onboarding_i9_records');
    expect(rpcMock).toHaveBeenCalledWith('mhd_apply_form_submission_to_destination', {
      p_submission_id: '01SUBMISSION',
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_upsert_onboarding_checklist_item', {
      p_company_id: '01COMPANY',
      p_person_id: '01PERSON',
      p_document_key: 'onboarding_i9_records',
      p_document_record_id: '01I9RECORD',
      p_status: 'SUBMITTED',
      p_actor_user_id: '01USER',
    });
    expect(result.documentRecordId).toBe('01I9RECORD');
  });

  it('creates a placeholder onboarding row when the checklist starts with no destination record yet', async () => {
    fromLookupReturnsMock.mockResolvedValueOnce({
      data: [],
      error: null,
    });
    fromInsertSingleMock.mockResolvedValueOnce({
      data: { id: '01DIRECTDEPOSIT' },
      error: null,
    });
    rpcReturnsMock.mockResolvedValueOnce({
      data: [{ destination_record_id: '01DIRECTDEPOSIT' }],
      error: null,
    });
    rpcReturnsMock.mockResolvedValueOnce({
      data: [
        {
          id: '01CHECKLIST',
          reference_id: 'ONCL-000002',
          company_id: '01COMPANY',
          person_id: '01PERSON',
          document_key: 'onboarding_direct_deposits',
          document_record_id: '01DIRECTDEPOSIT',
          status: 'SUBMITTED',
          is_required: true,
          due_date: null,
          completed_at: null,
        },
      ],
      error: null,
    });

    const result = await mhdOnboardingService.upsertChecklistItemFromSubmittedForm({
      companyId: '01COMPANY',
      personId: '01PERSON',
      documentKey: 'onboarding_direct_deposits',
      submissionId: '01SUBMISSION',
      actorUserId: '01USER',
    });

    expect(fromMock).toHaveBeenCalledWith('onboarding_direct_deposits');
    expect(fromInsertMock).toHaveBeenCalledWith({
      reference_id: '',
      company_id: '01COMPANY',
      person_id: '01PERSON',
      form_submission_id: '01SUBMISSION',
      status: 'SUBMITTED',
      created_by: '01USER',
      updated_by: '01USER',
    });
    expect(result.documentRecordId).toBe('01DIRECTDEPOSIT');
  });

  it('filters the company forms down to the onboarding packet corpus', async () => {
    listFormsForCompanyMock.mockResolvedValueOnce([
      {
        id: 'FORM1',
        referenceId: 'FORM-000041',
        companyId: '01COMPANY',
        name: 'New Hire - Direct Deposit',
        description: 'Direct deposit',
        status: 'ACTIVE',
        definition: {
          id: 'FORM1',
          name: 'New Hire - Direct Deposit',
          fields: [],
          pages: [],
          logic: [],
          calculations: [],
          settings: { allowDraft: true, multiPage: false, progressBar: true },
        },
        version: 1,
        previousVersionId: null,
        createdAt: '2026-07-17T00:00:00Z',
        updatedAt: '2026-07-17T00:00:00Z',
        publishedAt: null,
        publishedBy: null,
      },
      {
        id: 'FORM2',
        referenceId: 'FORM-999999',
        companyId: '01COMPANY',
        name: 'Some Other Form',
        description: 'Other',
        status: 'ACTIVE',
        definition: {
          id: 'FORM2',
          name: 'Some Other Form',
          fields: [],
          pages: [],
          logic: [],
          calculations: [],
          settings: { allowDraft: true, multiPage: false, progressBar: true },
        },
        version: 1,
        previousVersionId: null,
        createdAt: '2026-07-17T00:00:00Z',
        updatedAt: '2026-07-17T00:00:00Z',
        publishedAt: null,
        publishedBy: null,
      },
    ]);

    const forms = await mhdOnboardingService.listPacketFormsForCompany('01COMPANY');

    expect(listFormsForCompanyMock).toHaveBeenCalledWith('01COMPANY', 'ACTIVE');
    expect(forms).toEqual([
      {
        formId: 'FORM1',
        formReferenceId: 'FORM-000041',
        formName: 'New Hire - Direct Deposit',
        formStatus: 'ACTIVE',
      },
    ]);
  });
});
