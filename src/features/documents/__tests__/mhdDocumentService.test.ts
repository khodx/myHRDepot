import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock, fromMock, functionsInvokeMock, renderMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
  fromMock: vi.fn(),
  functionsInvokeMock: vi.fn(),
  renderMock: vi.fn(),
}));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: {
    rpc: rpcMock,
    from: fromMock,
    functions: { invoke: functionsInvokeMock },
  },
}));
vi.mock('../generationEngine', () => ({ mhdRenderDocumentGeneration: renderMock }));

const { mhdDocumentService } = await import('../Service');

const context = { actorUserId: 'user-1' };
const request = {
  templateId: 'template-1',
  companyId: 'company-1',
  entityType: 'TASK',
  entityId: 'task-1',
  mergeData: { task: { title: 'Quarterly report' } },
  outputFormat: 'PDF' as const,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('mhdDocumentService', () => {
  it('maps the merge field catalog and sorts through the shared catalog query', async () => {
    const order = vi.fn().mockReturnThis();
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnValue({ order }),
    });
    order.mockReturnValueOnce({ order }).mockReturnValueOnce({
      returns: vi.fn().mockResolvedValue({
        data: [{ source: 'person', path: 'first_name', label: 'First Name', sample_value: 'Ada', sort_order: 10 }],
        error: null,
      }),
    });

    await expect(mhdDocumentService.listMergeFieldCatalog()).resolves.toEqual([
      { source: 'person', path: 'first_name', label: 'First Name', sampleValue: 'Ada', sortOrder: 10 },
    ]);
    expect(fromMock).toHaveBeenCalledWith('document_merge_field_catalog');
  });

  it('sends the existing full merge payload unchanged when requesting a generation', async () => {
    rpcMock.mockReturnValue({
      returns: vi.fn().mockResolvedValue({ data: [{ id: 'gen-1', reference_id: 'DGEN-1', status: 'PENDING' }], error: null }),
    });

    await expect(mhdDocumentService.requestGeneration(request, context)).resolves.toEqual({
      id: 'gen-1', referenceId: 'DGEN-1', status: 'PENDING',
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_request_document_generation', {
      p_template_id: 'template-1', p_company_id: 'company-1', p_entity_type: 'TASK', p_entity_id: 'task-1',
      p_merge_data: request.mergeData, p_output_format: 'PDF', p_actor_user_id: 'user-1',
    });
  });

  it('rejects a generation request when the RPC returns no row', async () => {
    rpcMock.mockReturnValue({ returns: vi.fn().mockResolvedValue({ data: [], error: null }) });
    await expect(mhdDocumentService.requestGeneration(request, context)).rejects.toThrow('no record returned');
  });

  it('creates a merge batch with the selected recipients', async () => {
    rpcMock.mockReturnValue({ returns: vi.fn().mockResolvedValue({ data: { id: 'batch-1', reference_id: 'DMBT-1' }, error: null }) });
    await expect(mhdDocumentService.requestMergeBatch({ companyId: 'company-1', templateId: 'template-1', outputFormat: 'DOCX', personIds: ['p-1', 'p-2'] })).resolves.toEqual({ id: 'batch-1', referenceId: 'DMBT-1' });
    expect(rpcMock).toHaveBeenCalledWith('mhd_request_document_merge_batch', { p_company_id: 'company-1', p_template_id: 'template-1', p_output_format: 'DOCX', p_person_ids: ['p-1', 'p-2'] });
  });

  it('launches a batch and normalizes snake_case counts', async () => {
    functionsInvokeMock.mockResolvedValue({ data: { success: true, succeeded_count: 2, failed_count: 1 }, error: null });
    await expect(mhdDocumentService.runMergeBatch('batch-1')).resolves.toEqual({ success: true, succeededCount: 2, failedCount: 1 });
    expect(functionsInvokeMock).toHaveBeenCalledWith('document-merge-batch', { body: { batch_id: 'batch-1' } });
  });

  it('maps aggregate batch status and items', async () => {
    rpcMock.mockResolvedValue({ data: { batch: { id: 'batch-1', status: 'COMPLETED', total_count: 2, succeeded_count: 1, failed_count: 1 }, items: [{ id: 'item-1', person_id: 'p-1', status: 'GENERATED', error_message: null }] }, error: null });
    await expect(mhdDocumentService.getMergeBatch('batch-1')).resolves.toEqual({ id: 'batch-1', status: 'COMPLETED', totalCount: 2, succeededCount: 1, failedCount: 1, items: [{ id: 'item-1', personId: 'p-1', status: 'GENERATED', errorMessage: null }] });
  });

  it('records all delivery channel, status, recipient, correspondence, and tracking fields', async () => {
    rpcMock.mockReturnValue({ returns: vi.fn().mockResolvedValue({ data: 'delivery-1', error: null }) });
    await expect(mhdDocumentService.recordDelivery({ documentGenerationId: 'gen-1', channel: 'CERTIFIED_MAIL', status: 'SENT', recipientPersonId: 'p-1', recipientEmail: 'ada@example.com', correspondenceMessageId: 'message-1', trackingCarrier: 'USPS', trackingNumber: 'track-1' })).resolves.toBe('delivery-1');
    expect(rpcMock).toHaveBeenCalledWith('mhd_record_document_delivery', { p_document_generation_id: 'gen-1', p_channel: 'CERTIFIED_MAIL', p_status: 'SENT', p_recipient_person_id: 'p-1', p_recipient_email: 'ada@example.com', p_correspondence_message_id: 'message-1', p_tracking_carrier: 'USPS', p_tracking_number: 'track-1' });
  });

  it('polls to a generated terminal state and returns it', async () => {
    rpcMock.mockImplementation((name: string) => name === 'mhd_request_document_generation'
      ? { returns: vi.fn().mockResolvedValue({ data: [{ id: 'gen-1', reference_id: 'DGEN-1', status: 'PENDING' }], error: null }) }
      : { returns: vi.fn().mockResolvedValue({ data: [{ id: 'gen-1', status: 'GENERATED' }], error: null }) });
    await expect(mhdDocumentService.generateAndPoll(request, context, { pollAttempts: 0, pollIntervalMs: 0 })).resolves.toEqual({ id: 'gen-1', status: 'GENERATED' });
    expect(renderMock).toHaveBeenCalledWith('gen-1', 'Document render');
  });

  it('rejects when polling observes FAILED', async () => {
    rpcMock.mockImplementation((name: string) => name === 'mhd_request_document_generation'
      ? { returns: vi.fn().mockResolvedValue({ data: [{ id: 'gen-1', reference_id: 'DGEN-1', status: 'PENDING' }], error: null }) }
      : { returns: vi.fn().mockResolvedValue({ data: [{ id: 'gen-1', status: 'FAILED' }], error: null }) });
    await expect(mhdDocumentService.generateAndPoll(request, context, { pollAttempts: 0, pollIntervalMs: 0 })).rejects.toThrow('Document generation failed');
  });

  it('completes an uploaded document and fails the generation when completion fails', async () => {
    rpcMock.mockImplementation((name: string) => name === 'mhd_request_document_generation'
      ? { returns: vi.fn().mockResolvedValue({ data: [{ id: 'gen-1', reference_id: 'DGEN-1', status: 'PENDING' }], error: null }) }
      : undefined);
    functionsInvokeMock.mockResolvedValue({ data: { driveFileId: 'drive-1' }, error: null });
    rpcMock.mockImplementationOnce(() => ({ returns: vi.fn().mockResolvedValue({ data: [{ id: 'gen-1', reference_id: 'DGEN-1', status: 'PENDING' }], error: null }) }));
    rpcMock.mockImplementationOnce(() => ({ data: null, error: new Error('completion failed') }));
    rpcMock.mockImplementationOnce(() => ({ data: null, error: null }));
    await expect(mhdDocumentService.uploadCompletedDocument(request, new File(['pdf'], 'notice.pdf', { type: 'application/pdf' }), context)).rejects.toThrow('Unable to record the uploaded document');
    expect(rpcMock).toHaveBeenLastCalledWith('mhd_fail_document_generation', { p_generation_id: 'gen-1', p_reason: 'completion failed', p_actor_user_id: 'user-1' });
  });

  it('sends the failure callback arguments exactly', async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });
    await expect(mhdDocumentService.failGeneration('gen-1', 'render failed', context)).resolves.toBeUndefined();
    expect(rpcMock).toHaveBeenCalledWith('mhd_fail_document_generation', { p_generation_id: 'gen-1', p_reason: 'render failed', p_actor_user_id: 'user-1' });
  });
});
