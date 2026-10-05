import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

const { mhdEmployeeFilesService } = await import('../Service');
const { mhdEmployeeFileRequirementSchema } = await import('../Schemas');

const COMPANY_ID = '3f6b1a52-8c04-4d7e-9a13-2b5e7d90c481';
const PERSON_ID = 'c81d4e07-52fa-4b69-a3d0-6e19b7f2058c';
const REQUIREMENT_ID = '5a92e0c3-17b8-4f46-8d2e-b03c6a71d954';
const FORM_ID = 'e07b3d68-4a15-49c2-b6f1-90d8e2a5c317';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('mhdEmployeeFilesService requirements', () => {
  it('maps requirement gap rows and scopes the call to the company', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          person_id: PERSON_ID,
          person_name: 'Priya Raman',
          requirement_id: REQUIREMENT_ID,
          label: 'Form I-9',
          category: 'i9',
          due_date: '2026-09-30',
          status: 'OVERDUE',
        },
      ],
      error: null,
    });

    const gaps = await mhdEmployeeFilesService.listRequirementGaps(COMPANY_ID);

    expect(rpcMock).toHaveBeenCalledWith('mhd_employee_file_requirement_gaps', {
      p_company_id: COMPANY_ID,
    });
    expect(gaps).toEqual([
      {
        personId: PERSON_ID,
        personName: 'Priya Raman',
        requirementId: REQUIREMENT_ID,
        label: 'Form I-9',
        category: 'i9',
        dueDate: '2026-09-30',
        status: 'OVERDUE',
      },
    ]);
  });

  it('maps a person completeness checklist', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          requirement_id: REQUIREMENT_ID,
          label: 'Form W-4',
          category: 'payroll',
          due_date: null,
          status: 'SATISFIED',
        },
      ],
      error: null,
    });

    const items = await mhdEmployeeFilesService.getPersonCompleteness(PERSON_ID);

    expect(rpcMock).toHaveBeenCalledWith('mhd_employee_file_completeness', {
      p_person_id: PERSON_ID,
    });
    expect(items).toEqual([
      {
        requirementId: REQUIREMENT_ID,
        label: 'Form W-4',
        category: 'payroll',
        dueDate: null,
        status: 'SATISFIED',
      },
    ]);
  });

  it('maps requirement rules, treating a null state list as empty', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          requirement_id: REQUIREMENT_ID,
          company_id: null,
          category: 'hr',
          label: 'Signed Handbook',
          satisfied_by_kind: 'FORM_SUBMISSION',
          form_id: FORM_ID,
          template_key: null,
          applies_to_states: null,
          due_days_after_hire: 7,
          is_active: true,
          is_override: false,
        },
      ],
      error: null,
    });

    const [rule] = await mhdEmployeeFilesService.listRequirements(COMPANY_ID);

    expect(rule).toMatchObject({
      requirementId: REQUIREMENT_ID,
      companyId: null,
      satisfiedByKind: 'FORM_SUBMISSION',
      formId: FORM_ID,
      appliesToStates: [],
      dueDaysAfterHire: 7,
      isOverride: false,
    });
  });

  it('upserts a requirement with the exact RPC argument names', async () => {
    rpcMock.mockResolvedValueOnce({ data: REQUIREMENT_ID, error: null });

    const id = await mhdEmployeeFilesService.upsertRequirement(COMPANY_ID, {
      label: 'Signed Handbook',
      category: 'hr',
      satisfiedByKind: 'FORM_SUBMISSION',
      formId: FORM_ID,
      templateKey: null,
      appliesToStates: ['ACTIVE', 'ON_LEAVE'],
      dueDaysAfterHire: 7,
      isActive: false,
    });

    expect(id).toBe(REQUIREMENT_ID);
    expect(rpcMock).toHaveBeenCalledWith('mhd_upsert_employee_file_requirement', {
      p_company_id: COMPANY_ID,
      p_label: 'Signed Handbook',
      p_category: 'hr',
      p_satisfied_by_kind: 'FORM_SUBMISSION',
      p_form_id: FORM_ID,
      p_template_key: undefined,
      p_applies_to_states: ['ACTIVE', 'ON_LEAVE'],
      p_due_days_after_hire: 7,
      p_is_active: false,
    });
  });

  it.each([
    ['listRequirementGaps', () => mhdEmployeeFilesService.listRequirementGaps(COMPANY_ID)],
    ['getPersonCompleteness', () => mhdEmployeeFilesService.getPersonCompleteness(PERSON_ID)],
    ['listRequirements', () => mhdEmployeeFilesService.listRequirements(COMPANY_ID)],
  ])('%s propagates an RPC error rather than swallowing it', async (_name, call) => {
    const failure = { message: 'Not permitted to see employee file gaps', code: '42501' };
    rpcMock.mockResolvedValueOnce({ data: null, error: failure });
    await expect(call()).rejects.toBe(failure);
  });

  it('upsertRequirement propagates an RPC error', async () => {
    const failure = { message: 'The form must belong to the company', code: '22023' };
    rpcMock.mockResolvedValueOnce({ data: null, error: failure });
    await expect(
      mhdEmployeeFilesService.upsertRequirement(COMPANY_ID, {
        label: 'Signed Handbook',
        category: 'hr',
        satisfiedByKind: 'I9_RECORD',
        formId: null,
        templateKey: null,
        appliesToStates: ['ACTIVE'],
        dueDaysAfterHire: null,
        isActive: true,
      }),
    ).rejects.toBe(failure);
  });

  it('rejects a category outside the nine known file types', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          person_id: PERSON_ID,
          person_name: 'Priya Raman',
          requirement_id: REQUIREMENT_ID,
          label: 'Mystery',
          category: 'unknown',
          due_date: null,
          status: 'MISSING',
        },
      ],
      error: null,
    });
    await expect(mhdEmployeeFilesService.listRequirementGaps(COMPANY_ID)).rejects.toThrow(
      'Unexpected employee file category',
    );
  });
});

describe('mhdEmployeeFileRequirementSchema', () => {
  const valid = {
    label: 'Signed Handbook',
    category: 'hr',
    satisfiedByKind: 'I9_RECORD' as const,
    formId: '',
    templateKey: '',
    appliesToStates: ['ACTIVE' as const],
    dueDaysAfterHire: '',
    isActive: true,
  };

  it('accepts a valid rule', () => {
    expect(mhdEmployeeFileRequirementSchema.safeParse(valid).success).toBe(true);
  });

  it('requires a form for FORM_SUBMISSION and a template key for DOCUMENT_TEMPLATE', () => {
    const form = mhdEmployeeFileRequirementSchema.safeParse({
      ...valid,
      satisfiedByKind: 'FORM_SUBMISSION',
    });
    expect(form.success).toBe(false);
    expect(form.error?.issues[0]?.path).toEqual(['formId']);

    const template = mhdEmployeeFileRequirementSchema.safeParse({
      ...valid,
      satisfiedByKind: 'DOCUMENT_TEMPLATE',
    });
    expect(template.success).toBe(false);
    expect(template.error?.issues[0]?.path).toEqual(['templateKey']);
  });

  it('requires a label, an employment state and a non-negative whole due-day count', () => {
    expect(mhdEmployeeFileRequirementSchema.safeParse({ ...valid, label: '  ' }).success).toBe(
      false,
    );
    expect(
      mhdEmployeeFileRequirementSchema.safeParse({ ...valid, appliesToStates: [] }).success,
    ).toBe(false);
    expect(
      mhdEmployeeFileRequirementSchema.safeParse({ ...valid, dueDaysAfterHire: '-3' }).success,
    ).toBe(false);
    expect(
      mhdEmployeeFileRequirementSchema.safeParse({ ...valid, dueDaysAfterHire: '14' }).success,
    ).toBe(true);
  });
});
