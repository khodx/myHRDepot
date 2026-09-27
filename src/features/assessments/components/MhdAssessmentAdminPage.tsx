import { Fragment, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdModal } from '@/components/ui/MhdModal';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { MhdTabs } from '@/components/ui/MhdTabs';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdTrainingCourses } from '@/features/training/Hook';
import type { MhdTrainingCourse } from '@/features/training/Types';
import {
  useMhdAssessment,
  useMhdAssessmentItems,
  useMhdAssessmentList,
  useMhdAssessmentPendingReview,
  useMhdCreateAssessment,
  useMhdCreateAssessmentItem,
  useMhdDecideAccommodationRequest,
  useMhdGradeAssessmentAttempt,
  useMhdAccommodationRequestList,
} from '../Hook';
import {
  MHD_ASSESSMENT_DIFFICULTIES,
  MHD_ASSESSMENT_INTEGRITY_PROFILES,
  MHD_ASSESSMENT_QUESTION_TYPES,
  MHD_ACCOMMODATION_REQUEST_STATUSES,
  mhdFormatAssessmentAssemblyMode,
  mhdFormatAssessmentDifficulty,
  mhdFormatAssessmentIntegrityProfile,
  mhdFormatAssessmentQuestionType,
  mhdFormatAccommodationRequestStatus,
  type MhdAccommodationRequestSummary,
  type MhdAccommodationRequestStatus,
  type MhdAssessmentPendingReview,
  type MhdAssessmentQuestionType,
} from '../Types';

const MANUAL_QUESTION_TYPES = new Set<MhdAssessmentQuestionType>(
  MHD_ASSESSMENT_QUESTION_TYPES.filter(
    (type) => type !== 'MCQ_SINGLE' && type !== 'MCQ_MULTI' && type !== 'TRUE_FALSE',
  ),
);

function truncate(value: string, length = 90) {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

function fieldClass() {
  return 'mt-1 w-full rounded-md border border-border bg-background px-3 py-2';
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : '—';
}

function ServerError({ error }: { error: string | null }) {
  return error ? (
    <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      {error}
    </div>
  ) : null;
}

function TagEditor({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  return (
    <div>
      <label htmlFor="item-tags">Tags</label>
      <div className="mt-1 space-y-2">
        {tags.map((tag, index) => (
          <div key={index} className="flex gap-2">
            <input
              id={index === 0 ? 'item-tags' : undefined}
              value={tag}
              onChange={(event) =>
                onChange(tags.map((current, currentIndex) => (currentIndex === index ? event.target.value : current)))
              }
              className={fieldClass()}
              placeholder="e.g. safety"
            />
            <Button type="button" variant="secondary" onClick={() => onChange(tags.filter((_, i) => i !== index))}>
              Remove
            </Button>
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={() => onChange([...tags, ''])}>
          Add tag
        </Button>
      </div>
    </div>
  );
}

function ItemForm({
  companyId,
  onSaved,
  onError,
}: {
  companyId: string;
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const create = useMhdCreateAssessmentItem();
  const [questionType, setQuestionType] = useState<MhdAssessmentQuestionType>('MCQ_SINGLE');
  const [options, setOptions] = useState(['', '']);
  const [selectedIndex, setSelectedIndex] = useState('');
  const [selectedIndexes, setSelectedIndexes] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const prompt = String(data.get('prompt') ?? '').trim();
    const cleanOptions = options.map((option) => option.trim()).filter(Boolean);
    if ((questionType === 'MCQ_SINGLE' || questionType === 'TRUE_FALSE') && selectedIndex === '') {
      onError('Choose the correct option before creating this item.');
      return;
    }
    if (questionType === 'MCQ_MULTI' && selectedIndexes.length === 0) {
      onError('Choose at least one correct option before creating this item.');
      return;
    }
    onError('');
    try {
      await create.mutateAsync({
        companyId,
        questionType,
        prompt,
        options: MANUAL_QUESTION_TYPES.has(questionType) ? [] : cleanOptions,
        correctAnswer:
          questionType === 'MCQ_MULTI'
            ? selectedIndexes.map(Number)
            : questionType === 'MCQ_SINGLE' || questionType === 'TRUE_FALSE'
              ? String(selectedIndex)
              : undefined,
        tags: tags.map((tag) => tag.trim()).filter(Boolean),
        difficulty: (String(data.get('difficulty') || '') || null) as (typeof MHD_ASSESSMENT_DIFFICULTIES)[number] | null,
      });
      onSaved();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unable to create assessment item.');
    }
  }

  const hasOptions = questionType === 'MCQ_SINGLE' || questionType === 'MCQ_MULTI' || questionType === 'TRUE_FALSE';
  return (
    <form onSubmit={submit} className="space-y-4">
      <MhdFormFieldStack>
        <div>
          <label htmlFor="question-type">Question type</label>
          <select id="question-type" value={questionType} onChange={(event) => setQuestionType(event.target.value as MhdAssessmentQuestionType)} className={fieldClass()}>
            {MHD_ASSESSMENT_QUESTION_TYPES.map((type) => <option key={type} value={type}>{mhdFormatAssessmentQuestionType(type)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="item-prompt">Prompt</label>
          <textarea id="item-prompt" name="prompt" required rows={4} className={fieldClass()} />
        </div>
        {hasOptions ? (
          <div>
            <label>Options</label>
            <div className="mt-1 space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  {questionType === 'MCQ_MULTI' ? (
                    <input type="checkbox" checked={selectedIndexes.includes(String(index))} onChange={(event) => setSelectedIndexes((current) => event.target.checked ? [...current, String(index)] : current.filter((value) => value !== String(index)))} aria-label={`Correct option ${index + 1}`} />
                  ) : (
                    <input type="radio" name="correct-option" checked={selectedIndex === String(index)} onChange={() => setSelectedIndex(String(index))} aria-label={`Correct option ${index + 1}`} />
                  )}
                  <input value={option} onChange={(event) => setOptions(options.map((current, optionIndex) => optionIndex === index ? event.target.value : current))} required className={fieldClass()} placeholder={`Option ${index + 1}`} />
                  {options.length > 2 ? <Button type="button" variant="secondary" onClick={() => setOptions(options.filter((_, optionIndex) => optionIndex !== index))}>Remove</Button> : null}
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={() => setOptions([...options, ''])}>Add option</Button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Select the correct option(s) using the control beside each answer.</p>
          </div>
        ) : (
          <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">This response is graded manually with a rubric or review workflow.</p>
        )}
        <div>
          <label htmlFor="difficulty">Difficulty</label>
          <select id="difficulty" name="difficulty" defaultValue="" className={fieldClass()}>
            <option value="">Not set</option>
            {MHD_ASSESSMENT_DIFFICULTIES.map((difficulty) => <option key={difficulty} value={difficulty}>{mhdFormatAssessmentDifficulty(difficulty)}</option>)}
          </select>
        </div>
        <TagEditor tags={tags} onChange={setTags} />
      </MhdFormFieldStack>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={create.isPending}>{create.isPending ? 'Creating…' : 'Create item'}</Button>
      </div>
    </form>
  );
}

function AssessmentDetail({ assessmentId }: { assessmentId: string }) {
  const detail = useMhdAssessment(assessmentId);
  if (detail.isLoading) return <p className="text-sm text-muted-foreground">Loading items…</p>;
  if (detail.error) return <p role="alert" className="text-sm text-red-700">{detail.error instanceof Error ? detail.error.message : 'Unable to load assessment items.'}</p>;
  return (
    <div className="space-y-2 rounded-md bg-muted/50 p-3">
      {(detail.data?.items ?? []).map((item, index) => (
        <div key={item.itemId} className="flex gap-3 text-sm">
          <span className="font-mono text-muted-foreground">{index + 1}.</span>
          <span><span className="font-medium">{mhdFormatAssessmentQuestionType(item.questionType)}</span> — {item.prompt}</span>
        </div>
      ))}
      {(detail.data?.items ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No items found.</p> : null}
    </div>
  );
}

function ItemBankTab({ companyId, onError }: { companyId: string; onError: (message: string) => void }) {
  const items = useMhdAssessmentItems(companyId);
  const [open, setOpen] = useState(false);
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3"><h2 className="text-base font-semibold">Item bank</h2><Button onClick={() => { onError(''); setOpen(true); }}>New Item</Button></div>
      {items.error ? <div role="alert" className="text-sm text-red-700">{items.error instanceof Error ? items.error.message : 'Unable to load the item bank.'}</div> : null}
      {items.isLoading ? <p className="text-sm text-muted-foreground">Loading item bank…</p> : <MhdCard className="overflow-hidden p-0"><MhdTable><thead><tr><MhdTh>Prompt</MhdTh><MhdTh>Type</MhdTh><MhdTh>Difficulty</MhdTh><MhdTh>Tags</MhdTh><MhdTh>Grading</MhdTh><MhdTh>Status</MhdTh></tr></thead><tbody>{(items.data ?? []).map((item) => <MhdTr key={item.id}><MhdTd className="max-w-md">{truncate(item.prompt)}</MhdTd><MhdTd>{mhdFormatAssessmentQuestionType(item.questionType)}</MhdTd><MhdTd>{item.difficulty ? mhdFormatAssessmentDifficulty(item.difficulty) : 'Not set'}</MhdTd><MhdTd>{item.tags.length ? item.tags.join(', ') : '—'}</MhdTd><MhdTd>{item.requiresManualGrading ? <MhdBadge variant="warning" hideIcon>Manual grading</MhdBadge> : 'Automatic'}</MhdTd><MhdTd><MhdBadge variant={item.isActive ? 'success' : 'neutral'}>{item.isActive ? 'Active' : 'Inactive'}</MhdBadge></MhdTd></MhdTr>)}</tbody></MhdTable></MhdCard>}
      {open ? <MhdModal title="New Assessment Item" onClose={() => setOpen(false)}><ItemForm companyId={companyId} onSaved={() => setOpen(false)} onError={onError} /></MhdModal> : null}
    </section>
  );
}

function AssessmentForm({ companyId, courses, items, onSaved, onError }: { companyId: string; courses: MhdTrainingCourse[]; items: ReturnType<typeof useMhdAssessmentItems>['data']; onSaved: () => void; onError: (message: string) => void }) {
  const create = useMhdCreateAssessment();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (selectedItems.length === 0) { onError('A fixed assessment must include at least one item.'); return; }
    onError('');
    try {
      await create.mutateAsync({ companyId, title: String(data.get('title') ?? '').trim(), courseId: String(data.get('courseId') || '') || null, assemblyMode: 'FIXED', integrityProfile: String(data.get('integrityProfile') || 'LIGHT') as 'NONE' | 'LIGHT' | 'STRICT', timeLimitMinutes: data.get('timeLimitMinutes') ? Number(data.get('timeLimitMinutes')) : null, itemIds: selectedItems });
      onSaved();
    } catch (error) { onError(error instanceof Error ? error.message : 'Unable to create assessment.'); }
  }
  return <form onSubmit={submit} className="space-y-4"><MhdFormFieldStack><div><label htmlFor="assessment-title">Title</label><input id="assessment-title" name="title" required className={fieldClass()} /></div><div><label htmlFor="course-id">Course</label><select id="course-id" name="courseId" defaultValue="" className={fieldClass()}><option value="">No course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></div><div><label htmlFor="assembly-mode">Assembly mode</label><select id="assembly-mode" name="assemblyMode" value="FIXED" disabled className={fieldClass()}><option value="FIXED">Fixed</option></select><p className="mt-1 text-xs text-muted-foreground">Fixed assembly is currently supported; random-draw assembly is not yet available.</p></div><div><label htmlFor="integrity-profile">Integrity profile</label><select id="integrity-profile" name="integrityProfile" defaultValue="LIGHT" className={fieldClass()}>{MHD_ASSESSMENT_INTEGRITY_PROFILES.map((profile) => <option key={profile} value={profile}>{mhdFormatAssessmentIntegrityProfile(profile)}</option>)}</select></div><div><label htmlFor="time-limit">Time limit (minutes)</label><input id="time-limit" name="timeLimitMinutes" type="number" min="1" className={fieldClass()} /></div><div><label htmlFor="item-ids">Items</label><select id="item-ids" multiple value={selectedItems} onChange={(event) => setSelectedItems(Array.from(event.target.selectedOptions, (option) => option.value))} className={`${fieldClass()} min-h-40`}>{(items ?? []).map((item) => <option key={item.id} value={item.id}>{truncate(item.prompt, 70)} — {mhdFormatAssessmentQuestionType(item.questionType)}</option>)}</select><p className="mt-1 text-xs text-muted-foreground">Choose one or more items. Use Ctrl/Cmd-click to select multiple.</p></div></MhdFormFieldStack><div className="flex justify-end"><Button type="submit" disabled={create.isPending}>{create.isPending ? 'Creating…' : 'Create assessment'}</Button></div></form>;
}

function AssessmentsTab({ companyId, onError }: { companyId: string; onError: (message: string) => void }) {
  const assessments = useMhdAssessmentList(companyId);
  const items = useMhdAssessmentItems(companyId);
  const courses = useMhdTrainingCourses({ companyId });
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  return <section className="space-y-3"><div className="flex items-center justify-between gap-3"><h2 className="text-base font-semibold">Assessments</h2><Button onClick={() => { onError(''); setOpen(true); }}>New Assessment</Button></div>{assessments.error ? <div role="alert" className="text-sm text-red-700">{assessments.error instanceof Error ? assessments.error.message : 'Unable to load assessments.'}</div> : null}{assessments.isLoading ? <p className="text-sm text-muted-foreground">Loading assessments…</p> : <MhdCard className="overflow-hidden p-0"><MhdTable><thead><tr><MhdTh>Title</MhdTh><MhdTh>Course</MhdTh><MhdTh>Assembly</MhdTh><MhdTh>Integrity</MhdTh><MhdTh>Items</MhdTh><MhdTh>Time limit</MhdTh><MhdTh>Status</MhdTh><MhdTh /></tr></thead><tbody>{(assessments.data ?? []).map((assessment) => <Fragment key={assessment.id}><MhdTr onClick={() => setExpanded((current) => current === assessment.id ? null : assessment.id)}><MhdTd className="font-medium">{assessment.title}</MhdTd><MhdTd>{assessment.courseTitle ?? 'No course'}</MhdTd><MhdTd>{mhdFormatAssessmentAssemblyMode(assessment.assemblyMode)}</MhdTd><MhdTd>{mhdFormatAssessmentIntegrityProfile(assessment.integrityProfile)}</MhdTd><MhdTd>{assessment.itemCount}</MhdTd><MhdTd>{assessment.timeLimitMinutes ? `${assessment.timeLimitMinutes} min` : 'None'}</MhdTd><MhdTd><MhdBadge variant={assessment.isActive ? 'success' : 'neutral'}>{assessment.isActive ? 'Active' : 'Inactive'}</MhdBadge></MhdTd><MhdTd><button type="button" className="text-sm font-medium text-accent" onClick={() => setExpanded((current) => current === assessment.id ? null : assessment.id)}>{expanded === assessment.id ? 'Hide items' : 'View items'}</button></MhdTd></MhdTr>{expanded === assessment.id ? <tr><td colSpan={8} className="px-4 py-3"><AssessmentDetail assessmentId={assessment.id} /></td></tr> : null}</Fragment>)}</tbody></MhdTable></MhdCard>}{open ? <MhdModal title="New Assessment" onClose={() => setOpen(false)}><AssessmentForm companyId={companyId} courses={courses.data ?? []} items={items.data} onSaved={() => setOpen(false)} onError={onError} /></MhdModal> : null}</section>;
}

function GradeForm({
  attempt,
  onSaved,
  onError,
}: {
  attempt: MhdAssessmentPendingReview;
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const grade = useMhdGradeAssessmentAttempt();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const scorePercent = Number(data.get('scorePercent'));
    if (!Number.isFinite(scorePercent) || scorePercent < 0 || scorePercent > 100) {
      onError('Score must be a number from 0 to 100.');
      return;
    }
    onError('');
    try {
      await grade.mutateAsync({
        assessmentId: attempt.assessmentId,
        attemptId: attempt.id,
        scorePercent,
        passed: data.get('passed') === 'true',
      });
      onSaved();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unable to grade this attempt.');
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {attempt.personDisplayName} · {attempt.assessmentTitle} · Attempt {attempt.attemptNumber}
      </p>
      <MhdFormFieldStack>
        <div>
          <label htmlFor="score-percent">Score percent</label>
          <input id="score-percent" name="scorePercent" type="number" min="0" max="100" step="any" required className={fieldClass()} />
        </div>
        <div>
          <label htmlFor="passed">Passed</label>
          <select id="passed" name="passed" defaultValue="false" className={fieldClass()}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
          <p className="mt-1 text-xs text-muted-foreground">Make the final pass decision independently of the score.</p>
        </div>
      </MhdFormFieldStack>
      <div className="flex justify-end">
        <Button type="submit" disabled={grade.isPending}>{grade.isPending ? 'Saving…' : 'Save grade'}</Button>
      </div>
    </form>
  );
}

function GradingQueueTab({ companyId, onError }: { companyId: string; onError: (message: string) => void }) {
  const pending = useMhdAssessmentPendingReview(companyId);
  const [selectedAttempt, setSelectedAttempt] = useState<string | null>(null);
  const attempt = (pending.data ?? []).find((row) => row.id === selectedAttempt);

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">Grading queue</h2>
      {pending.error ? <div role="alert" className="text-sm text-red-700">{pending.error instanceof Error ? pending.error.message : 'Unable to load the grading queue.'}</div> : null}
      {pending.isLoading ? <p className="text-sm text-muted-foreground">Loading grading queue…</p> : null}
      {!pending.isLoading && (pending.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Nothing is waiting for review right now.</p> : null}
      {!pending.isLoading && (pending.data ?? []).length > 0 ? (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead><tr><MhdTh>Assessment</MhdTh><MhdTh>Learner</MhdTh><MhdTh>Attempt</MhdTh><MhdTh>Submitted at</MhdTh><MhdTh /></tr></thead>
            <tbody>{(pending.data ?? []).map((row) => <MhdTr key={row.id}><MhdTd className="font-medium">{row.assessmentTitle}</MhdTd><MhdTd>{row.personDisplayName}</MhdTd><MhdTd>{row.attemptNumber}</MhdTd><MhdTd>{formatDate(row.submittedAt)}</MhdTd><MhdTd><Button variant="secondary" onClick={() => { onError(''); setSelectedAttempt(row.id); }}>Grade</Button></MhdTd></MhdTr>)}</tbody>
          </MhdTable>
        </MhdCard>
      ) : null}
      {attempt ? <MhdModal title="Grade assessment attempt" onClose={() => setSelectedAttempt(null)}><GradeForm attempt={attempt} onSaved={() => setSelectedAttempt(null)} onError={onError} /></MhdModal> : null}
    </section>
  );
}

function accommodationSummary(request: MhdAccommodationRequestSummary) {
  const values = [
    request.extendedTimePercent !== null ? `${request.extendedTimePercent}% extended time` : null,
    request.attemptCountOverride !== null ? `${request.attemptCountOverride} attempts` : null,
    request.integrityProfileOverride ? `Integrity: ${mhdFormatAssessmentIntegrityProfile(request.integrityProfileOverride)}` : null,
  ].filter(Boolean);
  return values.length ? values.join(', ') : 'None specified';
}

function accommodationBadgeVariant(status: MhdAccommodationRequestStatus) {
  return status === 'APPROVED' ? 'success' : status === 'DENIED' ? 'error' : 'warning';
}

function AccommodationsTab({ companyId, onError }: { companyId: string; onError: (message: string) => void }) {
  const [status, setStatus] = useState<MhdAccommodationRequestStatus | null>('PENDING');
  const requests = useMhdAccommodationRequestList(companyId, status);
  const decide = useMhdDecideAccommodationRequest();

  async function review(request: MhdAccommodationRequestSummary, approve: boolean) {
    const prompt = approve ? 'Optional review notes:' : 'Reason for denying this accommodation request:';
    const notes = window.prompt(prompt);
    if (!approve && !notes?.trim()) {
      onError('A reason is required to deny an accommodation request.');
      return;
    }
    onError('');
    try {
      await decide.mutateAsync({ assessmentId: request.assessmentId, requestId: request.id, approve, notes: notes?.trim() || null });
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unable to decide this accommodation request.');
    }
  }

  const emptyLabel = status === 'PENDING' ? 'No pending accommodation requests.' : status === 'APPROVED' ? 'No approved accommodation requests.' : status === 'DENIED' ? 'No denied accommodation requests.' : 'No accommodation requests.';
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-base font-semibold">Accommodation requests</h2><div><label htmlFor="accommodation-status" className="mr-2 text-sm">Status</label><select id="accommodation-status" value={status ?? ''} onChange={(event) => setStatus((event.target.value || null) as MhdAccommodationRequestStatus | null)} className="rounded-md border border-border bg-background px-3 py-2 text-sm"><option value="">All</option>{MHD_ACCOMMODATION_REQUEST_STATUSES.map((value) => <option key={value} value={value}>{mhdFormatAccommodationRequestStatus(value)}</option>)}</select></div></div>
      {requests.error ? <div role="alert" className="text-sm text-red-700">{requests.error instanceof Error ? requests.error.message : 'Unable to load accommodation requests.'}</div> : null}
      {requests.isLoading ? <p className="text-sm text-muted-foreground">Loading accommodation requests…</p> : null}
      {!requests.isLoading && (requests.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">{emptyLabel}</p> : null}
      {!requests.isLoading && (requests.data ?? []).length > 0 ? <MhdCard className="overflow-hidden p-0"><MhdTable><thead><tr><MhdTh>Learner</MhdTh><MhdTh>Assessment</MhdTh><MhdTh>Requested accommodation</MhdTh><MhdTh>Status</MhdTh><MhdTh>Decided by</MhdTh><MhdTh>Decided at</MhdTh><MhdTh /></tr></thead><tbody>{(requests.data ?? []).map((request) => <MhdTr key={request.id}><MhdTd className="font-medium">{request.personDisplayName}</MhdTd><MhdTd>{request.assessmentTitle}</MhdTd><MhdTd>{accommodationSummary(request)}</MhdTd><MhdTd><MhdBadge variant={accommodationBadgeVariant(request.status)}>{mhdFormatAccommodationRequestStatus(request.status)}</MhdBadge></MhdTd><MhdTd>{request.decidedByName ?? '—'}</MhdTd><MhdTd>{formatDate(request.decidedAt)}</MhdTd><MhdTd>{request.status === 'PENDING' ? <div className="flex gap-2"><Button variant="secondary" onClick={() => void review(request, true)} disabled={decide.isPending}>Approve</Button><Button variant="secondary" onClick={() => void review(request, false)} disabled={decide.isPending}>Deny</Button></div> : '—'}</MhdTd></MhdTr>)}</tbody></MhdTable></MhdCard> : null}
    </section>
  );
}

export function MhdAssessmentAdminPage() {
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const [tab, setTab] = useState<'items' | 'assessments' | 'grading' | 'accommodations'>('items');
  const [error, setError] = useState<string | null>(null);
  return <div className="space-y-6"><MhdPageHeader title="Assessments" description="Build reusable assessment items and fixed assessments for your training catalog." /><ServerError error={error} /><MhdTabs tabs={[{ value: 'items', label: 'Item Bank' }, { value: 'assessments', label: 'Assessments' }, { value: 'grading', label: 'Grading Queue' }, { value: 'accommodations', label: 'Accommodations' }]} value={tab} onChange={setTab} />{tab === 'items' ? <ItemBankTab companyId={companyId} onError={(message) => setError(message || null)} /> : tab === 'assessments' ? <AssessmentsTab companyId={companyId} onError={(message) => setError(message || null)} /> : tab === 'grading' ? <GradingQueueTab companyId={companyId} onError={(message) => setError(message || null)} /> : <AccommodationsTab companyId={companyId} onError={(message) => setError(message || null)} />}</div>;
}

export default MhdAssessmentAdminPage;
