import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fromMock, invokeMock, maybeSingleMock, rpcMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  invokeMock: vi.fn(),
  maybeSingleMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: {
    rpc: rpcMock,
    from: fromMock,
    functions: { invoke: invokeMock },
  },
}));

const { mhdCaseDocumentsService } = await import('../Service');

const caseDocumentRow = {
  id: 'case-doc-1',
  reference_id: 'CSDOC-000001',
  company_id: 'company-1',
  source_entity_type: 'CONDUCT_CASE',
  source_entity_id: 'case-1',
  document_kind: 'HR_ADVISORY_MEMO',
  title: 'HR advisory memo',
  confidentiality_level: 'RESTRICTED',
  payload: {},
  status: 'DRAFT',
  document_generation_id: null,
  generation_status: null,
  output_drive_file_id: null,
  created_at: '2026-07-25T00:00:00Z',
  updated_at: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  fromMock.mockReturnValue({
    select: () => ({
      eq: () => ({
        maybeSingle: maybeSingleMock,
      }),
    }),
  });
});

describe('mhdCaseDocumentsService', () => {
  it('lists source-linked case documents through the RPC contract', async () => {
    rpcMock.mockResolvedValueOnce({ data: [caseDocumentRow], error: null });

    const documents = await mhdCaseDocumentsService.listForSource('CONDUCT_CASE', 'case-1');

    expect(rpcMock).toHaveBeenCalledWith('mhd_list_case_documents_for_source', {
      p_source_entity_type: 'CONDUCT_CASE',
      p_source_entity_id: 'case-1',
    });
    expect(documents[0]).toMatchObject({
      id: 'case-doc-1',
      referenceId: 'CSDOC-000001',
      sourceEntityType: 'CONDUCT_CASE',
      documentKind: 'HR_ADVISORY_MEMO',
    });
  });

  it('creates and generates an HR advisory memo with escaped merge data', async () => {
    rpcMock
      .mockResolvedValueOnce({
        data: [{ id: 'case-doc-1', reference_id: 'CSDOC-000001', status: 'DRAFT' }],
        error: null,
      })
      .mockResolvedValueOnce({ data: [caseDocumentRow], error: null })
      .mockResolvedValueOnce({
        data: [
          {
            id: 'case-doc-1',
            reference_id: 'CSDOC-000001',
            status: 'GENERATION_REQUESTED',
            document_generation_id: 'generation-1',
          },
        ],
        error: null,
      });
    invokeMock.mockResolvedValueOnce({ data: { success: true }, error: null });
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        id: 'generation-1',
        status: 'GENERATED',
        output_drive_file_id: 'drive-file-1',
        output_document_hash: 'hash-1',
      },
      error: null,
    });

    const result = await mhdCaseDocumentsService.generateHrAdvisoryMemo(
      {
        companyId: 'company-1',
        sourceEntityType: 'CONDUCT_CASE',
        sourceEntityId: 'case-1',
        title: ' HR advisory memo ',
        payload: {
          memo: {
            date: '2026-07-25',
            to: 'HR Director',
            from: 'Advisor',
            subject: 'Review <termination>',
          },
          company: { name: 'Crossroads & Choice' },
          subjectEmployee: { displayName: 'Jane Employee' },
          case: { referenceId: 'COND-000001' },
          purpose: 'Assess risk before separation.',
          documentedIncidents: 'Incident with <resident>.',
        },
      },
      { pollAttempts: 1, pollIntervalMs: 0 },
    );

    expect(rpcMock).toHaveBeenNthCalledWith(1, 'mhd_create_case_document', {
      p_company_id: 'company-1',
      p_source_entity_type: 'CONDUCT_CASE',
      p_source_entity_id: 'case-1',
      p_document_kind: 'HR_ADVISORY_MEMO',
      p_title: 'HR advisory memo',
      p_confidentiality_level: 'RESTRICTED',
      p_payload: expect.objectContaining({
        memo: expect.objectContaining({ subject: 'Review <termination>' }),
      }),
    });
    expect(rpcMock).toHaveBeenNthCalledWith(3, 'mhd_request_case_document_generation', {
      p_case_document_id: 'case-doc-1',
      p_template_key: 'HR_ADVISORY_MEMO',
      p_merge_data: expect.objectContaining({
        memo: expect.objectContaining({ subject: 'Review &lt;termination&gt;' }),
        company: expect.objectContaining({ name: 'Crossroads &amp; Choice' }),
        documented_incidents: 'Incident with &lt;resident&gt;.',
      }),
    });
    expect(invokeMock).toHaveBeenCalledWith('render-document', {
      body: { generation_id: 'generation-1' },
    });
    expect(result).toMatchObject({
      id: 'case-doc-1',
      documentGenerationId: 'generation-1',
      outputDriveFileId: 'drive-file-1',
      outputDocumentHash: 'hash-1',
    });
  });
});
