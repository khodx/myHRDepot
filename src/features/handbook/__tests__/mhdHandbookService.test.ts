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
    const sections = await mhdHandbookService.listSections({
      companyId: 'company-1',
      handbookType: null,
    });
    expect(sections).toEqual([]);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('never queries the library without a company — returns an empty list (0184 fix)', async () => {
    const sections = await mhdHandbookService.listSections({
      companyId: null,
      handbookType: 'EMPLOYEE',
    });
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
          company_id: null,
          handbook_type: 'EMPLOYEE',
          jurisdiction: 'FEDERAL',
          section_key: 'at-will',
          title: 'At-Will Employment',
          body_placeholder: '[ATTORNEY-DRAFTED CONTENT — PLACEHOLDER]',
          is_required: true,
          sort_order: '3', // serialised as a string
          is_active: true,
          is_library: true,
          source_section_id: null,
        },
      ],
      error: null,
    });

    const [section] = await mhdHandbookService.listSections({
      companyId: 'company-1',
      handbookType: 'EMPLOYEE',
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_handbook_section_list', {
      p_company_id: 'company-1',
      p_handbook_type: 'EMPLOYEE',
      p_jurisdiction: undefined,
    });
    expect(section.sortOrder).toBe(3);
    expect(section.isRequired).toBe(true);
    expect(section.isLibrary).toBe(true);
    expect(section.companyId).toBeNull();
  });

  it('creates a GLOBAL section (p_company_id: null) and maps the minted id', async () => {
    // createSection chains `.returns<...>()` after the `as never` args cast (the
    // gen:types nullable-arg workaround shared with Forms/Calendar/Companies), so
    // the mock must expose `.returns()` here rather than resolving `.rpc()` directly.
    rpcMock.mockImplementationOnce(() => ({
      returns: () => Promise.resolve({ data: [{ id: 'sec-2' }], error: null }),
    }));

    const result = await mhdHandbookService.createSection({
      companyId: null,
      handbookType: 'EMPLOYEE',
      jurisdiction: 'FEDERAL',
      sectionKey: 'meal-periods',
      title: 'Meal Periods',
      bodyPlaceholder: '[ATTORNEY-DRAFTED CONTENT — PLACEHOLDER]',
      isRequired: false,
      sortOrder: 100,
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_create_handbook_section', {
      p_company_id: null,
      p_handbook_type: 'EMPLOYEE',
      p_jurisdiction: 'FEDERAL',
      p_section_key: 'meal-periods',
      p_title: 'Meal Periods',
      p_body_placeholder: '[ATTORNEY-DRAFTED CONTENT — PLACEHOLDER]',
      p_is_required: false,
      p_sort_order: 100,
      p_source_section_id: undefined,
    });
    expect(result.id).toBe('sec-2');
  });

  it('updates only the fields present on the input (partial update)', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });

    await mhdHandbookService.updateSection({ sectionId: 'sec-1', isActive: false });

    expect(rpcMock).toHaveBeenCalledWith('mhd_update_handbook_section', {
      p_section_id: 'sec-1',
      p_is_active: false,
    });
  });

  it('forks a library section into a company-owned copy', async () => {
    rpcMock.mockResolvedValueOnce({ data: [{ id: 'sec-3' }], error: null });

    const result = await mhdHandbookService.forkSection({
      sourceSectionId: 'sec-1',
      companyId: 'company-1',
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_fork_handbook_section', {
      p_source_section_id: 'sec-1',
      p_company_id: 'company-1',
    });
    expect(result.id).toBe('sec-3');
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
