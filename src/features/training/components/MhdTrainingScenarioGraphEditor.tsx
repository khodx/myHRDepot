import { useMemo, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdModal } from '@/components/ui/MhdModal';
import {
  useMhdCreateTrainingScenarioChoice,
  useMhdCreateTrainingScenarioNode,
  useMhdDeleteTrainingScenarioChoice,
  useMhdDeleteTrainingScenarioNode,
  useMhdTrainingScenarioGraph,
  useMhdUpdateTrainingScenarioChoice,
  useMhdUpdateTrainingScenarioNode,
} from '../Hook';
import type {
  MhdTrainingScenarioChoice,
  MhdTrainingScenarioNode,
  MhdUpdateScenarioNodeInput,
} from '../Types';

type GraphBlockType = 'SCENARIO_BRANCHING' | 'AI_CONVERSATION';
type Props = { blockId: string; blockType: GraphBlockType; onClose: () => void };

const inputClass = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm';
const textAreaClass = `${inputClass} min-h-24`;

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function errorMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : 'The action could not be completed.';
}

function NodePreview({ node }: { node: MhdTrainingScenarioNode }) {
  const preview = text(node.content?.text);
  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-foreground">{node.nodeKey}</span>
        {node.isStart ? <MhdBadge variant="accent">Start</MhdBadge> : null}
        {node.isTerminal ? <MhdBadge variant="info">Terminal</MhdBadge> : null}
      </div>
      <p className="mt-1 truncate text-sm text-muted-foreground">{preview || 'No learner-facing scenario text yet.'}</p>
    </div>
  );
}

function NodeForm({
  blockId,
  nodes,
  item,
  onClose,
  onError,
}: {
  blockId: string;
  nodes: MhdTrainingScenarioNode[];
  item?: MhdTrainingScenarioNode;
  onClose: () => void;
  onError: (message: string) => void;
}) {
  const create = useMhdCreateTrainingScenarioNode();
  const update = useMhdUpdateTrainingScenarioNode();
  const [nodeKey, setNodeKey] = useState(item?.nodeKey ?? '');
  const [contentText, setContentText] = useState(text(item?.content?.text));
  const [isStart, setIsStart] = useState(item?.isStart ?? false);
  const [isTerminal, setIsTerminal] = useState(item?.isTerminal ?? false);

  async function makeStart(nodeId: string) {
    const previous = nodes.find((node) => node.isStart && node.id !== nodeId);
    if (previous) await update.mutateAsync({ nodeId: previous.id, isStart: false });
    await update.mutateAsync({ nodeId, isStart: true });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!nodeKey.trim()) return onError('A node key is required.');
    try {
      const content = { text: contentText };
      if (item) {
        const input: MhdUpdateScenarioNodeInput = {
          nodeId: item.id,
          nodeKey: nodeKey.trim(),
          content,
          isTerminal,
          isStart: false,
        };
        await update.mutateAsync(input);
        if (isStart) await makeStart(item.id);
      } else {
        if (isStart) {
          const previous = nodes.find((node) => node.isStart);
          if (previous) await update.mutateAsync({ nodeId: previous.id, isStart: false });
        }
        await create.mutateAsync({ blockId, nodeKey: nodeKey.trim(), content, isStart, isTerminal, nodeType: 'AUTHORED' });
      }
      onClose();
    } catch (caught) {
      onError(errorMessage(caught));
    }
  }

  return (
    <form className="space-y-3 rounded-md border border-border bg-muted/20 p-4" onSubmit={submit}>
      <h3 className="font-semibold text-foreground">{item ? 'Edit node' : 'Add node'}</h3>
      <label className="block space-y-1 text-sm font-medium">Node key *<input className={inputClass} value={nodeKey} onChange={(event) => setNodeKey(event.target.value)} placeholder="start or resolved" required /></label>
      <label className="block space-y-1 text-sm font-medium">Scenario text<textarea className={textAreaClass} value={contentText} onChange={(event) => setContentText(event.target.value)} placeholder="Describe the situation the learner sees." /></label>
      <div className="space-y-2 text-sm">
        <label className="flex items-start gap-2"><input type="checkbox" checked={isStart} onChange={(event) => setIsStart(event.target.checked)} /><span><span className="font-medium">Set as start node</span><span className="block text-xs text-muted-foreground">Only one node can be the start; saving this choice unmarks the previous start node.</span></span></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={isTerminal} onChange={(event) => setIsTerminal(event.target.checked)} /> <span>Terminal node (no choices; ends the scenario)</span></label>
      </div>
      <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">{item ? 'Save node' : 'Add node'}</Button></div>
    </form>
  );
}

function ChoiceForm({
  node,
  nodes,
  item,
  onClose,
  onError,
}: {
  node: MhdTrainingScenarioNode;
  nodes: MhdTrainingScenarioNode[];
  item?: MhdTrainingScenarioChoice;
  onClose: () => void;
  onError: (message: string) => void;
}) {
  const create = useMhdCreateTrainingScenarioChoice();
  const update = useMhdUpdateTrainingScenarioChoice();
  const [label, setLabel] = useState(item?.label ?? '');
  const [nextNodeId, setNextNodeId] = useState(item?.nextNodeId ?? '');
  const [feedbackText, setFeedbackText] = useState(item?.feedbackText ?? '');
  const [scoreDelta, setScoreDelta] = useState(item?.scoreDelta == null ? '' : String(item.scoreDelta));
  const targets = nodes.filter((candidate) => candidate.id !== node.id);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!label.trim()) return onError('A choice label is required.');
    try {
      const score = scoreDelta.trim() === '' ? null : Number(scoreDelta);
      if (score !== null && !Number.isFinite(score)) return onError('Score delta must be a number.');
      const values = { label: label.trim(), nextNodeId: nextNodeId || null, feedbackText: feedbackText.trim() || null, scoreDelta: score };
      if (item) await update.mutateAsync({ choiceId: item.id, ...values });
      else await create.mutateAsync({ nodeId: node.id, ...values });
      onClose();
    } catch (caught) {
      onError(errorMessage(caught));
    }
  }

  return (
    <form className="mt-3 space-y-2 rounded-md border border-border bg-background p-3" onSubmit={submit}>
      <p className="text-sm font-medium">{item ? 'Edit choice' : 'Add choice'}</p>
      <label className="block space-y-1 text-sm">Button label *<input className={inputClass} value={label} onChange={(event) => setLabel(event.target.value)} required /></label>
      <label className="block space-y-1 text-sm">Next node<select className={inputClass} value={nextNodeId} onChange={(event) => setNextNodeId(event.target.value)} disabled={node.isTerminal}><option value="">None (end here)</option>{targets.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.nodeKey}</option>)}</select></label>
      <label className="block space-y-1 text-sm">Feedback before moving on<textarea className={textAreaClass} value={feedbackText} onChange={(event) => setFeedbackText(event.target.value)} /></label>
      <label className="block space-y-1 text-sm">Score delta (optional)<input className={inputClass} type="number" value={scoreDelta} onChange={(event) => setScoreDelta(event.target.value)} placeholder="e.g. -5 or 10" /></label>
      <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">{item ? 'Save choice' : 'Add choice'}</Button></div>
    </form>
  );
}

function ScenarioEditor({ blockId, onClose }: { blockId: string; onClose: () => void }) {
  const graph = useMhdTrainingScenarioGraph(blockId);
  const deleteNode = useMhdDeleteTrainingScenarioNode();
  const deleteChoice = useMhdDeleteTrainingScenarioChoice();
  const [editingNode, setEditingNode] = useState<MhdTrainingScenarioNode | undefined>();
  const [addingNode, setAddingNode] = useState(false);
  const [choiceForm, setChoiceForm] = useState<{ node: MhdTrainingScenarioNode; item?: MhdTrainingScenarioChoice } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nodes = useMemo(() => graph.data ?? [], [graph.data]);
  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  async function removeNode(node: MhdTrainingScenarioNode) {
    if (!window.confirm(`Delete node “${node.nodeKey}”? This cannot be undone.`)) return;
    try { setError(null); await deleteNode.mutateAsync(node.id); } catch (caught) { setError(errorMessage(caught)); }
  }

  async function removeChoice(choice: MhdTrainingScenarioChoice) {
    if (!window.confirm(`Delete choice “${choice.label}”? This cannot be undone.`)) return;
    try { setError(null); await deleteChoice.mutateAsync(choice.id); } catch (caught) { setError(errorMessage(caught)); }
  }

  return (
    <MhdModal title="Edit scenario graph" onClose={onClose} className="relative flex w-full max-w-4xl flex-col rounded-lg border border-border bg-background shadow-xl">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Scenario branching graph</h2><p className="text-sm text-muted-foreground">Build the nodes and learner choices. Server delete guards protect learner history and referenced nodes.</p></div><Button onClick={() => { setAddingNode(true); setEditingNode(undefined); setError(null); }}>Add node</Button></div>
        {error ? <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}
        {addingNode ? <NodeForm blockId={blockId} nodes={nodes} onClose={() => setAddingNode(false)} onError={setError} /> : null}
        {editingNode ? <NodeForm blockId={blockId} nodes={nodes} item={editingNode} onClose={() => setEditingNode(undefined)} onError={setError} /> : null}
        {graph.isLoading ? <p className="text-sm text-muted-foreground">Loading graph…</p> : nodes.length === 0 ? <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">No nodes yet. Add the start and terminal nodes that make up this scenario.</p> : <div className="space-y-3">{nodes.map((node) => <div key={node.id} className="rounded-md border border-border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><NodePreview node={node} /><div className="flex gap-1"><Button variant="ghost" onClick={() => { setEditingNode(node); setAddingNode(false); }}>Edit</Button><Button variant="ghost" className="text-red-700" onClick={() => void removeNode(node)}>Delete</Button></div></div>{!node.isTerminal ? <div className="mt-3 border-t border-border pt-3"><div className="flex items-center justify-between gap-2"><h4 className="text-sm font-medium">Choices</h4><Button variant="secondary" onClick={() => setChoiceForm({ node })}>Add choice</Button></div>{node.choices.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No choices yet.</p> : <div className="mt-2 space-y-2">{node.choices.map((choice) => <div key={choice.id} className="rounded-md bg-muted/40 p-2"><div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span><span className="font-medium">{choice.label}</span> <span className="text-muted-foreground">→ {choice.nextNodeId ? (nodeById.get(choice.nextNodeId)?.nodeKey ?? 'Unknown node') : 'Terminal'}</span></span><span className="flex gap-1"><Button variant="ghost" onClick={() => setChoiceForm({ node, item: choice })}>Edit</Button><Button variant="ghost" className="text-red-700" onClick={() => void removeChoice(choice)}>Delete</Button></span></div>{choice.feedbackText ? <p className="mt-1 text-xs text-muted-foreground">Feedback: {choice.feedbackText}</p> : null}{choice.scoreDelta != null ? <p className="text-xs text-muted-foreground">Score: {choice.scoreDelta > 0 ? '+' : ''}{choice.scoreDelta}</p> : null}</div>)}</div>}{choiceForm?.node.id === node.id ? <ChoiceForm node={node} nodes={nodes} item={choiceForm.item} onClose={() => setChoiceForm(null)} onError={setError} /> : null}</div> : <p className="mt-3 text-sm text-muted-foreground">Terminal nodes have no choices and end the scenario.</p>}</div>)}</div>}
      </div>
    </MhdModal>
  );
}

function AiConversationForm({
  blockId,
  node,
  onClose,
}: {
  blockId: string;
  node: MhdTrainingScenarioNode | undefined;
  onClose: () => void;
}) {
  const create = useMhdCreateTrainingScenarioNode();
  const update = useMhdUpdateTrainingScenarioNode();
  // Lazy initializers derive the starting values from `node` during render, once,
  // for this component instance — the parent remounts this via a `key` tied to
  // `node?.id` when the graph finishes loading, so this never needs a corrective
  // effect to "catch up" to a node that arrived after the first render.
  const [persona, setPersona] = useState(() => text(node?.scenarioContract?.persona));
  const [boundaries, setBoundaries] = useState(() => text(node?.scenarioContract?.boundaries));
  const [redirect, setRedirect] = useState(() => text(node?.scenarioContract?.redirect));
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      setError(null);
      const scenarioContract = { persona: persona.trim(), boundaries: boundaries.trim(), redirect: redirect.trim() };
      if (node) await update.mutateAsync({ nodeId: node.id, nodeKey: 'chat', content: {}, isStart: true, isTerminal: false, scenarioContract });
      else await create.mutateAsync({ blockId, nodeKey: 'chat', content: null as never, isStart: true, isTerminal: false, nodeType: 'AI_CONVERSATION', scenarioContract });
      onClose();
    } catch (caught) { setError(errorMessage(caught)); }
  }

  return <form className="space-y-4" onSubmit={submit}><h2 className="text-lg font-semibold">{node ? 'Edit conversation setup' : 'Create conversation setup'}</h2><p className="text-sm text-muted-foreground">This block uses exactly one AI conversation node and no choices.</p>{error ? <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}<label className="block space-y-1 text-sm font-medium">Persona<textarea className={textAreaClass} value={persona} onChange={(event) => setPersona(event.target.value)} placeholder="Describe the roleplay persona." required /></label><label className="block space-y-1 text-sm font-medium">Boundaries<textarea className={textAreaClass} value={boundaries} onChange={(event) => setBoundaries(event.target.value)} placeholder="Describe behavioral boundaries." required /></label><label className="block space-y-1 text-sm font-medium">Off-topic redirect<textarea className={textAreaClass} value={redirect} onChange={(event) => setRedirect(event.target.value)} placeholder="Tell the AI how to redirect off-topic requests." required /></label><div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Save conversation setup</Button></div></form>;
}

function AiConversationEditor({ blockId, onClose }: { blockId: string; onClose: () => void }) {
  const graph = useMhdTrainingScenarioGraph(blockId);
  const node = graph.data?.find((item) => item.nodeType === 'AI_CONVERSATION') ?? graph.data?.[0];

  return <MhdModal title="Edit AI conversation" onClose={onClose} className="relative flex w-full max-w-4xl flex-col rounded-lg border border-border bg-background shadow-xl">
    {graph.isLoading ? <p className="text-sm text-muted-foreground">Loading conversation setup…</p> : null}
    {graph.isError ? <p className="text-sm text-red-700" role="alert">Unable to load this conversation setup.</p> : null}
    {!graph.isLoading && !graph.isError ? (
      <AiConversationForm key={node?.id ?? 'new'} blockId={blockId} node={node} onClose={onClose} />
    ) : null}
  </MhdModal>;
}

export function MhdTrainingScenarioGraphEditor({ blockId, blockType, onClose }: Props) {
  return blockType === 'AI_CONVERSATION' ? <AiConversationEditor blockId={blockId} onClose={onClose} /> : <ScenarioEditor blockId={blockId} onClose={onClose} />;
}
