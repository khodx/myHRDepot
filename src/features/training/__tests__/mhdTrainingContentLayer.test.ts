import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mhdCreateBlockSchema,
  mhdCreateCurriculumSchema,
  mhdCreateProgramSchema,
} from '../Schemas';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));
vi.mock('@/lib/supabase/supabaseClient', () => ({ supabaseClient: { rpc: rpcMock } }));
const { mhdTrainingService } = await import('../Service');

describe('LMS v2 content schemas', () => {
  it('requires curriculum and program titles', () => {
    expect(() => mhdCreateCurriculumSchema.parse({ companyId: 'c', title: '  ' })).toThrow(
      'A title is required.',
    );
    expect(() => mhdCreateProgramSchema.parse({ companyId: 'c', title: '' })).toThrow(
      'A title is required.',
    );
  });

  it('accepts arbitrary JSON object content for a block', () => {
    const value = mhdCreateBlockSchema.parse({
      lessonId: 'l',
      blockType: 'RICH_TEXT',
      content: { html: '<p>Hi</p>' },
    });
    expect(value.content).toEqual({ html: '<p>Hi</p>' });
  });

  it('rejects block content that is not an object', () => {
    expect(() =>
      mhdCreateBlockSchema.parse({ lessonId: 'l', blockType: 'VIDEO', content: [] }),
    ).toThrow();
  });
});

describe('LMS v2 content service mappers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maps curriculum and program rows to camelCase', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'cur-1',
          reference_id: 'CUR-0001',
          company_id: 'c',
          title: 'Core',
          description: null,
          is_active: true,
          is_global: false,
        },
      ],
      error: null,
    });
    const [curriculum] = await mhdTrainingService.listCurriculums('c');
    expect(curriculum).toMatchObject({ referenceId: 'CUR-0001', companyId: 'c', isActive: true });

    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'prg-1',
          reference_id: 'PRG-0001',
          company_id: 'c',
          curriculum_id: 'cur-1',
          title: 'Onboarding',
          description: null,
          sort_order: '2',
          is_global: false,
        },
      ],
      error: null,
    });
    const [program] = await mhdTrainingService.listPrograms({
      companyId: 'c',
      curriculumId: 'cur-1',
    });
    expect(program).toMatchObject({ referenceId: 'PRG-0001', curriculumId: 'cur-1', sortOrder: 2 });
  });

  it('uses the RPC contract for block creation and maps its mutation result', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ id: 'blk-1', reference_id: 'BLK-0001' }],
      error: null,
    });
    const result = await mhdTrainingService.createBlock({
      lessonId: 'lesson-1',
      blockType: 'CALLOUT',
      content: { tone: 'info' },
    });
    expect(rpcMock).toHaveBeenCalledWith(
      'mhd_training_block_create',
      expect.objectContaining({
        p_lesson_id: 'lesson-1',
        p_block_type: 'CALLOUT',
        p_content: { tone: 'info' },
        p_sort_order: 0,
      }),
    );
    expect(result).toEqual({ id: 'blk-1', referenceId: 'BLK-0001' });
  });
});
