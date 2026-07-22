import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

const { mhdHandbookService } = await import('../Service');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('mhdHandbookService — contract + mapping', () => {
  it('never queries the library without a handbook type — returns an empty list', async () => {
    const sections = await mhdHandbookService.listSections({ handbookType: null });
    expect(sections).toEqual([]);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('never queries the handbook list without a company', async () => {
    const handbooks = await mhdHandbookService.list({ companyId: null });
    expect(handbooks).toEqual([]);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('normalises a PostgREST numeric-string sort_order on the library read', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'sec-1',
          handbook_type: 'EMPLOYEE',
          jurisdiction: 'FEDERAL',
          section_key: 'at-will',
          title: 'At-Will Employment',
          body_placeholder: '[ATTORNEY-DRAFTED CONTENT — PLACEHOLDER]',
          is_required: true,
          sort_order: '3', // serialised as a string
          is_active: true,
        },
      ],
      error: null,
    });

    const [section] = await mhdHandbookService.listSections({ handbookType: 'EMPLOYEE' });
    expect(rpcMock).toHaveBeenCalledWith('mhd_handbook_section_list', {
      p_handbook_type: 'EMPLOYEE',
      p_jurisdiction: undefined,
    });
    expect(section.sortOrder).toBe(3);
    expect(section.isRequired).toBe(true);
  });

  it('maps a frozen version — numeric-string version_number and the assembled snapshot', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'ver-1',
          reference_id: 'HBV-0001',
          handbook_id: 'hbk-1',
          version_number: '2', // serialised as a string
          assembled_content: [
            {
              jurisdiction: 'FEDERAL',
              section_key: 'at-will',
              title: 'At-Will Employment',
              body: '[ATTORNEY-DRAFTED CONTENT — PLACEHOLDER]',
            },
          ],
          content_hash: 'deadbeef',
          effective_date: null,
          document_generation_id: null,
          published_at: '2026-07-20T00:00:00Z',
        },
      ],
      error: null,
    });

    const version = await mhdHandbookService.versionGet('ver-1');
    expect(version?.versionNumber).toBe(2);
    expect(version?.contentHash).toBe('deadbeef');
    expect(version?.assembledContent).toHaveLength(1);
    expect(version?.assembledContent[0].title).toBe('At-Will Employment');
  });

  it('forwards the publish doc-gen soft link and surfaces the minted hash', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ id: 'ver-1', reference_id: 'HBV-0001', version_number: 1, content_hash: 'abc123' }],
      error: null,
    });

    const result = await mhdHandbookService.publish({
      handbookId: 'hbk-1',
      effectiveDate: '2026-08-01',
      documentGenerationId: 'docgen-9',
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_handbook_publish', {
      p_handbook_id: 'hbk-1',
      p_effective_date: '2026-08-01',
      p_document_generation_id: 'docgen-9',
    });
    expect(result.contentHash).toBe('abc123');
  });

  it('surfaces the acknowledgment signature-gate error VERBATIM (does not pre-empt the server)', async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'The acknowledgment signature is not yet complete' },
    });

    await expect(
      mhdHandbookService.acknowledge({ ackId: 'ack-1', esignatureRequestId: 'sig-1' }),
    ).rejects.toMatchObject({ message: 'The acknowledgment signature is not yet complete' });
    expect(rpcMock).toHaveBeenCalledWith('mhd_handbook_acknowledge', {
      p_ack_id: 'ack-1',
      p_esignature_request_id: 'sig-1',
    });
  });

  it('calls the no-arg my_acknowledgments RPC and maps the rows', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'ack-1',
          handbook_version_id: 'ver-1',
          handbook_title: '2026 Employee Handbook',
          handbook_type: 'EMPLOYEE',
          version_number: 1,
          status: 'PENDING',
          esignature_request_id: null,
          acknowledged_at: null,
        },
      ],
      error: null,
    });

    const [ack] = await mhdHandbookService.myAcknowledgments();
    expect(rpcMock).toHaveBeenCalledWith('mhd_handbook_my_acknowledgments', undefined);
    expect(ack.status).toBe('PENDING');
    expect(ack.handbookTitle).toBe('2026 Employee Handbook');
  });
});
