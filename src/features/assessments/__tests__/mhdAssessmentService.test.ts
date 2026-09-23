import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));
vi.mock('@/lib/supabase/supabaseClient', () => ({ supabaseClient: { rpc: rpcMock } }));
const { mhdAssessmentService } = await import('../Service');

describe('mhdAssessmentService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reassembles flattened assessment rows into nested items', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'a',
          reference_id: 'ASM-a',
          company_id: 'c',
          course_id: null,
          title: 'Quiz',
          assembly_mode: 'FIXED',
          integrity_profile: 'LIGHT',
          time_limit_minutes: 10,
          item_id: 'i1',
          question_type: 'MCQ_SINGLE',
          prompt: 'One?',
          options: ['A'],
          sort_order: 0,
        },
        {
          id: 'a',
          reference_id: 'ASM-a',
          company_id: 'c',
          course_id: null,
          title: 'Quiz',
          assembly_mode: 'FIXED',
          integrity_profile: 'LIGHT',
          time_limit_minutes: 10,
          item_id: 'i2',
          question_type: 'TRUE_FALSE',
          prompt: 'Two?',
          options: [],
          sort_order: 1,
        },
      ],
      error: null,
    });
    const result = await mhdAssessmentService.get('a');
    expect(result?.items).toHaveLength(2);
    expect(result?.items[1].itemId).toBe('i2');
  });

  it('surfaces RPC errors unchanged', async () => {
    const error = new Error('attempt limit');
    rpcMock.mockResolvedValueOnce({ data: null, error });
    await expect(mhdAssessmentService.startAttempt('a')).rejects.toBe(error);
  });

  it('flags LONG_TEXT_RUBRIC items as requiring manual grading via the server-returned flag', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'i1',
          reference_id: 'AIT-0001',
          question_type: 'LONG_TEXT_RUBRIC',
          prompt: 'Explain',
          options: [],
          requires_manual_grading: true,
          tags: [],
          difficulty: null,
          competency_id: null,
          is_active: true,
        },
      ],
      error: null,
    });
    const [item] = await mhdAssessmentService.listItems('c');
    expect(item.requiresManualGrading).toBe(true);
  });
});
