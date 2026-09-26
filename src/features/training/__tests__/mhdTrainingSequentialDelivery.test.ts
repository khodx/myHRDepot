import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mhdTrainingContentTreeSchema } from '../Schemas';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));
vi.mock('@/lib/supabase/supabaseClient', () => ({ supabaseClient: { rpc: rpcMock } }));
const { mhdTrainingService } = await import('../Service');

beforeEach(() => vi.clearAllMocks());

describe('LMS v2 sequential delivery schemas', () => {
  it('accepts the server-built camelCase tree without remapping it', () => {
    const tree = mhdTrainingContentTreeSchema.parse([
      { id: 'module-1', title: 'Basics', sortOrder: 0, lessons: [{ id: 'lesson-1', title: 'Start', sortOrder: 0, blocks: [{ id: 'block-1', blockType: 'RICH_TEXT', title: 'Welcome', content: { html: '<p>Hello</p>' }, sortOrder: 0, altText: null, transcript: null }] }] },
    ]);
    expect(tree[0].lessons[0].blocks[0].blockType).toBe('RICH_TEXT');
    expect(tree[0].lessons[0].blocks[0].content).toEqual({ html: '<p>Hello</p>' });
  });
});

describe('LMS v2 sequential delivery service', () => {
  it('returns the raw jsonb tree shape directly and calls the tree RPC', async () => {
    const tree = [{ id: 'm', title: 'Module', sortOrder: 0, lessons: [] }];
    rpcMock.mockResolvedValueOnce({ data: tree, error: null });
    await expect(mhdTrainingService.getCourseContentTree('course-1')).resolves.toEqual(tree);
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_course_content_tree', { p_course_id: 'course-1' });
  });

  it('maps progress rows and sends learner responses to the completion RPC', async () => {
    rpcMock.mockResolvedValueOnce({ data: [{ id: 'bp-1', block_id: 'b', status: 'COMPLETE', response: { selectedIndex: 1 }, started_at: null, completed_at: 'now' }], error: null });
    await expect(mhdTrainingService.getBlockProgress('assignment-1')).resolves.toEqual([{ id: 'bp-1', blockId: 'b', status: 'COMPLETE', response: { selectedIndex: 1 }, startedAt: null, completedAt: 'now' }]);
    rpcMock.mockResolvedValueOnce({ data: [{ course_completed: true }], error: null });
    await expect(mhdTrainingService.completeBlock('assignment-1', 'b', { selectedIndex: 1 })).resolves.toEqual({ courseCompleted: true });
    expect(rpcMock).toHaveBeenLastCalledWith('mhd_training_block_complete', { p_assignment_id: 'assignment-1', p_block_id: 'b', p_response: { selectedIndex: 1 } });
  });
});
