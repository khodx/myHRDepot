import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { MhdTrainingScenarioGraph } from '../Types';

const { graphMock, updateNodeMock, createNodeMock } = vi.hoisted(() => ({
  graphMock: vi.fn(),
  updateNodeMock: vi.fn().mockResolvedValue(undefined),
  createNodeMock: vi.fn().mockResolvedValue(undefined),
}));
const noopMutation = { mutateAsync: vi.fn().mockResolvedValue(undefined) };

vi.mock('../Hook', () => ({
  useMhdTrainingScenarioGraph: graphMock,
  useMhdCreateTrainingScenarioNode: () => ({ mutateAsync: createNodeMock }),
  useMhdUpdateTrainingScenarioNode: () => ({ mutateAsync: updateNodeMock }),
  useMhdDeleteTrainingScenarioNode: () => noopMutation,
  useMhdCreateTrainingScenarioChoice: () => noopMutation,
  useMhdUpdateTrainingScenarioChoice: () => noopMutation,
  useMhdDeleteTrainingScenarioChoice: () => noopMutation,
}));

const { MhdTrainingScenarioGraphEditor } = await import('../components/MhdTrainingScenarioGraphEditor');

describe('MhdTrainingScenarioGraphEditor', () => {
  it('populates the AI conversation form from the real existing contract, not blank fields', () => {
    const graph: MhdTrainingScenarioGraph = [
      {
        id: 'node-1',
        nodeKey: 'chat',
        nodeType: 'AI_CONVERSATION',
        content: {},
        scenarioContract: { persona: 'a frustrated employee', boundaries: 'stay in character', redirect: 'redirect gently' },
        isStart: true,
        isTerminal: false,
        choices: [],
      },
    ];
    graphMock.mockReturnValue({ data: graph, isLoading: false, isError: false });

    render(<MhdTrainingScenarioGraphEditor blockId="block-1" blockType="AI_CONVERSATION" onClose={() => {}} />);

    expect(screen.getByLabelText(/Persona/)).toHaveValue('a frustrated employee');
    expect(screen.getByLabelText(/Boundaries/)).toHaveValue('stay in character');
  });

  it('unmarking the start checkbox on the current start node saves it with no replacement start', async () => {
    const graph: MhdTrainingScenarioGraph = [
      { id: 'n1', nodeKey: 'start', nodeType: 'AUTHORED', content: { text: 'hi' }, scenarioContract: null, isStart: true, isTerminal: false, choices: [] },
    ];
    graphMock.mockReturnValue({ data: graph, isLoading: false, isError: false });

    render(<MhdTrainingScenarioGraphEditor blockId="block-1" blockType="SCENARIO_BRANCHING" onClose={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await userEvent.click(screen.getByLabelText(/Set as start node/));
    await userEvent.click(screen.getByRole('button', { name: 'Save node' }));

    // This is the known, accepted gap: the UI allows saving with zero start nodes.
    // The learner-facing renderer already degrades gracefully ("no start node")
    // rather than crashing, so this is a real limitation, not a silent data bug.
    expect(updateNodeMock).toHaveBeenCalledWith(expect.objectContaining({ nodeId: 'n1', isStart: false }));
  });

  it('creating a new node marked as start unmarks the previous start node first', async () => {
    const graph: MhdTrainingScenarioGraph = [
      { id: 'n1', nodeKey: 'start', nodeType: 'AUTHORED', content: { text: 'hi' }, scenarioContract: null, isStart: true, isTerminal: false, choices: [] },
    ];
    graphMock.mockReturnValue({ data: graph, isLoading: false, isError: false });

    render(<MhdTrainingScenarioGraphEditor blockId="block-1" blockType="SCENARIO_BRANCHING" onClose={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add node' }));
    await userEvent.type(screen.getByLabelText(/Node key/), 'resolved');
    await userEvent.click(screen.getByLabelText(/Set as start node/));
    const submitButtons = screen.getAllByRole('button', { name: 'Add node' });
    await userEvent.click(submitButtons[submitButtons.length - 1]);

    expect(updateNodeMock).toHaveBeenCalledWith({ nodeId: 'n1', isStart: false });
    expect(createNodeMock).toHaveBeenCalledWith(expect.objectContaining({ nodeKey: 'resolved', isStart: true }));
  });
});
