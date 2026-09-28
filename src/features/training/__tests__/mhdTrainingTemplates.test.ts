import { describe, expect, it, vi } from 'vitest';
import { mhdCreateTrainingTemplateSchema, mhdCreateTrainingTemplateSlotSchema } from '../Schemas';

describe('training template schemas', () => {
  it('defaults new templates to composable', () => {
    expect(mhdCreateTrainingTemplateSchema.parse({ companyId: 'company-1', title: 'Safety' }).rigidity).toBe('COMPOSABLE');
  });
  it('accepts only the renderer-supported slot block types', () => {
    expect(() => mhdCreateTrainingTemplateSlotSchema.parse({ templateId: 't', slotLabel: 'Intro', expectedBlockType: 'AUDIO' })).toThrow();
    expect(mhdCreateTrainingTemplateSlotSchema.parse({ templateId: 't', slotLabel: 'Intro', expectedBlockType: 'RICH_TEXT' }).isRequired).toBe(true);
  });
});

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));
vi.mock('@/lib/supabase/supabaseClient', () => ({ supabaseClient: { rpc: rpcMock } }));
vi.mock('@/features/documents/Service', () => ({ mhdRenderDocumentGeneration: vi.fn(), mhdPollDocumentGenerationUntilGenerated: vi.fn() }));

const { mhdTrainingService } = await import('../Service');

describe('training template service', () => {
  it('maps templates and slots and sends clear semantics to update', async () => {
    rpcMock
      .mockResolvedValueOnce({ data: [{ id: 't1', reference_id: 'TPL-1', company_id: 'c1', title: 'Safety', description: null, rigidity: 'LOCKED', is_active: true, is_global: false }], error: null })
      .mockResolvedValueOnce({ data: [{ id: 's1', template_id: 't1', sort_order: '2', slot_label: 'Intro', expected_block_type: 'RICH_TEXT', is_required: true }], error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    await expect(mhdTrainingService.listTemplates('c1')).resolves.toMatchObject([{ rigidity: 'LOCKED' }]);
    await expect(mhdTrainingService.listTemplateSlots('t1')).resolves.toEqual([{ id: 's1', templateId: 't1', sortOrder: 2, slotLabel: 'Intro', expectedBlockType: 'RICH_TEXT', isRequired: true }]);
    await mhdTrainingService.updateTemplateSlot({ slotId: 's1', clearExpectedBlockType: true });
    expect(rpcMock).toHaveBeenLastCalledWith('mhd_training_template_slot_update', expect.objectContaining({ p_slot_id: 's1', p_clear_expected_block_type: true }));
  });
});
