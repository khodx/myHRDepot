import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));
vi.mock('@/lib/supabase/supabaseClient', () => ({ supabaseClient: { rpc: rpcMock } }));
const { mhdTrainingService } = await import('../Service');

beforeEach(() => vi.clearAllMocks());

describe('LMS v2 scenario/branching + AI conversation service', () => {
  it('reads the whole graph as-is without remapping casing', async () => {
    const graph = [
      { id: 'node-1', nodeKey: 'start', nodeType: 'AUTHORED', content: { text: 'Hi' }, scenarioContract: null, isStart: true, isTerminal: false, choices: [] },
    ];
    rpcMock.mockResolvedValueOnce({ data: graph, error: null });
    await expect(mhdTrainingService.getScenarioGraph('block-1')).resolves.toEqual(graph);
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_scenario_graph', { p_block_id: 'block-1' });
  });

  it('records a scenario visit with a null choice for the start node', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdTrainingService.recordScenarioVisit({ blockProgressId: 'bp-1', nodeId: 'node-1', choiceId: null });
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_scenario_record_visit', { p_block_progress_id: 'bp-1', p_node_id: 'node-1', p_choice_id: undefined });
  });

  it('returns the honest not-configured response and never throws for it', async () => {
    rpcMock.mockResolvedValueOnce({ data: [{ learner_turn_recorded: true, ai_available: false, message: 'The AI conversation partner is not configured yet.' }], error: null });
    await expect(mhdTrainingService.respondToAiConversation({ blockProgressId: 'bp-1', nodeId: 'node-1', learnerMessage: 'Hello' })).resolves.toEqual({
      learnerTurnRecorded: true,
      aiAvailable: false,
      message: 'The AI conversation partner is not configured yet.',
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_scenario_ai_respond', { p_block_progress_id: 'bp-1', p_node_id: 'node-1', p_learner_message: 'Hello' });
  });

  it('maps the AI transcript rows to camelCase', async () => {
    rpcMock.mockResolvedValueOnce({ data: [{ turn_number: 1, role: 'LEARNER', message: 'Hi', created_at: 'now' }], error: null });
    await expect(mhdTrainingService.getAiTranscript('bp-1')).resolves.toEqual([{ turnNumber: 1, role: 'LEARNER', message: 'Hi', createdAt: 'now' }]);
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_scenario_ai_transcript', { p_block_progress_id: 'bp-1' });
  });

  it('creates a scenario node and returns its id', async () => {
    rpcMock.mockResolvedValueOnce({ data: [{ id: 'node-1' }], error: null });
    await expect(mhdTrainingService.createScenarioNode({ blockId: 'block-1', nodeKey: 'start', isStart: true })).resolves.toBe('node-1');
  });

  it('creates a scenario choice and returns its id', async () => {
    rpcMock.mockResolvedValueOnce({ data: [{ id: 'choice-1' }], error: null });
    await expect(mhdTrainingService.createScenarioChoice({ nodeId: 'node-1', label: 'Listen' })).resolves.toBe('choice-1');
  });

  it('includes the block progress row id when mapping getBlockProgress', async () => {
    rpcMock.mockResolvedValueOnce({ data: [{ id: 'bp-1', block_id: 'block-1', status: 'IN_PROGRESS', response: null, started_at: 'now', completed_at: null }], error: null });
    await expect(mhdTrainingService.getBlockProgress('assignment-1')).resolves.toEqual([{ id: 'bp-1', blockId: 'block-1', status: 'IN_PROGRESS', response: null, startedAt: 'now', completedAt: null }]);
  });
});
