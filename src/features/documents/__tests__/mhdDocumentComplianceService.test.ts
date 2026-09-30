import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock, fromMock } = vi.hoisted(() => ({ rpcMock: vi.fn(), fromMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock, from: fromMock },
}));

const { mhdDocumentService } = await import('../Service');

beforeEach(() => vi.clearAllMocks());

describe('mhdDocumentService template compliance', () => {
  it('loads and maps the current template compliance tag', async () => {
    const single = vi.fn().mockResolvedValue({
      data: { compliance_module_key: 'LEAVE', compliance_content_key: 'FMLA_NOTICE' },
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ single });
    fromMock.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) });

    await expect(mhdDocumentService.getTemplateCompliance('template-1')).resolves.toEqual({
      moduleKey: 'LEAVE',
      contentKey: 'FMLA_NOTICE',
    });
    expect(fromMock).toHaveBeenCalledWith('document_templates');
    expect(eq).toHaveBeenCalledWith('id', 'template-1');
  });

  it('returns only the latest version per module and content', async () => {
    const order = vi.fn();
    const rows = [
      { module_key: 'LEAVE', content_key: 'FMLA_NOTICE', version: 3, authority_name: 'DOL', review_status: 'APPROVED', production_enabled: true },
      { module_key: 'LEAVE', content_key: 'FMLA_NOTICE', version: 2, authority_name: 'DOL', review_status: 'SUPERSEDED', production_enabled: false },
      { module_key: 'LEAVE', content_key: 'CFRA_NOTICE', version: 1, authority_name: 'CA', review_status: 'APPROVED', production_enabled: true },
    ];
    fromMock.mockReturnValue({ select: vi.fn().mockReturnValue({ order }) });
    order.mockReturnValueOnce({ order }).mockReturnValueOnce({ order }).mockReturnValueOnce(
      Promise.resolve({ data: rows, error: null }),
    );

    await expect(mhdDocumentService.listComplianceContent()).resolves.toEqual([
      { moduleKey: 'LEAVE', contentKey: 'FMLA_NOTICE', version: 3, authorityName: 'DOL', reviewStatus: 'APPROVED', productionEnabled: true },
      { moduleKey: 'LEAVE', contentKey: 'CFRA_NOTICE', version: 1, authorityName: 'CA', reviewStatus: 'APPROVED', productionEnabled: true },
    ]);
    expect(order).toHaveBeenNthCalledWith(1, 'module_key');
    expect(order).toHaveBeenNthCalledWith(2, 'content_key');
    expect(order).toHaveBeenNthCalledWith(3, 'version', { ascending: false });
  });

  it('sends the exact RPC arguments for setting and clearing a tag', async () => {
    rpcMock.mockResolvedValue({ error: null });

    await mhdDocumentService.setTemplateCompliance('template-1', {
      moduleKey: 'LEAVE',
      contentKey: 'FMLA_NOTICE',
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_set_document_template_compliance', {
      p_template_id: 'template-1', p_module_key: 'LEAVE', p_content_key: 'FMLA_NOTICE',
    });

    await mhdDocumentService.setTemplateCompliance('template-1', {
      moduleKey: null,
      contentKey: null,
    });
    expect(rpcMock).toHaveBeenLastCalledWith('mhd_set_document_template_compliance', {
      p_template_id: 'template-1', p_module_key: null, p_content_key: null,
    });
  });

  it('rejects partial compliance tags before calling the RPC', async () => {
    await expect(mhdDocumentService.setTemplateCompliance('template-1', {
      moduleKey: 'LEAVE', contentKey: null,
    })).rejects.toThrow('must both be set or both be cleared');
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('propagates a compliance RPC refusal with the service error wording', async () => {
    rpcMock.mockResolvedValue({ error: new Error('permission denied') });
    await expect(mhdDocumentService.setTemplateCompliance('template-1', {
      moduleKey: 'LEAVE', contentKey: 'FMLA_NOTICE',
    })).rejects.toThrow('Unable to set template compliance: permission denied');
  });
});
