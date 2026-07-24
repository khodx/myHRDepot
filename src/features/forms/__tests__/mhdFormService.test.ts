import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mhdFormCalculationEngine, mhdFormLogicEngine, mhdFormService } from '../Service';
import type { MhdFormCalculation, MhdFormLogicRule } from '../Types';

const { mockRpc, mockReturns, mockFrom, mockDelete, mockEq, mockInsert, mockInvoke } = vi.hoisted(
  () => {
    const mockReturns = vi.fn();
    const mockRpc = vi.fn();
    const mockEq = vi.fn();
    const mockDelete = vi.fn(() => ({ eq: mockEq }));
    const mockInsert = vi.fn();
    const mockFrom = vi.fn(() => ({ delete: mockDelete, insert: mockInsert }));
    const mockInvoke = vi.fn();
    return { mockRpc, mockReturns, mockFrom, mockDelete, mockEq, mockInsert, mockInvoke };
  },
);

vi.mock('@/config/appConfig', () => ({
  appConfig: {
    attachmentUploadFunctionName: 'mhd-drive-upload',
  },
}));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: {
    rpc: mockRpc,
    from: mockFrom,
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

describe('mhdFormService', () => {
  beforeEach(() => {
    mockRpc.mockClear();
    mockRpc.mockImplementation(() => ({ returns: mockReturns }));
    mockReturns.mockReset();
    mockFrom.mockClear();
    mockDelete.mockClear();
    mockEq.mockClear();
    mockInsert.mockReset();
    mockInvoke.mockReset();
  });

  it('maps live list-form rows and normalizes seeded legacy field types for the renderer', async () => {
    mockReturns.mockResolvedValueOnce({
      data: [
        {
          id: 'form-1',
          reference_id: 'FORM-000001',
          company_id: 'company-1',
          name: 'New Hire - Direct Deposit',
          description: 'Direct deposit setup for new hires.',
          status: 'DRAFT',
          version: 1,
          previous_version_id: null,
          created_at: '2026-07-17T00:00:00Z',
          created_by: 'user-1',
          updated_at: '2026-07-17T00:00:00Z',
          updated_by: 'user-1',
          published_at: null,
          published_by: null,
          definition: {
            id: 'form-1',
            name: 'New Hire - Direct Deposit',
            description: 'Direct deposit setup for new hires.',
            pages: [
              {
                id: 'page-1',
                title: 'Page 1',
                fields: ['field-1', 'field-2', 'field-3'],
                order: 1,
              },
            ],
            fields: [
              {
                id: 'field-1',
                type: 'text_field',
                label: 'Bank Name',
                required: true,
                hidden: false,
                options: [],
              },
              {
                id: 'field-2',
                type: 'dropdown',
                label: 'Account Type',
                required: true,
                hidden: false,
                options: [{ value: 'CHECKING', label: 'Checking' }],
              },
              {
                id: 'field-3',
                type: 'long_text',
                label: 'Notes',
                required: false,
                hidden: false,
                options: [],
              },
            ],
            logic: [],
            calculations: [],
            settings: { allowDraft: true, multiPage: false, progressBar: true },
          },
        },
      ],
      error: null,
    });

    const result = await mhdFormService.listFormsForCompany('company-1');

    expect(mockRpc).toHaveBeenCalledWith('mhd_list_forms', { p_company_id: 'company-1' });
    expect(result).toHaveLength(1);
    expect(result[0].definition.fields[0]?.type).toBe('text');
    expect(result[0].definition.fields[1]?.type).toBe('select');
    expect(result[0].definition.fields[2]?.type).toBe('longtext');
  });

  it('omits optional create-form args rather than passing null', async () => {
    mockReturns
      .mockResolvedValueOnce({ data: [{ id: 'form-1' }], error: null })
      .mockResolvedValueOnce({
        data: [
          {
            id: 'form-1',
            reference_id: 'FORM-000001',
            company_id: 'company-1',
            name: 'Offer Letter',
            description: '',
            status: 'DRAFT',
            version: 1,
            previous_version_id: null,
            created_at: '2026-07-17T00:00:00Z',
            created_by: 'user-1',
            updated_at: '2026-07-17T00:00:00Z',
            updated_by: 'user-1',
            published_at: null,
            published_by: null,
            definition: {
              id: 'form-1',
              name: 'Offer Letter',
              pages: [{ id: 'page-1', title: 'Page 1', fields: [], order: 1 }],
              fields: [],
              logic: [],
              calculations: [],
              settings: { allowDraft: true, multiPage: false, progressBar: true },
            },
          },
        ],
        error: null,
      });

    await mhdFormService.createForm(
      {
        name: 'Offer Letter',
        definition: {
          id: 'form-1',
          name: 'Offer Letter',
          pages: [{ id: 'page-1', title: 'Page 1', fields: [], order: 1 }],
          fields: [],
          logic: [],
          calculations: [],
          settings: { allowDraft: true, multiPage: false, progressBar: true },
        },
      },
      'company-1',
    );

    const createArgs = mockRpc.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(createArgs).toBeDefined();
    expect(createArgs.p_company_id).toBe('company-1');
    expect(createArgs.p_name).toBe('Offer Letter');
    expect('p_description' in createArgs).toBe(false);
  });

  it('omits optional submission values unless provided', async () => {
    mockRpc.mockReturnValueOnce(Promise.resolve({ error: null }));
    mockRpc.mockReturnValueOnce(Promise.resolve({ error: null }));
    mockReturns.mockResolvedValueOnce({
      data: [
        {
          id: 'submission-1',
          reference_id: 'SUBM-000001',
          form_id: 'form-1',
          submitter_id: 'user-1',
          task_id: null,
          status: 'SUBMITTED',
          values: {},
          created_at: '2026-07-17T00:00:00Z',
          updated_at: '2026-07-17T00:00:00Z',
          submitted_at: '2026-07-17T00:05:00Z',
          is_draft: false,
        },
      ],
      error: null,
    });

    await mhdFormService.submitForm('submission-1');

    const submitArgs = mockRpc.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(submitArgs).toEqual({ p_submission_id: 'submission-1' });
    expect(mockRpc.mock.calls[1]).toEqual([
      'mhd_apply_form_submission_to_destination',
      { p_submission_id: 'submission-1' },
    ]);
  });

  describe('uploadSubmissionFile (file field -> Drive bridge)', () => {
    it('uploads through the Drive edge function, then inserts a form_submission_attachments row with the Stage-7 compatibility mapping', async () => {
      const file = new File(['hello'], 'void-check.pdf', { type: 'application/pdf' });

      mockInvoke.mockResolvedValueOnce({
        data: {
          driveFileId: 'drive-file-123',
          driveFolderId: 'drive-folder-456',
          driveWebViewLink: 'https://drive.google.com/file/d/drive-file-123/view',
          driveWebContentLink: 'https://drive.google.com/uc?id=drive-file-123',
          storedFileName: 'void-check.pdf',
        },
        error: null,
      });
      mockInsert.mockResolvedValueOnce({ error: null });

      const reference = await mhdFormService.uploadSubmissionFile('submission-1', 'field-1', file);

      expect(mockInvoke).toHaveBeenCalledTimes(1);
      expect(mockInvoke.mock.calls[0][0]).toBe('mhd-drive-upload');

      expect(mockFrom).toHaveBeenCalledWith('form_submission_attachments');
      // drive_file_id stores the Drive file id and file_name the original file
      // name.
      expect(mockInsert).toHaveBeenCalledWith({
        submission_id: 'submission-1',
        field_id: 'field-1',
        drive_file_id: 'drive-file-123',
        file_name: 'void-check.pdf',
        file_size_bytes: file.size,
        mime_type: 'application/pdf',
      });

      // The submission value is a reference (Drive file id + metadata), never raw bytes.
      expect(reference).toEqual({
        driveFileId: 'drive-file-123',
        fileName: 'void-check.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: file.size,
        driveWebViewLink: 'https://drive.google.com/file/d/drive-file-123/view',
      });
    });

    it('throws and records nothing when the Drive edge function fails', async () => {
      const file = new File(['hello'], 'void-check.pdf', { type: 'application/pdf' });

      mockInvoke.mockResolvedValueOnce({
        data: null,
        error: { message: 'Drive credentials missing' },
      });

      await expect(
        mhdFormService.uploadSubmissionFile('submission-1', 'field-1', file),
      ).rejects.toThrow('Drive credentials missing');
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('throws when the attachment row insert fails', async () => {
      const file = new File(['hello'], 'void-check.pdf', { type: 'application/pdf' });

      mockInvoke.mockResolvedValueOnce({
        data: {
          driveFileId: 'drive-file-123',
          driveFolderId: 'drive-folder-456',
          driveWebViewLink: null,
          driveWebContentLink: null,
        },
        error: null,
      });
      mockInsert.mockResolvedValueOnce({
        error: { message: 'RLS: submission does not belong to user' },
      });

      await expect(
        mhdFormService.uploadSubmissionFile('submission-1', 'field-1', file),
      ).rejects.toThrow(
        'Unable to record form attachment: RLS: submission does not belong to user',
      );
    });

    it('rejects disallowed files before invoking the edge function', async () => {
      const file = new File(['binary'], 'virus.exe', { type: 'application/x-msdownload' });

      await expect(
        mhdFormService.uploadSubmissionFile('submission-1', 'field-1', file),
      ).rejects.toThrow('not permitted');
      expect(mockInvoke).not.toHaveBeenCalled();
      expect(mockInsert).not.toHaveBeenCalled();
    });
  });
});

describe('mhdFormLogicEngine', () => {
  it('evaluates simple and grouped conditions', () => {
    expect(
      mhdFormLogicEngine.evaluateCondition(
        { field: 'role', operator: 'equals', value: 'Manager' },
        { role: 'Manager' },
      ),
    ).toBe(true);

    const group = {
      combinator: 'AND' as const,
      conditions: [
        { field: 'employmentStatus', operator: 'equals' as const, value: 'Yes' },
        { field: 'role', operator: 'equals' as const, value: 'Manager' },
      ],
    };

    expect(
      mhdFormLogicEngine.evaluateNode(group, { employmentStatus: 'Yes', role: 'Manager' }),
    ).toBe(true);
    expect(
      mhdFormLogicEngine.evaluateNode(group, { employmentStatus: 'Yes', role: 'Employee' }),
    ).toBe(false);
  });

  it('resolves SHOW/HIDE and REQUIRE rules against default-hidden fields', () => {
    const rules: MhdFormLogicRule[] = [
      {
        id: 'rule-1',
        order: 1,
        condition: { field: 'isManager', operator: 'equals', value: true },
        action: 'SHOW',
        targetFieldId: 'managerNotes',
      },
      {
        id: 'rule-2',
        order: 2,
        condition: { field: 'isManager', operator: 'equals', value: true },
        action: 'REQUIRE',
        targetFieldId: 'managerNotes',
      },
    ];

    const result = mhdFormLogicEngine.evaluateAllLogic(rules, { isManager: true }, [
      'managerNotes',
    ]);
    expect(result.hiddenFields.has('managerNotes')).toBe(false);
    expect(result.requiredFields.has('managerNotes')).toBe(true);
  });
});

describe('mhdFormCalculationEngine', () => {
  it('evaluates formula, sum, and concatenate calculations', () => {
    const formulaResult = mhdFormCalculationEngine.evaluateCalculation(
      {
        id: 'calc-1',
        targetFieldId: 'tax',
        op: 'formula',
        formula: 'salary * 0.15',
        dependencies: ['salary'],
      },
      { salary: 100000 },
    );

    expect(formulaResult).toBe(15000);

    const calculations: MhdFormCalculation[] = [
      { id: 'calc-2', targetFieldId: 'total', op: 'sum', dependencies: ['a', 'b'] },
      { id: 'calc-3', targetFieldId: 'label', op: 'concatenate', dependencies: ['first', 'last'] },
    ];

    const results = mhdFormCalculationEngine.evaluateAllCalculations(calculations, {
      a: 5,
      b: 7,
      first: 'Jane',
      last: 'Doe',
    });

    expect(results.total).toBe(12);
    expect(results.label).toBe('Jane Doe');
  });
});
