import { useMemo, useState, type ReactNode, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdModal } from '@/components/ui/MhdModal';
import { MhdRichTextEditor } from '@/components/ui/MhdRichText';
import { MhdTrainingScenarioGraphEditor } from './MhdTrainingScenarioGraphEditor';
import {
  useMhdCreateTrainingBlock,
  useMhdCreateTrainingCourseModule,
  useMhdCreateTrainingLesson,
  useMhdDeleteTrainingBlock,
  useMhdDeleteTrainingBlockTranslation,
  useMhdDeleteTrainingCourseModule,
  useMhdDeleteTrainingLesson,
  useMhdTrainingBlockTranslations,
  useMhdTrainingCourseContentTree,
  useMhdUpdateTrainingBlock,
  useMhdUpdateTrainingCourseModule,
  useMhdUpdateTrainingLesson,
  useMhdUploadTrainingVideo,
  useMhdUpsertTrainingBlockTranslation,
} from '../Hook';
import type { MhdCreateBlockInput, MhdUpdateBlockInput, MhdTrainingBlockTranslation, MhdTrainingBlockType, MhdTrainingContentTreeBlock, MhdTrainingContentTreeLesson, MhdTrainingContentTreeModule, MhdUpsertBlockTranslationInput } from '../Types';

const BLOCK_TYPES = [
  'RICH_TEXT', 'IMAGE', 'VIDEO', 'FILE_DOWNLOAD', 'CALLOUT', 'CHECKLIST',
  'TABLE', 'KNOWLEDGE_CHECK', 'REFLECTION_PROMPT',
] as const satisfies readonly MhdTrainingBlockType[];

const BLOCK_LABELS: Record<string, string> = {
  RICH_TEXT: 'Rich text', IMAGE: 'Image', VIDEO: 'Video', FILE_DOWNLOAD: 'File download',
  CALLOUT: 'Callout', CHECKLIST: 'Checklist', TABLE: 'Table', KNOWLEDGE_CHECK: 'Knowledge check',
  REFLECTION_PROMPT: 'Reflection prompt', SCENARIO_BRANCHING: 'Scenario branching', AI_CONVERSATION: 'AI conversation',
};

function ordered<T extends { sortOrder: number }>(items: T[]) {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

function stringValue(value: unknown) { return typeof value === 'string' ? value : ''; }
function stringArray(value: unknown) { return Array.isArray(value) ? value.map((item) => stringValue(item)) : []; }
function rowsValue(value: unknown) { return Array.isArray(value) ? value.filter(Array.isArray).map((row) => row.map((cell) => stringValue(cell))) : []; }

type ModalState =
  | { kind: 'module'; item?: MhdTrainingContentTreeModule }
  | { kind: 'lesson'; moduleId: string; item?: MhdTrainingContentTreeLesson }
  | { kind: 'block'; lessonId: string; item?: MhdTrainingContentTreeBlock }
  | { kind: 'scenario'; blockId: string; blockType: 'SCENARIO_BRANCHING' | 'AI_CONVERSATION' }
  | { kind: 'translations'; blockId: string; blockTitle: string };

export function MhdTrainingContentTreeEditor({ courseId }: { courseId: string }) {
  const tree = useMhdTrainingCourseContentTree(courseId);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const createModule = useMhdCreateTrainingCourseModule();
  const updateModule = useMhdUpdateTrainingCourseModule();
  const deleteModule = useMhdDeleteTrainingCourseModule();
  const createLesson = useMhdCreateTrainingLesson();
  const updateLesson = useMhdUpdateTrainingLesson();
  const deleteLesson = useMhdDeleteTrainingLesson();
  const createBlock = useMhdCreateTrainingBlock();
  const updateBlock = useMhdUpdateTrainingBlock();
  const deleteBlock = useMhdDeleteTrainingBlock();
  const uploadVideo = useMhdUploadTrainingVideo();

  const modules = useMemo(() => ordered(tree.data ?? []), [tree.data]);
  const run = async (action: () => Promise<unknown>) => {
    setError(null);
    try { await action(); } catch (caught) { setError(caught instanceof Error ? caught.message : 'The action could not be completed.'); }
  };

  async function moveModule(index: number, direction: -1 | 1) {
    const other = modules[index + direction];
    const item = modules[index];
    if (!other) return;
    await run(async () => {
      await Promise.all([
        updateModule.mutateAsync({ moduleId: item.id, sortOrder: other.sortOrder }),
        updateModule.mutateAsync({ moduleId: other.id, sortOrder: item.sortOrder }),
      ]);
    });
  }

  async function moveLesson(module: MhdTrainingContentTreeModule, index: number, direction: -1 | 1) {
    const lessons = ordered(module.lessons);
    const other = lessons[index + direction];
    const item = lessons[index];
    if (!other) return;
    await run(async () => {
      await Promise.all([
        updateLesson.mutateAsync({ lessonId: item.id, sortOrder: other.sortOrder }),
        updateLesson.mutateAsync({ lessonId: other.id, sortOrder: item.sortOrder }),
      ]);
    });
  }

  async function moveBlock(lesson: MhdTrainingContentTreeLesson, index: number, direction: -1 | 1) {
    const blocks = ordered(lesson.blocks);
    const other = blocks[index + direction];
    const item = blocks[index];
    if (!other) return;
    await run(async () => {
      await Promise.all([
        updateBlock.mutateAsync({ blockId: item.id, sortOrder: other.sortOrder }),
        updateBlock.mutateAsync({ blockId: other.id, sortOrder: item.sortOrder }),
      ]);
    });
  }

  async function remove(kind: 'module' | 'lesson' | 'block', id: string) {
    if (!window.confirm(`Delete this ${kind}? This cannot be undone.`)) return;
    await run(() => kind === 'module' ? deleteModule.mutateAsync(id) : kind === 'lesson' ? deleteLesson.mutateAsync(id) : deleteBlock.mutateAsync(id));
  }

  return (
    <div className="space-y-4">
      {error ? <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="text-lg font-semibold text-foreground">Course content</h2><p className="text-sm text-muted-foreground">Build the learner-facing module, lesson, and block sequence.</p></div>
        <Button onClick={() => setModal({ kind: 'module' })}>Add Module</Button>
      </div>
      {tree.isLoading ? <p className="text-sm text-muted-foreground">Loading content…</p> : modules.length === 0 ? <MhdCard><p className="text-sm text-muted-foreground">This course has no modules yet.</p></MhdCard> : modules.map((module, moduleIndex) => (
        <MhdCard key={module.id} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><div className="flex items-center gap-2"><MhdBadge variant="accent">Module {moduleIndex + 1}</MhdBadge><h3 className="font-semibold text-foreground">{module.title}</h3></div></div>
            <div className="flex flex-wrap gap-1">
              <Button variant="ghost" disabled={moduleIndex === 0} onClick={() => void moveModule(moduleIndex, -1)} aria-label="Move module up">↑</Button>
              <Button variant="ghost" disabled={moduleIndex === modules.length - 1} onClick={() => void moveModule(moduleIndex, 1)} aria-label="Move module down">↓</Button>
              <Button variant="secondary" onClick={() => setModal({ kind: 'lesson', moduleId: module.id })}>Add Lesson</Button>
              <Button variant="ghost" onClick={() => setModal({ kind: 'module', item: module })}>Edit</Button>
              <Button variant="ghost" className="text-red-700" onClick={() => void remove('module', module.id)}>Delete</Button>
            </div>
          </div>
          {ordered(module.lessons).length === 0 ? <p className="pl-6 text-sm text-muted-foreground">No lessons yet.</p> : ordered(module.lessons).map((lesson, lessonIndex) => (
            <div key={lesson.id} className="ml-4 space-y-3 border-l-2 border-accent-border pl-5">
              <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><MhdBadge variant="info">Lesson {lessonIndex + 1}</MhdBadge><h4 className="font-medium text-foreground">{lesson.title}</h4></div><div className="flex flex-wrap gap-1"><Button variant="ghost" disabled={lessonIndex === 0} onClick={() => void moveLesson(module, lessonIndex, -1)} aria-label="Move lesson up">↑</Button><Button variant="ghost" disabled={lessonIndex === ordered(module.lessons).length - 1} onClick={() => void moveLesson(module, lessonIndex, 1)} aria-label="Move lesson down">↓</Button><Button variant="secondary" onClick={() => setModal({ kind: 'block', lessonId: lesson.id })}>Add Block</Button><Button variant="ghost" onClick={() => setModal({ kind: 'lesson', moduleId: module.id, item: lesson })}>Edit</Button><Button variant="ghost" className="text-red-700" onClick={() => void remove('lesson', lesson.id)}>Delete</Button></div></div>
              {ordered(lesson.blocks).length === 0 ? <p className="pl-5 text-sm text-muted-foreground">No blocks yet.</p> : ordered(lesson.blocks).map((block, blockIndex) => <div key={block.id} className="ml-4 flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2"><div className="flex min-w-0 items-center gap-2"><MhdBadge variant="neutral" hideIcon>{BLOCK_LABELS[block.blockType] ?? block.blockType}</MhdBadge><span className="truncate text-sm text-foreground">{block.title || 'Untitled block'}</span></div><div className="flex gap-1"><Button variant="ghost" disabled={blockIndex === 0} onClick={() => void moveBlock(lesson, blockIndex, -1)} aria-label="Move block up">↑</Button><Button variant="ghost" disabled={blockIndex === ordered(lesson.blocks).length - 1} onClick={() => void moveBlock(lesson, blockIndex, 1)} aria-label="Move block down">↓</Button>{(block.blockType === 'SCENARIO_BRANCHING' || block.blockType === 'AI_CONVERSATION') ? <Button variant="ghost" onClick={() => setModal({ kind: 'scenario', blockId: block.id, blockType: block.blockType as 'SCENARIO_BRANCHING' | 'AI_CONVERSATION' })}>Edit Graph</Button> : BLOCK_TYPES.includes(block.blockType as typeof BLOCK_TYPES[number]) ? <Button variant="ghost" onClick={() => setModal({ kind: 'block', lessonId: lesson.id, item: block })}>Edit</Button> : null}<Button variant="ghost" onClick={() => setModal({ kind: 'translations', blockId: block.id, blockTitle: block.title || 'Untitled block' })}>Translations</Button><Button variant="ghost" className="text-red-700" onClick={() => void remove('block', block.id)}>Delete</Button></div></div>)}
            </div>
          ))}
        </MhdCard>
      ))}
      {modal?.kind === 'module' ? <ModuleModal courseId={courseId} item={modal.item} nextSortOrder={modules.length} onClose={() => setModal(null)} onError={setError} create={createModule.mutateAsync} update={updateModule.mutateAsync} /> : null}
      {modal?.kind === 'lesson' ? <LessonModal item={modal.item} moduleId={modal.moduleId} nextSortOrder={modules.find((item) => item.id === modal.moduleId)?.lessons.length ?? 0} onClose={() => setModal(null)} onError={setError} create={createLesson.mutateAsync} update={updateLesson.mutateAsync} /> : null}
      {modal?.kind === 'block' ? <BlockModal item={modal.item} lessonId={modal.lessonId} nextSortOrder={modules.flatMap((item) => item.lessons).find((item) => item.id === modal.lessonId)?.blocks.length ?? 0} onClose={() => setModal(null)} onError={setError} create={createBlock.mutateAsync} update={updateBlock.mutateAsync} upload={uploadVideo.mutateAsync} /> : null}
      {modal?.kind === 'scenario' ? <MhdTrainingScenarioGraphEditor blockId={modal.blockId} blockType={modal.blockType} onClose={() => setModal(null)} /> : null}
      {modal?.kind === 'translations' ? <TranslationsModal blockId={modal.blockId} blockTitle={modal.blockTitle} onClose={() => setModal(null)} /> : null}
    </div>
  );
}

function Field({ label, children, required = false }: { label: string; children: ReactNode; required?: boolean }) { return <label className="block space-y-1 text-sm font-medium text-foreground">{label}{required ? ' *' : ''}{children}</label>; }
const inputClass = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm';
const textAreaClass = `${inputClass} min-h-24`;
type ModuleFormProps = { courseId: string; item?: { id: string; title: string }; nextSortOrder: number; onClose: () => void; onError: (message: string) => void; create: (input: { courseId: string; title: string; description: string | null; sortOrder: number }) => Promise<unknown>; update: (input: { moduleId: string; title: string; description?: string | null }) => Promise<unknown> };
type LessonFormProps = { moduleId: string; item?: { id: string; title: string }; nextSortOrder: number; onClose: () => void; onError: (message: string) => void; create: (input: { moduleId: string; title: string; description: string | null; sortOrder: number }) => Promise<unknown>; update: (input: { lessonId: string; title: string; description?: string | null }) => Promise<unknown> };
type BlockFormProps = { lessonId: string; item?: MhdTrainingContentTreeBlock; nextSortOrder: number; onClose: () => void; onError: (message: string) => void; create: (input: MhdCreateBlockInput) => Promise<unknown>; update: (input: MhdUpdateBlockInput) => Promise<unknown>; upload: (input: { blockId: string; file: File }) => Promise<{ publicUrl: string }> };
type BlockFieldProps = { onClose: () => void; type: MhdTrainingBlockType; content: Record<string, unknown>; set: (key: string, value: unknown) => void; setList: (key: string, index: number, value: string) => void; altText: string; setAltText: (value: string) => void; transcript: string; setTranscript: (value: string) => void; videoFile: File | null; setVideoFile: (file: File | null) => void };

function ModuleModal({ courseId, item, nextSortOrder, onClose, onError, create, update }: ModuleFormProps) {
  const [title, setTitle] = useState(item?.title ?? ''); const [description, setDescription] = useState('');
  async function submit(event: FormEvent) { event.preventDefault(); if (!title.trim()) return onError('A title is required.'); try { if (item) await update({ moduleId: item.id, title: title.trim(), ...(description ? { description } : {}) }); else await create({ courseId, title: title.trim(), description: description || null, sortOrder: nextSortOrder }); onClose(); } catch (caught) { onError(caught instanceof Error ? caught.message : 'The module could not be saved.'); } }
  return <MhdModal title={item ? 'Edit module' : 'Add module'} onClose={onClose}><form className="space-y-4" onSubmit={submit}><h2 className="text-lg font-semibold">{item ? 'Edit module' : 'Add module'}</h2><Field label="Title" required><input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} /></Field><Field label="Description"><textarea className={textAreaClass} value={description} onChange={(e) => setDescription(e.target.value)} /></Field><div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Save</Button></div></form></MhdModal>;
}

function LessonModal({ item, moduleId, nextSortOrder, onClose, onError, create, update }: LessonFormProps) {
  const [title, setTitle] = useState(item?.title ?? ''); const [description, setDescription] = useState('');
  async function submit(event: FormEvent) { event.preventDefault(); if (!title.trim()) return onError('A title is required.'); try { if (item) await update({ lessonId: item.id, title: title.trim(), ...(description ? { description } : {}) }); else await create({ moduleId, title: title.trim(), description: description || null, sortOrder: nextSortOrder }); onClose(); } catch (caught) { onError(caught instanceof Error ? caught.message : 'The lesson could not be saved.'); } }
  return <MhdModal title={item ? 'Edit lesson' : 'Add lesson'} onClose={onClose}><form className="space-y-4" onSubmit={submit}><h2 className="text-lg font-semibold">{item ? 'Edit lesson' : 'Add lesson'}</h2><Field label="Title" required><input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} /></Field><Field label="Description"><textarea className={textAreaClass} value={description} onChange={(e) => setDescription(e.target.value)} /></Field><div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Save</Button></div></form></MhdModal>;
}

function BlockModal({ item, lessonId, nextSortOrder, onClose, onError, create, update, upload }: BlockFormProps) {
  const [type, setType] = useState<MhdTrainingBlockType>(item?.blockType ?? 'RICH_TEXT');
  const [title, setTitle] = useState(item?.title ?? ''); const [content, setContent] = useState<Record<string, unknown>>(item?.content ?? {}); const [altText, setAltText] = useState(item?.altText ?? ''); const [transcript, setTranscript] = useState(item?.transcript ?? ''); const [videoFile, setVideoFile] = useState<File | null>(null);
  const set = (key: string, value: unknown) => setContent((current) => ({ ...current, [key]: value }));
  const setList = (key: string, index: number, value: string) => { const list = stringArray(content[key]); list[index] = value; set(key, list); };
  async function submit(event: FormEvent) { event.preventDefault(); if (type === 'IMAGE' && !altText.trim()) { onError('Alt text is required for images.'); return; } if (type === 'VIDEO' && !transcript.trim()) { onError('A transcript is required for videos.'); return; } try { const payload = { title: title.trim() || null, content, altText: type === 'IMAGE' ? altText.trim() : null, transcript: type === 'VIDEO' ? transcript.trim() : null }; if (item) await update({ blockId: item.id, ...payload }); else { const created = await create({ lessonId, blockType: type, sortOrder: nextSortOrder, ...payload }); const createdId = typeof created === 'object' && created !== null && 'id' in created && typeof created.id === 'string' ? created.id : null; if (type === 'VIDEO' && videoFile && createdId) { const result = await upload({ blockId: createdId, file: videoFile }); await update({ blockId: createdId, content: { ...content, url: result.publicUrl }, transcript: transcript.trim(), title: title.trim() || null }); } } onClose(); } catch (caught) { onError(caught instanceof Error ? caught.message : 'The block could not be saved.'); } }
  return <MhdModal title={item ? 'Edit block' : 'Add block'} onClose={onClose} className="relative flex w-full max-w-4xl flex-col rounded-lg border border-border bg-background shadow-xl"><form className="space-y-4" onSubmit={submit}><h2 className="text-lg font-semibold">{item ? 'Edit block' : 'Add block'}</h2>{item ? <MhdBadge variant="neutral" hideIcon>{BLOCK_LABELS[type]}</MhdBadge> : <Field label="Block type" required><select className={inputClass} value={type} onChange={(e) => setType(e.target.value as MhdTrainingBlockType)}>{BLOCK_TYPES.map((value) => <option key={value} value={value}>{BLOCK_LABELS[value]}</option>)}</select></Field>}<Field label="Title"><input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Optional block title" /></Field><BlockFields onClose={onClose} type={type} content={content} set={set} setList={setList} altText={altText} setAltText={setAltText} transcript={transcript} setTranscript={setTranscript} videoFile={videoFile} setVideoFile={setVideoFile} /></form></MhdModal>;
}

function BlockFields({ onClose, type, content, set, setList, altText, setAltText, transcript, setTranscript, videoFile, setVideoFile }: BlockFieldProps) {
  const listEditor = (key: string, label: string, placeholder: string) => { const values = stringArray(content[key]); return <div className="space-y-2"><div className="flex items-center justify-between"><span className="text-sm font-medium">{label}</span><Button variant="secondary" onClick={() => set(key, [...values, ''])}>Add row</Button></div>{(values.length ? values : ['']).map((value, index) => <div className="flex gap-2" key={`${key}-${index}`}><input className={inputClass} value={value} placeholder={placeholder} onChange={(e) => setList(key, index, e.target.value)} />{values.length > 1 ? <Button variant="ghost" onClick={() => set(key, values.filter((_, rowIndex) => rowIndex !== index))}>Remove</Button> : null}</div>)}</div>; };
  if (type === 'RICH_TEXT') return <><MhdRichTextEditor label="Rich text" html={stringValue(content.html)} onChange={(html) => set('html', html)} placeholder="Write the lesson content" minHeightClassName="min-h-48" /><FormActions onClose={onClose} /></>;
  if (type === 'IMAGE') return <><Field label="Image URL" required><input className={inputClass} value={stringValue(content.url)} onChange={(e) => set('url', e.target.value)} /></Field><Field label="Alt text" required><input className={inputClass} value={altText} onChange={(e) => setAltText(e.target.value)} /></Field><FormActions onClose={onClose} /></>;
  if (type === 'VIDEO') return <><Field label="Video URL"><input className={inputClass} value={stringValue(content.url)} onChange={(e) => set('url', e.target.value)} placeholder="Paste a hosted video URL, or upload below" /></Field><Field label="Upload video"><input type="file" accept="video/mp4,video/webm,video/quicktime,video/x-matroska" onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} className="block w-full text-sm" />{videoFile ? <span className="text-xs text-muted-foreground">{videoFile.name}</span> : null}</Field><Field label="Transcript" required><textarea className={textAreaClass} value={transcript} onChange={(e) => setTranscript(e.target.value)} /></Field><FormActions onClose={onClose} /></>;
  if (type === 'FILE_DOWNLOAD') return <><Field label="File URL" required><input className={inputClass} value={stringValue(content.url)} onChange={(e) => set('url', e.target.value)} /></Field><Field label="File name"><input className={inputClass} value={stringValue(content.fileName)} onChange={(e) => set('fileName', e.target.value)} /></Field><FormActions onClose={onClose} /></>;
  if (type === 'CALLOUT') return <><Field label="Tone"><select className={inputClass} value={stringValue(content.tone) || 'info'} onChange={(e) => set('tone', e.target.value)}><option value="info">Info</option><option value="warning">Warning</option><option value="success">Success</option></select></Field><Field label="Text" required><textarea className={textAreaClass} value={stringValue(content.text)} onChange={(e) => set('text', e.target.value)} /></Field><FormActions onClose={onClose} /></>;
  if (type === 'CHECKLIST') return <>{listEditor('items', 'Checklist items', 'Checklist item')}<FormActions onClose={onClose} /></>;
  if (type === 'TABLE') return <TableFields onClose={onClose} content={content} set={set} setList={setList} />;
  if (type === 'KNOWLEDGE_CHECK') return <><Field label="Question" required><input className={inputClass} value={stringValue(content.question)} onChange={(e) => set('question', e.target.value)} /></Field>{listEditor('options', 'Options', 'Answer option')}<div className="space-y-2"><span className="text-sm font-medium">Correct answer</span>{stringArray(content.options).map((option, index) => <label key={`answer-${index}`} className="flex items-center gap-2 text-sm"><input type="radio" name="answerIndex" checked={content.answerIndex === index} onChange={() => set('answerIndex', index)} />{option || `Option ${index + 1}`}</label>)}</div><FormActions onClose={onClose} /></>;
  return <><Field label="Prompt" required><textarea className={textAreaClass} value={stringValue(content.prompt)} onChange={(e) => set('prompt', e.target.value)} /></Field><FormActions onClose={onClose} /></>;
}

function TableFields({ onClose, content, set, setList }: Pick<BlockFieldProps, 'onClose' | 'content' | 'set' | 'setList'>) {
  const headers = stringArray(content.headers); const rows = rowsValue(content.rows); const columnCount = Math.max(headers.length, 1);
  const updateCell = (rowIndex: number, columnIndex: number, value: string) => { const next = rows.length ? rows.map((row) => [...row]) : [[]]; next[rowIndex] = [...(next[rowIndex] ?? []), ...Array(Math.max(0, columnCount - (next[rowIndex]?.length ?? 0))).fill('')]; next[rowIndex][columnIndex] = value; set('rows', next); };
  const addColumn = () => set('headers', [...headers, '']);
  const removeColumn = (index: number) => { if (headers.length <= 1) return; set('headers', headers.filter((_, i) => i !== index)); set('rows', rows.map((row) => row.filter((_, i) => i !== index))); };
  const addRow = () => set('rows', [...rows, Array(columnCount).fill('')]);
  return <><div className="flex items-center justify-between"><span className="text-sm font-medium">Table</span><Button variant="secondary" onClick={addColumn}>Add column</Button></div><div className="overflow-x-auto"><table className="w-full border-collapse"><thead><tr>{(headers.length ? headers : ['']).map((header, index) => <th className="border border-border p-2" key={`header-${index}`}><input className={inputClass} value={header} placeholder="Header" onChange={(e) => setList('headers', index, e.target.value)} /><Button variant="ghost" onClick={() => removeColumn(index)}>Remove</Button></th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={`row-${rowIndex}`}>{Array.from({ length: columnCount }, (_, columnIndex) => <td className="border border-border p-2" key={`cell-${rowIndex}-${columnIndex}`}><input className={inputClass} value={row[columnIndex] ?? ''} onChange={(e) => updateCell(rowIndex, columnIndex, e.target.value)} /></td>)}<td className="p-2"><Button variant="ghost" onClick={() => set('rows', rows.filter((_, i) => i !== rowIndex))}>Remove</Button></td></tr>)}</tbody></table></div><Button variant="secondary" onClick={addRow}>Add row</Button><FormActions onClose={onClose} /></>;
}

function FormActions({ onClose }: { onClose?: () => void }) { return <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Save</Button></div>; }

function TranslationsModal({ blockId, blockTitle, onClose }: { blockId: string; blockTitle: string; onClose: () => void }) {
  const translations = useMhdTrainingBlockTranslations(blockId);
  const upsert = useMhdUpsertTrainingBlockTranslation();
  const remove = useMhdDeleteTrainingBlockTranslation();
  const [editing, setEditing] = useState<MhdTrainingBlockTranslation | 'new' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function removeTranslation(translationId: string) {
    if (!window.confirm('Delete this translation? This cannot be undone.')) return;
    setError(null);
    try { await remove.mutateAsync({ translationId, blockId }); } catch (caught) { setError(caught instanceof Error ? caught.message : 'The translation could not be deleted.'); }
  }

  return (
    <MhdModal title={`Translations — ${blockTitle}`} onClose={onClose}>
      <div className="space-y-4">
        {error ? <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}
        {translations.isLoading ? <p className="text-sm text-muted-foreground">Loading translations…</p> : (translations.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No translations have been added for this block yet.</p> : (
          <ul className="space-y-2">
            {(translations.data ?? []).map((translation) => (
              <li key={translation.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                <div>
                  <p className="font-medium text-foreground">{translation.locale}</p>
                  <p className="text-xs text-muted-foreground">{translation.updatedAt ? new Date(translation.updatedAt).toLocaleString() : 'Never saved'}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" onClick={() => setEditing(translation)}>Edit</Button>
                  <Button variant="ghost" className="text-red-700" onClick={() => void removeTranslation(translation.id)}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {editing ? (
          <TranslationForm
            blockId={blockId}
            item={editing === 'new' ? undefined : editing}
            onClose={() => setEditing(null)}
            onError={setError}
            upsert={upsert.mutateAsync}
          />
        ) : (
          <div className="flex justify-end"><Button onClick={() => { setError(null); setEditing('new'); }}>Add translation</Button></div>
        )}
      </div>
    </MhdModal>
  );
}

function TranslationForm({ blockId, item, onClose, onError, upsert }: {
  blockId: string;
  item?: MhdTrainingBlockTranslation;
  onClose: () => void;
  onError: (message: string) => void;
  upsert: (input: MhdUpsertBlockTranslationInput) => Promise<unknown>;
}) {
  const [locale, setLocale] = useState(item?.locale ?? '');
  const [altText, setAltText] = useState(item?.altText ?? '');
  const [transcript, setTranscript] = useState(item?.transcript ?? '');
  const [contentJson, setContentJson] = useState(item ? JSON.stringify(item.content, null, 2) : '{}');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!locale.trim()) { onError('A locale (e.g. es, fr-CA) is required.'); return; }
    let content: Record<string, unknown>;
    try { content = JSON.parse(contentJson || '{}'); } catch { onError('Translated content must be valid JSON.'); return; }
    try {
      await upsert({ blockId, locale: locale.trim(), content, altText: altText.trim() || null, transcript: transcript.trim() || null });
      onClose();
    } catch (caught) { onError(caught instanceof Error ? caught.message : 'The translation could not be saved.'); }
  }

  return (
    <form className="space-y-3 border-t border-border pt-4" onSubmit={submit}>
      <Field label="Locale" required><input className={inputClass} value={locale} onChange={(e) => setLocale(e.target.value)} placeholder="es, fr-CA, …" disabled={Boolean(item)} /></Field>
      <Field label="Translated content (JSON)"><textarea className={`${textAreaClass} font-mono text-xs`} value={contentJson} onChange={(e) => setContentJson(e.target.value)} /></Field>
      <Field label="Alt text (images)"><input className={inputClass} value={altText} onChange={(e) => setAltText(e.target.value)} /></Field>
      <Field label="Transcript (video)"><textarea className={textAreaClass} value={transcript} onChange={(e) => setTranscript(e.target.value)} /></Field>
      <FormActions onClose={onClose} />
    </form>
  );
}
