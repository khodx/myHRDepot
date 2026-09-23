import { useState, type ReactNode } from 'react';
import { Download, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdRichTextRenderer } from '@/components/ui/MhdRichText';
import type { MhdTrainingContentTreeBlock } from '../Types';

interface Props {
  block: MhdTrainingContentTreeBlock;
  onComplete: (response?: Record<string, unknown>) => void;
  isCompleting?: boolean;
}

const supportedBlockTypes = new Set([
  'RICH_TEXT', 'IMAGE', 'VIDEO', 'FILE_DOWNLOAD', 'CALLOUT', 'CHECKLIST', 'TABLE',
  'KNOWLEDGE_CHECK', 'REFLECTION_PROMPT',
]);

function stringValue(value: unknown): string { return typeof value === 'string' ? value : ''; }
function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function MhdTrainingBlockRenderer({ block, onComplete, isCompleting = false }: Props) {
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
