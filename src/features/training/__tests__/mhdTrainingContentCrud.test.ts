import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));
vi.mock('@/lib/supabase/supabaseClient', () => ({ supabaseClient: { rpc: rpcMock } }));
const { mhdTrainingService } = await import('../Service');

beforeEach(() => vi.clearAllMocks());

describe('LMS v2 content-tree CRUD completeness (curricula/programs/modules/lessons/blocks/scenario)', () => {
  it('updates and deletes a curriculum', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdTrainingService.updateCurriculum({ curriculumId: 'cur-1', title: 'New Title', isActive: false });
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_curriculum_update', {
      p_curriculum_id: 'cur-1', p_title: 'New Title', p_description: undefined, p_is_active: false,
    });
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdTrainingService.deleteCurriculum('cur-1');
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_curriculum_delete', { p_curriculum_id: 'cur-1' });
  });

  it('surfaces the delete-guard error from a curriculum with real programs', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: "Remove this curriculum's programs before deleting it" } });
    await expect(mhdTrainingService.deleteCurriculum('cur-1')).rejects.toBeTruthy();
  });

  it('updates and deletes a program', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdTrainingService.updateProgram({ programId: 'prog-1', sortOrder: 2 });
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_program_update', {
      p_program_id: 'prog-1', p_title: undefined, p_description: undefined, p_curriculum_id: undefined, p_sort_order: 2, p_is_active: undefined, p_clear_curriculum_id: false,
    });
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdTrainingService.deleteProgram('prog-1');
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_program_delete', { p_program_id: 'prog-1' });
  });

  it('updates and deletes a course module', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdTrainingService.updateCourseModule({ moduleId: 'mod-1', title: 'Renamed Module' });
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_module_update', {
      p_module_id: 'mod-1', p_title: 'Renamed Module', p_description: undefined, p_sort_order: undefined,
    });
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdTrainingService.deleteCourseModule('mod-1');
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_module_delete', { p_module_id: 'mod-1' });
  });

  it('updates and deletes a lesson', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdTrainingService.updateLesson({ lessonId: 'lsn-1', sortOrder: 1 });
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_lesson_update', {
      p_lesson_id: 'lsn-1', p_title: undefined, p_description: undefined, p_sort_order: 1,
    });
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdTrainingService.deleteLesson('lsn-1');
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_lesson_delete', { p_lesson_id: 'lsn-1' });
  });

  it('updates and deletes a block', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdTrainingService.updateBlock({ blockId: 'blk-1', content: { html: '<p>x</p>' } });
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_block_update', {
      p_block_id: 'blk-1', p_title: undefined, p_content: { html: '<p>x</p>' }, p_alt_text: undefined, p_transcript: undefined, p_sort_order: undefined,
    });
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdTrainingService.deleteBlock('blk-1');
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_block_delete', { p_block_id: 'blk-1' });
  });

  it('surfaces the delete-guard error from a block with real learner progress', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'This block has real learner progress recorded against it and cannot be deleted' } });
    await expect(mhdTrainingService.deleteBlock('blk-1')).rejects.toBeTruthy();
  });

  it('updates and deletes a scenario node', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdTrainingService.updateScenarioNode({ nodeId: 'node-1', isTerminal: true });
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_scenario_node_update', {
      p_node_id: 'node-1', p_node_key: undefined, p_content: undefined, p_is_start: undefined, p_is_terminal: true, p_scenario_contract: undefined,
    });
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdTrainingService.deleteScenarioNode('node-1');
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_scenario_node_delete', { p_node_id: 'node-1' });
  });

  it('updates and deletes a scenario choice', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdTrainingService.updateScenarioChoice({ choiceId: 'choice-1', label: 'Try again', scoreDelta: -5 });
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_scenario_choice_update', {
      p_choice_id: 'choice-1', p_label: 'Try again', p_next_node_id: undefined, p_feedback_text: undefined, p_score_delta: -5, p_sort_order: undefined,
    });
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdTrainingService.deleteScenarioChoice('choice-1');
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_scenario_choice_delete', { p_choice_id: 'choice-1' });
  });
});
