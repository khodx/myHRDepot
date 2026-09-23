import { useEffect, useMemo, useState } from 'react';
import { LockKeyhole, Check } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import {
  useMhdCompleteTrainingBlock,
  useMhdStartTrainingBlock,
  useMhdTrainingAssignments,
  useMhdTrainingBlockProgress,
  useMhdTrainingCourseContentTree,
  useMhdTrainingCourses,
} from '../Hook';
import { MhdTrainingBlockRenderer } from './MhdTrainingBlockRenderer';

export function MhdTrainingCourseShellPage() {
  const { assignmentId = '' } = useParams<{ assignmentId: string }>();
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const personId = profile?.personId ?? '';
  const assignments = useMhdTrainingAssignments({ companyId, personId, status: 'ALL' });
  const courses = useMhdTrainingCourses({ companyId });
  const assignment = assignments.data?.find((item) => item.id === assignmentId);
  const course = courses.data?.find((item) => item.id === assignment?.courseId);
  const tree = useMhdTrainingCourseContentTree(course?.id ?? null);
  const progress = useMhdTrainingBlockProgress(assignmentId || null);
  const start = useMhdStartTrainingBlock();
  const complete = useMhdCompleteTrainingBlock();
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const blocks = useMemo(() => (tree.data ?? []).flatMap((module) => module.lessons.flatMap((lesson) => lesson.blocks)), [tree.data]);
  const progressByBlock = useMemo(() => new Map((progress.data ?? []).map((item) => [item.blockId, item])), [progress.data]);
  const firstIncompleteIndex = blocks.findIndex((block) => progressByBlock.get(block.id)?.status !== 'COMPLETE');
  const effectiveFirstIncompleteIndex = firstIncompleteIndex === -1 ? blocks.length : firstIncompleteIndex;
  // Clamp a stale/locked selection back to the first incomplete block during render, rather than
  // correcting it with a setState-in-effect (the selection can drift past the gate when a
  // completion invalidates progress and effectiveFirstIncompleteIndex moves).
  const selectedIndex = selectedBlockId ? blocks.findIndex((block) => block.id === selectedBlockId) : -1;
  const clampedBlockId =
    selectedIndex !== -1 && selectedIndex <= effectiveFirstIncompleteIndex ? selectedBlockId : null;
  const currentBlock = blocks.find((block) => block.id === clampedBlockId) ?? blocks[effectiveFirstIncompleteIndex] ?? null;

  useEffect(() => {
    if (!assignmentId || !currentBlock || progressByBlock.get(currentBlock.id)?.status === 'COMPLETE') return;
    start.mutate({ assignmentId, blockId: currentBlock.id });
  // Starting a block is an intentional side effect of opening it; the server is the gate.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId, currentBlock?.id]);

  const completedCount = blocks.filter((block) => progressByBlock.get(block.id)?.status === 'COMPLETE').length;
  const handleComplete = (response?: Record<string, unknown>) => {
    if (!assignmentId || !currentBlock) return;
    complete.mutate({ assignmentId, blockId: currentBlock.id, response });
  };

  if (!companyId || !personId) return <p className="text-sm text-muted-foreground">Your account is not linked to an employee record.</p>;
  if (assignments.isLoading || courses.isLoading || tree.isLoading || progress.isLoading) return <p className="text-sm text-muted-foreground">Loading course…</p>;
  if (!assignment) return <p className="text-sm text-rose-600">This training assignment could not be found.</p>;
  if (!course || course.contentMode !== 'AUTHORED') return <p className="text-sm text-muted-foreground">This assignment does not have an authored course shell.</p>;
  if (tree.isError || progress.isError) return <p className="text-sm text-rose-600">Unable to load this course. {String(tree.error ?? progress.error)}</p>;

  return (
    <div className="space-y-6">
      <MhdPageHeader title={course.title} backTo="/my-training" backLabel="My training" description={`${completedCount} of ${blocks.length} blocks complete`} />
      <div className="h-2 overflow-hidden rounded-full bg-muted" aria-label={`${completedCount} of ${blocks.length} blocks complete`}><div className="h-full bg-accent transition-all" style={{ width: `${blocks.length ? (completedCount / blocks.length) * 100 : 0}%` }} /></div>
      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <nav aria-label="Course navigation" className="space-y-3 rounded-xl border border-border bg-card p-4">
          {tree.data?.map((module) => <div key={module.id} className="space-y-2"><h2 className="text-sm font-semibold text-foreground">{module.title}</h2>{module.lessons.map((lesson) => {
            const lessonBlocks = lesson.blocks;
            const lessonStart = blocks.findIndex((block) => block.id === lessonBlocks[0]?.id);
            const locked = lessonStart > effectiveFirstIncompleteIndex;
            return <div key={lesson.id} className="space-y-1"><button type="button" disabled={locked} onClick={() => setSelectedBlockId(lessonBlocks.find((block) => blocks.indexOf(block) >= effectiveFirstIncompleteIndex)?.id ?? lessonBlocks[0]?.id ?? null)} className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm font-medium text-foreground enabled:hover:bg-muted disabled:cursor-not-allowed disabled:text-muted-foreground">{locked ? <LockKeyhole className="h-3.5 w-3.5" aria-label="Locked" /> : null}{lesson.title}</button>{lessonBlocks.map((block) => { const index = blocks.indexOf(block); const done = progressByBlock.get(block.id)?.status === 'COMPLETE'; const blockLocked = index > effectiveFirstIncompleteIndex; return <button key={block.id} type="button" disabled={blockLocked} onClick={() => setSelectedBlockId(block.id)} className="flex w-full items-center gap-2 rounded-md px-5 py-1 text-left text-xs text-muted-foreground enabled:hover:bg-muted disabled:cursor-not-allowed">{done ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-label="Complete" /> : blockLocked ? <LockKeyhole className="h-3.5 w-3.5" aria-label="Locked" /> : null}{block.title ?? block.blockType}</button>; })}</div>;
          })}</div>)}
        </nav>
        <main className="min-w-0 space-y-3">
          {currentBlock ? <MhdTrainingBlockRenderer block={currentBlock} onComplete={handleComplete} isCompleting={complete.isPending} /> : <p className="text-sm text-muted-foreground">This course has no content blocks yet.</p>}
          {start.isError || complete.isError ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{(start.error ?? complete.error) instanceof Error ? (start.error ?? complete.error)?.message : 'Unable to update this block.'}</p> : null}
          {complete.data?.courseCompleted ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">Course complete. Your training and compliance records have been refreshed.</p> : null}
        </main>
      </div>
    </div>
  );
}
