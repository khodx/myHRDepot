import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Download, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdRichTextRenderer } from '@/components/ui/MhdRichText';
import type { MhdTrainingContentTreeBlock, MhdTrainingScenarioAiTurn, MhdTrainingScenarioNode } from '../Types';
import {
  useMhdRecordTrainingScenarioVisit,
  useMhdRespondToTrainingScenarioAi,
  useMhdTrainingAiTranscript,
  useMhdTrainingScenarioGraph,
} from '../Hook';

interface Props {
  block: MhdTrainingContentTreeBlock;
  onComplete: (response?: Record<string, unknown>) => void;
  isCompleting?: boolean;
  blockProgressId?: string;
}

const supportedBlockTypes = new Set([
  'RICH_TEXT', 'IMAGE', 'VIDEO', 'FILE_DOWNLOAD', 'CALLOUT', 'CHECKLIST', 'TABLE',
  'KNOWLEDGE_CHECK', 'REFLECTION_PROMPT',
  'SCENARIO_BRANCHING', 'AI_CONVERSATION',
]);

function stringValue(value: unknown): string { return typeof value === 'string' ? value : ''; }
function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function MhdTrainingBlockRenderer({ block, onComplete, isCompleting = false, blockProgressId }: Props) {
  const content = block.content;
  const title = block.title ?? block.blockType.replaceAll('_', ' ');

  if (!supportedBlockTypes.has(block.blockType)) {
    return (
      <BlockFrame title={title}>
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground">
          <LockKeyhole className="mb-2 h-5 w-5" aria-hidden />
          This content type isn&apos;t available yet ({block.blockType}).
        </div>
        <CompleteButton onComplete={onComplete} isCompleting={isCompleting} />
      </BlockFrame>
    );
  }

  switch (block.blockType) {
    case 'RICH_TEXT':
      return <BlockFrame title={title}><MhdRichTextRenderer html={stringValue(content.html)} /><CompleteButton onComplete={onComplete} isCompleting={isCompleting} /></BlockFrame>;
    case 'IMAGE':
      return <BlockFrame title={title}><img src={stringValue(content.url)} alt={block.altText ?? title} className="max-h-[32rem] max-w-full rounded-lg object-contain" /><CompleteButton onComplete={onComplete} isCompleting={isCompleting} /></BlockFrame>;
    case 'VIDEO':
      return <BlockFrame title={title}><video controls src={stringValue(content.url)} className="w-full rounded-lg" />{block.transcript ? <p className="mt-3 text-sm text-muted-foreground">Transcript: {block.transcript}</p> : null}<CompleteButton onComplete={onComplete} isCompleting={isCompleting} /></BlockFrame>;
    case 'FILE_DOWNLOAD':
      return <BlockFrame title={title}><a className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover" href={stringValue(content.url)} download={stringValue(content.fileName) || undefined}><Download className="h-4 w-4" aria-hidden />{stringValue(content.fileName) || 'Download file'}</a><CompleteButton onComplete={onComplete} isCompleting={isCompleting} /></BlockFrame>;
    case 'CALLOUT': {
      const tone = stringValue(content.tone) || 'info';
      const toneClass = tone === 'warning' ? 'border-amber-300 bg-amber-50 text-amber-900' : tone === 'success' ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-sky-300 bg-sky-50 text-sky-900';
      return <BlockFrame title={title}><div className={`rounded-lg border p-4 text-sm ${toneClass}`}>{stringValue(content.text)}</div><CompleteButton onComplete={onComplete} isCompleting={isCompleting} /></BlockFrame>;
    }
    case 'CHECKLIST':
      return <BlockFrame title={title}><ul className="list-inside list-disc space-y-2 text-sm">{stringArray(content.items).map((item) => <li key={item}>{item}</li>)}</ul><CompleteButton onComplete={onComplete} isCompleting={isCompleting} /></BlockFrame>;
    case 'TABLE': {
      const headers = stringArray(content.headers);
      const rows = Array.isArray(content.rows) ? content.rows.filter(Array.isArray) as unknown[][] : [];
      return <BlockFrame title={title}><div className="overflow-x-auto"><table className="min-w-full border-collapse text-sm"><thead><tr>{headers.map((header) => <th key={header} className="border border-border bg-muted px-3 py-2 text-left font-semibold">{header}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} className="border border-border px-3 py-2">{stringValue(cell)}</td>)}</tr>)}</tbody></table></div><CompleteButton onComplete={onComplete} isCompleting={isCompleting} /></BlockFrame>;
    }
    case 'KNOWLEDGE_CHECK':
      return <KnowledgeCheck content={content} onComplete={onComplete} isCompleting={isCompleting} title={title} />;
    case 'REFLECTION_PROMPT':
      return <ReflectionPrompt content={content} onComplete={onComplete} isCompleting={isCompleting} title={title} />;
    case 'SCENARIO_BRANCHING':
      if (!blockProgressId) return <BlockFrame title={title}><p className="text-sm text-muted-foreground">Loading scenario…</p></BlockFrame>;
      return <ScenarioBranching blockId={block.id} blockProgressId={blockProgressId} onComplete={onComplete} isCompleting={isCompleting} title={title} />;
    case 'AI_CONVERSATION':
      if (!blockProgressId) return <BlockFrame title={title}><p className="text-sm text-muted-foreground">Loading conversation…</p></BlockFrame>;
      return <AiConversation blockId={block.id} blockProgressId={blockProgressId} onComplete={onComplete} isCompleting={isCompleting} title={title} />;
    default:
      return null;
  }
}

function BlockFrame({ title, children }: { title: string; children: ReactNode }) {
  return <article className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm"><h2 className="text-xl font-semibold text-foreground">{title}</h2>{children}</article>;
}

function CompleteButton({ onComplete, isCompleting }: Pick<Props, 'onComplete' | 'isCompleting'>) {
  return <Button onClick={() => onComplete()} disabled={isCompleting}>{isCompleting ? 'Saving…' : 'Mark complete and continue'}</Button>;
}

function KnowledgeCheck({ content, onComplete, isCompleting, title }: { content: Record<string, unknown>; onComplete: Props['onComplete']; isCompleting: boolean; title: string }) {
  const options = stringArray(content.options);
  const answerIndex = typeof content.answerIndex === 'number' ? content.answerIndex : -1;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const submit = () => {
    if (selectedIndex === null) return;
    setFeedback(selectedIndex === answerIndex ? 'Correct.' : 'That answer is not correct, but completion is still recorded.');
    onComplete({ selectedIndex });
  };
  return <BlockFrame title={title}><p className="text-sm font-medium">{stringValue(content.question)}</p><fieldset className="space-y-2">{options.map((option, index) => <label key={option} className="flex items-center gap-2 text-sm"><input type="radio" name={`knowledge-check-${title}`} checked={selectedIndex === index} onChange={() => setSelectedIndex(index)} />{option}</label>)}</fieldset>{feedback ? <p className="text-sm font-medium text-foreground" role="status">{feedback}</p> : null}<Button onClick={submit} disabled={selectedIndex === null || isCompleting}>{isCompleting ? 'Saving…' : 'Submit answer'}</Button></BlockFrame>;
}

function ReflectionPrompt({ content, onComplete, isCompleting, title }: { content: Record<string, unknown>; onComplete: Props['onComplete']; isCompleting: boolean; title: string }) {
  const [text, setText] = useState('');
  return <BlockFrame title={title}><p className="text-sm">{stringValue(content.prompt)}</p><textarea className="min-h-32 w-full rounded-md border border-border bg-background p-3 text-sm" value={text} onChange={(event) => setText(event.target.value)} placeholder="Write your reflection" /><Button onClick={() => onComplete({ text })} disabled={!text.trim() || isCompleting}>{isCompleting ? 'Saving…' : 'Save reflection and continue'}</Button></BlockFrame>;
}

function ScenarioBranching({ blockId, blockProgressId, onComplete, isCompleting, title }: { blockId: string; blockProgressId: string; onComplete: Props['onComplete']; isCompleting: boolean; title: string }) {
  const graph = useMhdTrainingScenarioGraph(blockId);
  const recordVisit = useMhdRecordTrainingScenarioVisit();
  const startNode = graph.data?.find((node) => node.isStart) ?? null;
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const recordedStart = useRef<string | null>(null);
  const completedTerminal = useRef<string | null>(null);
  const currentNode = graph.data?.find((node) => node.id === (currentNodeId ?? startNode?.id)) ?? startNode;

  useEffect(() => {
    if (!startNode) return;
    if (recordedStart.current === `${blockProgressId}:${startNode.id}`) return;
    recordedStart.current = `${blockProgressId}:${startNode.id}`;
    void recordVisit.mutateAsync({ blockProgressId, nodeId: startNode.id, choiceId: null });
  // A new graph represents a new arrival at its start node.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startNode?.id, blockProgressId]);

  useEffect(() => {
    if (currentNode?.isTerminal && completedTerminal.current !== currentNode.id) {
      completedTerminal.current = currentNode.id;
      onComplete();
    }
  }, [currentNode?.id, currentNode?.isTerminal, onComplete]);

  const choose = async (choice: MhdTrainingScenarioNode['choices'][number]) => {
    if (!currentNode || recordVisit.isPending) return;
    setFeedback(choice.feedbackText);
    await recordVisit.mutateAsync({ blockProgressId, nodeId: currentNode.id, choiceId: choice.id });
    if (!choice.nextNodeId) {
      onComplete({ choiceId: choice.id });
      return;
    }
    setCurrentNodeId(choice.nextNodeId);
  };

  if (graph.isLoading) return <BlockFrame title={title}><p className="text-sm text-muted-foreground">Loading scenario…</p></BlockFrame>;
  if (graph.isError) return <BlockFrame title={title}><p className="text-sm text-rose-600" role="alert">Unable to load this scenario.</p><CompleteButton onComplete={onComplete} isCompleting={isCompleting} /></BlockFrame>;
  if (!currentNode) return <BlockFrame title={title}><p className="text-sm text-muted-foreground">This scenario has no start node.</p><CompleteButton onComplete={onComplete} isCompleting={isCompleting} /></BlockFrame>;
  return <BlockFrame title={title}>
    {feedback ? <p className="rounded-md bg-muted px-3 py-2 text-sm" role="status">{feedback}</p> : null}
    <p className="text-sm">{stringValue(currentNode.content.text)}</p>
    {!currentNode.isTerminal ? <div className="grid gap-2">{currentNode.choices.map((choice) => <Button key={choice.id} type="button" onClick={() => void choose(choice)} disabled={recordVisit.isPending}>{choice.label}</Button>)}</div> : null}
    {recordVisit.isError ? <p className="text-sm text-rose-600" role="alert">Unable to record this scenario step.</p> : null}
  </BlockFrame>;
}

function AiConversation({ blockId, blockProgressId, onComplete, isCompleting, title }: { blockId: string; blockProgressId: string; onComplete: Props['onComplete']; isCompleting: boolean; title: string }) {
  const graph = useMhdTrainingScenarioGraph(blockId);
  const node = graph.data?.find((item) => item.nodeType === 'AI_CONVERSATION') ?? graph.data?.[0] ?? null;
  const transcript = useMhdTrainingAiTranscript(blockProgressId);
  const respond = useMhdRespondToTrainingScenarioAi();
  const [message, setMessage] = useState('');
  const [localTurns, setLocalTurns] = useState<MhdTrainingScenarioAiTurn[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const turns = localTurns.length > 0 ? localTurns : (transcript.data ?? []);

  const send = async () => {
    const learnerMessage = message.trim();
    if (!learnerMessage || !node || respond.isPending) return;
    setMessage('');
    setLocalTurns((current) => {
      const existing = current.length > 0 ? current : (transcript.data ?? []);
      return [...existing, { turnNumber: existing.length + 1, role: 'LEARNER', message: learnerMessage, createdAt: new Date().toISOString() }];
    });
    const result = await respond.mutateAsync({ blockProgressId, nodeId: node.id, learnerMessage });
    setNotice(result.message);
  };

  if (graph.isLoading || transcript.isLoading) return <BlockFrame title={title}><p className="text-sm text-muted-foreground">Loading conversation…</p></BlockFrame>;
  if (graph.isError || transcript.isError || !node) return <BlockFrame title={title}><p className="text-sm text-rose-600" role="alert">Unable to load this conversation.</p><CompleteButton onComplete={onComplete} isCompleting={isCompleting} /></BlockFrame>;
  const contract = node.scenarioContract ?? {};
  return <BlockFrame title={title}>
    <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm"><p className="font-medium">Conversation context</p>{(['persona', 'boundaries', 'redirect'] as const).map((key) => stringValue(contract[key]) ? <p key={key}><span className="font-medium capitalize">{key}:</span> {stringValue(contract[key])}</p> : null)}</div>
    <div className="space-y-2" aria-live="polite">{turns.map((turn, index) => <p key={`${turn.turnNumber}-${index}`} className="rounded-md border border-border p-3 text-sm"><span className="font-semibold">{turn.role === 'LEARNER' ? 'You' : 'AI partner'}:</span> {turn.message}</p>)}</div>
    <div className="flex gap-2"><input className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write a response" onKeyDown={(event) => { if (event.key === 'Enter') void send(); }} /><Button type="button" onClick={() => void send()} disabled={!message.trim() || respond.isPending}>{respond.isPending ? 'Sending…' : 'Send'}</Button></div>
    {notice ? <p className="text-sm text-muted-foreground" role="status">{notice}</p> : null}
    <p className="text-xs text-muted-foreground">The AI conversation partner is not available yet. You can still mark this block complete.</p>
    <CompleteButton onComplete={onComplete} isCompleting={isCompleting} />
  </BlockFrame>;
}
