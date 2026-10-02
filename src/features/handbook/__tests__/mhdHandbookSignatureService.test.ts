import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  getPersonById: vi.fn(),
  getTemplateIdByKey: vi.fn(),
  requestGeneration: vi.fn(),
  render: vi.fn(),
  poll: vi.fn(),
  createRequest: vi.fn(),
}));

vi.mock('@/lib/supabase/supabaseClient', () => ({ supabaseClient: { rpc: mocks.rpc } }));
vi.mock('@/features/people/Service', () => ({
  mhdPersonService: { getPersonById: mocks.getPersonById },
}));
vi.mock('@/features/documents/Service', () => ({
  mhdDocumentService: {
    getTemplateIdByKey: mocks.getTemplateIdByKey,
    requestGeneration: mocks.requestGeneration,
  },
  mhdRenderDocumentGeneration: mocks.render,
  mhdPollDocumentGenerationUntilGenerated: mocks.poll,
}));
vi.mock('@/features/esignature/Service', () => ({
  mhdEsignatureService: { createRequestFromGeneratedDocument: mocks.createRequest },
}));

const { mhdHandbookService } = await import('../Service');

const INPUT = {
  ackId: 'ack-1' as never,
  companyId: 'company-1',
  personId: 'person-1',
  actorUserId: 'admin-1',
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getPersonById.mockResolvedValue({
    displayName: 'Alex Rivera',
    primaryEmail: 'alex@example.org',
  });
  mocks.getTemplateIdByKey.mockResolvedValue('tpl-1');
  mocks.requestGeneration.mockResolvedValue({
    id: 'gen-1',
    referenceId: 'DOCG-1',
    status: 'PENDING',
  });
  mocks.render.mockResolvedValue(undefined);
  mocks.poll.mockResolvedValue({
    id: 'gen-1',
    status: 'GENERATED',
    output_document_hash: 'hash-1',
  });
  mocks.createRequest.mockResolvedValue({ request: { id: 'sig-1' }, invitationErrors: [] });
  mocks.rpc.mockResolvedValue({ data: null, error: null });
});

describe('requestAcknowledgmentSignature', () => {
  it('renders the receipt for this acknowledgment, requests the signature, then attaches it', async () => {
    const result = await mhdHandbookService.requestAcknowledgmentSignature(INPUT);

    expect(mocks.getTemplateIdByKey).toHaveBeenCalledWith('HANDBOOK_ACKNOWLEDGMENT', 'company-1');
    expect(mocks.requestGeneration).toHaveBeenCalledWith(
      {
        templateId: 'tpl-1',
        companyId: 'company-1',
        entityType: 'HANDBOOK_ACK',
        entityId: 'ack-1',
        mergeData: {},
        outputFormat: 'PDF',
      },
      { actorUserId: 'admin-1' },
    );
    expect(mocks.render).toHaveBeenCalledWith('gen-1', expect.any(String));
    expect(mocks.createRequest).toHaveBeenCalledWith({
      companyId: 'company-1',
      generationId: 'gen-1',
      documentHash: 'hash-1',
      signers: [
        { kind: 'external', externalEmail: 'alex@example.org', externalName: 'Alex Rivera' },
      ],
      signingOrder: 'SEQUENTIAL',
    });
    expect(mocks.rpc).toHaveBeenCalledWith('mhd_handbook_link_signature', {
      p_ack_id: 'ack-1',
      p_esignature_request_id: 'sig-1',
    });
    expect(result).toEqual({ esignatureRequestId: 'sig-1', invitationErrors: [] });
  });

  it('never sends the merge data from the client — the server builds the receipt', async () => {
    await mhdHandbookService.requestAcknowledgmentSignature(INPUT);
    expect(mocks.requestGeneration.mock.calls[0][0].mergeData).toEqual({});
  });

  it('reports invitation email failures but still attaches the request', async () => {
    mocks.createRequest.mockResolvedValueOnce({
      request: { id: 'sig-2' },
      invitationErrors: ['alex@example.org: bounced'],
    });
    const result = await mhdHandbookService.requestAcknowledgmentSignature(INPUT);

    expect(result.invitationErrors).toEqual(['alex@example.org: bounced']);
    expect(mocks.rpc).toHaveBeenCalledWith('mhd_handbook_link_signature', {
      p_ack_id: 'ack-1',
      p_esignature_request_id: 'sig-2',
    });
  });

  it('stops before rendering anything when the person has no email', async () => {
    mocks.getPersonById.mockResolvedValueOnce({ displayName: 'No Email', primaryEmail: '  ' });

    await expect(mhdHandbookService.requestAcknowledgmentSignature(INPUT)).rejects.toThrow(
      /no email on record|no primary email/i,
    );
    expect(mocks.requestGeneration).not.toHaveBeenCalled();
    expect(mocks.createRequest).not.toHaveBeenCalled();
  });

  it('stops when the receipt template does not exist', async () => {
    mocks.getTemplateIdByKey.mockResolvedValueOnce(null);

    await expect(mhdHandbookService.requestAcknowledgmentSignature(INPUT)).rejects.toThrow(
      /template was not found/i,
    );
    expect(mocks.requestGeneration).not.toHaveBeenCalled();
  });

  it('refuses a receipt that came back without a content hash', async () => {
    mocks.poll.mockResolvedValueOnce({
      id: 'gen-1',
      status: 'GENERATED',
      output_document_hash: null,
    });

    await expect(mhdHandbookService.requestAcknowledgmentSignature(INPUT)).rejects.toThrow(
      /without a content hash/i,
    );
    expect(mocks.createRequest).not.toHaveBeenCalled();
  });

  it('does not attach anything when the signature engine fails', async () => {
    mocks.createRequest.mockRejectedValueOnce(new Error('Unable to create signature request'));

    await expect(mhdHandbookService.requestAcknowledgmentSignature(INPUT)).rejects.toThrow(
      /unable to create signature request/i,
    );
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('surfaces the server refusal to attach the request', async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "That signature request is not for this acknowledgment's receipt" },
    });

    await expect(mhdHandbookService.requestAcknowledgmentSignature(INPUT)).rejects.toMatchObject({
      message: expect.stringContaining('not for this acknowledgment'),
    });
  });
});

describe('policy and fork arguments', () => {
  it('sends the signature requirement only when it is given', async () => {
    await mhdHandbookService.setAckPolicy({ handbookId: 'hbk-1' as never, dueDays: 30 });
    expect(mocks.rpc).toHaveBeenLastCalledWith('mhd_handbook_set_ack_policy', {
      p_handbook_id: 'hbk-1',
      p_due_days: 30,
    });

    await mhdHandbookService.setAckPolicy({
      handbookId: 'hbk-1' as never,
      dueDays: 14,
      requiresSignature: true,
    });
    expect(mocks.rpc).toHaveBeenLastCalledWith('mhd_handbook_set_ack_policy', {
      p_handbook_id: 'hbk-1',
      p_due_days: 14,
      p_requires_signature: true,
    });
  });

  it('forks with subsections only when asked', async () => {
    mocks.rpc.mockResolvedValue({ data: [{ id: 'root-copy' }, { id: 'child-copy' }], error: null });

    await mhdHandbookService.forkSection({ sourceSectionId: 'sec-1', companyId: 'company-1' });
    expect(mocks.rpc).toHaveBeenLastCalledWith('mhd_fork_handbook_section', {
      p_source_section_id: 'sec-1',
      p_company_id: 'company-1',
    });

    const result = await mhdHandbookService.forkSection({
      sourceSectionId: 'sec-1',
      companyId: 'company-1',
      includeDescendants: true,
    });
    expect(mocks.rpc).toHaveBeenLastCalledWith('mhd_fork_handbook_section', {
      p_source_section_id: 'sec-1',
      p_company_id: 'company-1',
      p_include_descendants: true,
    });
    // The root copy comes first, so the editor opens on the section that was forked.
    expect(result.id).toBe('root-copy');
  });
});
