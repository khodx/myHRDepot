import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));
vi.mock('@/lib/supabase/supabaseClient', () => ({ supabaseClient: { rpc: rpcMock } }));
const { mhdAccommodationsService } = await import('../Service');

beforeEach(() => vi.clearAllMocks());

describe('mhdAccommodationsService notices', () => {
  it('lists and returns the notice rows for a case', async () => {
    const rows = [{ id: 'notice-1', accommodation_case_id: 'case-1', status: 'ISSUED', notice_type: 'DECISION' }];
    rpcMock.mockResolvedValueOnce({ data: rows, error: null });
    await expect(mhdAccommodationsService.listNotices('case-1')).resolves.toEqual(rows);
    expect(rpcMock).toHaveBeenCalledWith('mhd_list_accommodation_notices', { p_case_id: 'case-1' });
  });

  it('records the migration-0238 accommodation notice signature exactly', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'notice-1', error: null });
    await expect(mhdAccommodationsService.recordNotice({
      caseId: 'case-1', noticeType: 'DECISION', templateKey: 'ACCOMMODATION_DECISION', templateVersion: 2, documentGenerationId: 'gen-1',
    })).resolves.toBe('notice-1');
    expect(rpcMock).toHaveBeenCalledWith('mhd_accommodation_notice_record', {
      p_case_id: 'case-1', p_notice_type: 'DECISION', p_template_key: 'ACCOMMODATION_DECISION', p_template_version: 2, p_document_generation_id: 'gen-1',
    });
  });

  it('marks an accommodation notice delivered with its declared arguments', async () => {
    rpcMock.mockResolvedValueOnce({ error: null });
    await mhdAccommodationsService.markNoticeDelivery({ noticeId: 'notice-1', status: 'DELIVERED' });
    expect(rpcMock).toHaveBeenCalledWith('mhd_accommodation_notice_mark_delivery', { p_notice_id: 'notice-1', p_status: 'DELIVERED' });
  });
});
