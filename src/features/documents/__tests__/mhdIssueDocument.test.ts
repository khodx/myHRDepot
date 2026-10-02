import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fromMock, invokeMock, maybeSingleMock, returnsMock, rpcMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
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

const { mhdIssueGeneratedDocument } = await import('../issueDocument');

const baseInput = {
  label: 'Corrective action',
  retryHint: 'Retry the issue action once rendering finishes.',
  companyId: 'company-1',
  templateId: 'template-1',
  entityType: 'CONDUCT_ACTION',
  entityId: 'action-1',
  mergeData: { custom: { note: 'x' } },
  pollAttempts: 1,
  pollIntervalMs: 0,
};

function generatedRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'generation-1',
    status: 'GENERATED',
    output_drive_file_id: 'drive-1',
    output_document_hash: 'hash-1',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  rpcMock.mockImplementation(() => ({ returns: returnsMock }));
  returnsMock.mockResolvedValue({
    data: [{ id: 'generation-1', reference_id: 'DGEN-1', status: 'PENDING' }],
    error: null,
  });
  invokeMock.mockResolvedValue({ data: { success: true }, error: null });
  fromMock.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: maybeSingleMock }) }) });
  maybeSingleMock.mockResolvedValue({ data: generatedRow(), error: null });
});

describe('mhdIssueGeneratedDocument', () => {
  it('requests, renders, polls, hashes and creates the signature request, reporting steps 1-5', async () => {
    const createRequest = vi.fn().mockResolvedValue({ requestId: 'sig-1', invitationErrors: ['one'] });
    const steps: number[] = [];

    const result = await mhdIssueGeneratedDocument({
      ...baseInput,
      onStep: (step) => steps.push(step),
      signing: { createRequest },
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_request_document_generation', {
      p_company_id: 'company-1',
      p_template_id: 'template-1',
      p_entity_type: 'CONDUCT_ACTION',
      p_entity_id: 'action-1',
      p_merge_data: { custom: { note: 'x' } },
    });
    expect(invokeMock).toHaveBeenCalledWith('render-document', { body: { generation_id: 'generation-1' } });
    expect(createRequest).toHaveBeenCalledWith({ generationId: 'generation-1', documentHash: 'hash-1' });
    expect(steps).toEqual([1, 2, 3, 4, 5]);
    expect(result).toEqual({
      generationId: 'generation-1',
      documentHash: 'hash-1',
      esignatureRequestId: 'sig-1',
      invitationErrors: ['one'],
    });
  });

  it('forwards the actor only when one is given', async () => {
    await mhdIssueGeneratedDocument({ ...baseInput, actorUserId: 'user-9' });
    expect(rpcMock).toHaveBeenCalledWith(
      'mhd_request_document_generation',
      expect.objectContaining({ p_actor_user_id: 'user-9' }),
    );
  });

  it('skips the hash and signature steps for a document that is only generated', async () => {
    const steps: number[] = [];

    const result = await mhdIssueGeneratedDocument({ ...baseInput, onStep: (step) => steps.push(step) });

    expect(steps).toEqual([1, 2, 3]);
    expect(result).toEqual({
      generationId: 'generation-1',
      documentHash: 'hash-1',
      esignatureRequestId: null,
      invitationErrors: [],
    });
  });

  it('returns a null hash for an unsigned document the renderer did not hash', async () => {
    maybeSingleMock.mockResolvedValue({ data: generatedRow({ output_document_hash: null }), error: null });
    const result = await mhdIssueGeneratedDocument(baseInput);
    expect(result.documentHash).toBeNull();
  });

  it('prefixes a failed request with the label and step', async () => {
    returnsMock.mockResolvedValue({ data: null, error: { message: 'boom' } });
    await expect(mhdIssueGeneratedDocument(baseInput)).rejects.toThrow(
      'Corrective action step 1 (request document generation) failed: boom',
    );
  });

  it('fails when no generation id comes back', async () => {
    returnsMock.mockResolvedValue({ data: [], error: null });
    await expect(mhdIssueGeneratedDocument(baseInput)).rejects.toThrow(
      'Corrective action step 1 (request document generation) failed: no generation id returned.',
    );
  });

  it('prefixes a failed render with the label and step', async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: 'function unavailable' } });
    await expect(mhdIssueGeneratedDocument(baseInput)).rejects.toThrow(
      'Corrective action step 2 (render document) failed: function unavailable',
    );
  });

  it('adds the retry hint when rendering does not finish in time', async () => {
    maybeSingleMock.mockResolvedValue({ data: generatedRow({ status: 'PENDING' }), error: null });
    await expect(mhdIssueGeneratedDocument(baseInput)).rejects.toThrow(
      'did not complete in time (last status: PENDING). Retry the issue action once rendering finishes.',
    );
  });

  it('refuses to sign without a hash, and accepts a manual one', async () => {
    maybeSingleMock.mockResolvedValue({ data: generatedRow({ output_document_hash: null }), error: null });
    const createRequest = vi.fn().mockResolvedValue({ requestId: 'sig-1', invitationErrors: [] });

    await expect(
      mhdIssueGeneratedDocument({ ...baseInput, signing: { createRequest } }),
    ).rejects.toThrow(
      'Corrective action step 4 (document hash) failed: the generation has no auto-stamped hash and no manual hash was provided.',
    );
    expect(createRequest).not.toHaveBeenCalled();

    const result = await mhdIssueGeneratedDocument({
      ...baseInput,
      manualDocumentHash: '  manual-hash ',
      signing: { createRequest },
    });
    expect(result.documentHash).toBe('manual-hash');
    expect(createRequest).toHaveBeenCalledWith({ generationId: 'generation-1', documentHash: 'manual-hash' });
  });

  it('wraps a signature-request failure with the label, step and cause', async () => {
    const cause = new Error('no email on record');
    const createRequest = vi.fn().mockRejectedValue(cause);

    const failure = await mhdIssueGeneratedDocument({ ...baseInput, signing: { createRequest } }).catch(
      (error: unknown) => error,
    );

    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toBe(
      'Corrective action step 5 (create signature request) failed: no email on record',
    );
    expect((failure as Error).cause).toBe(cause);
  });
});
