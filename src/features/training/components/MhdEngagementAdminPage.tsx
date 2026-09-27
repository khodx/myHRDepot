import { useMemo, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdModal } from '@/components/ui/MhdModal';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { MhdTabs } from '@/components/ui/MhdTabs';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdAssignTrainingPeerReview,
  useMhdAwardTrainingBadge,
  useMhdContentFlags,
  useMhdCreateTrainingBadge,
  useMhdResolveContentFlag,
  useMhdTrainingBadges,
  useMhdTrainingCourseFeedbackSummary,
  useMhdTrainingCourses,
  useMhdTrainingPeerReviewCandidates,
  useMhdTrainingPeople,
} from '../Hook';
import type {
  MhdContentFlagResolveAction,
  MhdContentFlagStatus,
  MhdTrainingPeerReviewCandidate,
} from '../Types';

const fieldClass = 'mt-1 w-full rounded-md border border-border bg-background px-3 py-2';
const resolveActions: ReadonlyArray<MhdContentFlagResolveAction> = [
  'NONE',
  'HIDDEN',
  'REMOVED',
  'WARNED',
];

type Tab = 'badges' | 'peer-review' | 'moderation' | 'feedback';
type FlagFilter = 'PENDING' | 'RESOLVED' | 'ALL';

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function ServerError({ message }: { message: string | null }) {
  return message ? (
    <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      {message}
    </div>
  ) : null;
}

function dateTime(value: string | null) {
  return value ? new Date(value).toLocaleString() : '—';
}

function truncate(value: string, length = 8) {
  return value.length > length ? `${value.slice(0, length)}…` : value;
}

function personLabel(person: { displayName: string }) {
  return person.displayName;
}

function responsePreview(candidate: MhdTrainingPeerReviewCandidate) {
  const text = candidate.response?.text;
  return typeof text === 'string' && text.trim() ? text.trim() : 'No response text available';
}

function BadgeForm({ companyId, onSaved, onError }: { companyId: string; onSaved: () => void; onError: (message: string) => void }) {
  const create = useMhdCreateTrainingBadge();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get('title') ?? '').trim();
    const iconKey = String(data.get('iconKey') ?? '').trim();
    if (!title || !iconKey) {
      onError('Title and icon key are required.');
      return;
    }
    onError('');
    try {
      await create.mutateAsync({
        companyId,
        title,
        description: String(data.get('description') ?? '').trim() || null,
        iconKey,
      });
      onSaved();
    } catch (error) {
      onError(errorMessage(error, 'Unable to create the badge.'));
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <MhdFormFieldStack>
        <div><label htmlFor="badge-title">Title</label><input id="badge-title" name="title" required className={fieldClass} /></div>
        <div><label htmlFor="badge-description">Description (optional)</label><textarea id="badge-description" name="description" rows={3} className={fieldClass} /></div>
        <div><label htmlFor="badge-icon-key">Icon key</label><input id="badge-icon-key" name="iconKey" required defaultValue="award" className={fieldClass} /><p className="mt-1 text-xs text-muted-foreground">Free-text key used by the badge display.</p></div>
      </MhdFormFieldStack>
      <div className="flex justify-end"><Button type="submit" disabled={create.isPending}>{create.isPending ? 'Creating…' : 'Create badge'}</Button></div>
    </form>
  );
}

function AwardForm({ badgeId, companyId, onSaved, onError }: { badgeId: string; companyId: string; onSaved: () => void; onError: (message: string) => void }) {
  const people = useMhdTrainingPeople(companyId);
  const award = useMhdAwardTrainingBadge();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const personId = String(data.get('personId') ?? '');
    if (!personId) { onError('Choose a person to receive the badge.'); return; }
    onError('');
    try {
      await award.mutateAsync({ badgeId, personId, reason: String(data.get('reason') ?? '').trim() || null });
      onSaved();
    } catch (error) { onError(errorMessage(error, 'Unable to award the badge.')); }
  }

  return <form onSubmit={submit} className="space-y-4"><MhdFormFieldStack>
    <div><label htmlFor="badge-award-person">Person</label><select id="badge-award-person" name="personId" required defaultValue="" className={fieldClass}><option value="">Choose a person</option>{(people.data ?? []).map((person) => <option key={person.id} value={person.id}>{personLabel(person)}</option>)}</select></div>
    <div><label htmlFor="badge-award-reason">Reason (optional)</label><textarea id="badge-award-reason" name="reason" rows={3} className={fieldClass} /></div>
  </MhdFormFieldStack><div className="flex justify-end"><Button type="submit" disabled={award.isPending}>{award.isPending ? 'Awarding…' : 'Award badge'}</Button></div></form>;
}

function AssignReviewerForm({ candidate, companyId, onSaved, onError }: { candidate: MhdTrainingPeerReviewCandidate; companyId: string; onSaved: () => void; onError: (message: string) => void }) {
  const people = useMhdTrainingPeople(companyId);
  const assign = useMhdAssignTrainingPeerReview();
  const reviewers = (people.data ?? []).filter((person) => person.id !== candidate.personId);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reviewerPersonId = String(new FormData(event.currentTarget).get('reviewerPersonId') ?? '');
    if (!reviewerPersonId) { onError('Choose a reviewer.'); return; }
    onError('');
    try {
      await assign.mutateAsync({ blockProgressId: candidate.blockProgressId, reviewerPersonId });
      onSaved();
    } catch (error) { onError(errorMessage(error, 'Unable to assign the peer review.')); }
  }

  return <form onSubmit={submit} className="space-y-4"><MhdFormFieldStack>
    <div><label htmlFor="peer-review-reviewer">Reviewer</label><select id="peer-review-reviewer" name="reviewerPersonId" required defaultValue="" className={fieldClass}><option value="">Choose a reviewer</option>{reviewers.map((person) => <option key={person.id} value={person.id}>{personLabel(person)}</option>)}</select><p className="mt-1 text-xs text-muted-foreground">The learner who submitted this response is excluded.</p></div>
  </MhdFormFieldStack><div className="flex justify-end"><Button type="submit" disabled={assign.isPending}>{assign.isPending ? 'Assigning…' : 'Assign reviewer'}</Button></div></form>;
}

function ResolveFlagForm({ flagId, entityType, onSaved, onError }: { flagId: string; entityType: string; onSaved: () => void; onError: (message: string) => void }) {
  const resolve = useMhdResolveContentFlag();
  const [action, setAction] = useState<MhdContentFlagResolveAction>('NONE');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onError('');
    try {
      await resolve.mutateAsync({ flagId, action, notes: String(data.get('notes') ?? '').trim() || null });
      onSaved();
    } catch (error) { onError(errorMessage(error, 'Unable to resolve the content flag.')); }
  }

  return <form onSubmit={submit} className="space-y-4"><MhdFormFieldStack>
    <div><label htmlFor="flag-action">Resolution action</label><select id="flag-action" name="action" value={action} onChange={(event) => setAction(event.target.value as MhdContentFlagResolveAction)} className={fieldClass}>{resolveActions.map((value) => <option key={value} value={value}>{value}</option>)}</select></div>
    <div><label htmlFor="flag-notes">Notes (optional)</label><textarea id="flag-notes" name="notes" rows={3} className={fieldClass} /></div>
    <p className="text-xs text-muted-foreground">This flag targets a {entityType} entity. REMOVED against a NOTE has a real effect: it deletes the underlying note. This is not a soft or reversible action for that entity type.</p>
  </MhdFormFieldStack><div className="flex justify-end"><Button type="submit" disabled={resolve.isPending}>{resolve.isPending ? 'Resolving…' : 'Resolve flag'}</Button></div></form>;
}

export function MhdEngagementAdminPage() {
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const [tab, setTab] = useState<Tab>('badges');
  const [flagFilter, setFlagFilter] = useState<FlagFilter>('PENDING');
  const [courseId, setCourseId] = useState('');
  const [modal, setModal] = useState<{ kind: 'badge' } | { kind: 'award'; badgeId: string } | { kind: 'review'; candidate: MhdTrainingPeerReviewCandidate } | { kind: 'flag'; flagId: string; entityType: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const badges = useMhdTrainingBadges(companyId);
  const candidates = useMhdTrainingPeerReviewCandidates(companyId);
  const flags = useMhdContentFlags({ companyId, status: flagFilter === 'ALL' ? null : flagFilter as MhdContentFlagStatus });
  const courses = useMhdTrainingCourses({ companyId });
  const feedback = useMhdTrainingCourseFeedbackSummary(courseId || null);

  const queryError = tab === 'badges' ? badges.error : tab === 'peer-review' ? candidates.error : tab === 'moderation' ? flags.error : feedback.error;
  const feedbackCourse = useMemo(() => (courses.data ?? []).find((course) => course.id === courseId), [courses.data, courseId]);

  function closeModal() { setModal(null); setError(null); }

  return <div className="space-y-6">
    <MhdPageHeader title="Training Engagement Admin" description="Manage badges, peer review assignments, content moderation, and course feedback summaries." actions={<Button onClick={() => { setError(null); setModal({ kind: 'badge' }); }}>New Badge</Button>} />
    <MhdTabs tabs={[{ value: 'badges', label: 'Badges' }, { value: 'peer-review', label: 'Peer Review' }, { value: 'moderation', label: 'Moderation Queue' }, { value: 'feedback', label: 'Course Feedback' }]} value={tab} onChange={setTab} />
    <ServerError message={error ?? (queryError ? errorMessage(queryError, 'Unable to load this view.') : null)} />

    {tab === 'badges' ? <section className="space-y-3"><p className="text-sm text-muted-foreground">Badges are create-and-award only. No edit or delete action is available.</p>{badges.isLoading ? <p className="text-sm text-muted-foreground">Loading badges…</p> : (badges.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No badges have been created yet.</p> : <MhdCard className="overflow-hidden p-0"><MhdTable><thead><tr><MhdTh>Title</MhdTh><MhdTh>Description</MhdTh><MhdTh>Icon key</MhdTh><MhdTh>Actions</MhdTh></tr></thead><tbody>{(badges.data ?? []).map((badge) => <MhdTr key={badge.id}><MhdTd className="font-medium">{badge.title}</MhdTd><MhdTd>{badge.description ?? '—'}</MhdTd><MhdTd className="font-mono text-xs">{badge.iconKey}</MhdTd><MhdTd><button type="button" className="text-sm font-medium text-accent" onClick={() => setModal({ kind: 'award', badgeId: badge.id })}>Award</button></MhdTd></MhdTr>)}</tbody></MhdTable></MhdCard>}</section> : null}

    {tab === 'peer-review' ? <section className="space-y-3">{candidates.isLoading ? <p className="text-sm text-muted-foreground">Loading peer review candidates…</p> : (candidates.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No completed reflections or discussion responses are awaiting review.</p> : <MhdCard className="overflow-hidden p-0"><MhdTable><thead><tr><MhdTh>Learner</MhdTh><MhdTh>Course</MhdTh><MhdTh>Block</MhdTh><MhdTh>Response preview</MhdTh><MhdTh>Completed at</MhdTh><MhdTh>Reviews</MhdTh><MhdTh>Actions</MhdTh></tr></thead><tbody>{(candidates.data ?? []).map((candidate) => <MhdTr key={candidate.blockProgressId}><MhdTd className="font-medium">{candidate.personDisplayName}</MhdTd><MhdTd>{candidate.courseTitle}</MhdTd><MhdTd>{candidate.blockTitle ?? candidate.blockType}</MhdTd><MhdTd className="max-w-xs truncate">{responsePreview(candidate)}</MhdTd><MhdTd>{dateTime(candidate.completedAt)}</MhdTd><MhdTd>{candidate.existingReviewCount}</MhdTd><MhdTd><button type="button" className="text-sm font-medium text-accent" onClick={() => setModal({ kind: 'review', candidate })}>Assign reviewer</button></MhdTd></MhdTr>)}</tbody></MhdTable></MhdCard>}</section> : null}

    {tab === 'moderation' ? <section className="space-y-3"><div className="flex items-center gap-3"><label htmlFor="flag-filter" className="text-sm font-medium">Status</label><select id="flag-filter" value={flagFilter} onChange={(event) => setFlagFilter(event.target.value as FlagFilter)} className="rounded-md border border-border bg-background px-3 py-2 text-sm"><option value="PENDING">Pending</option><option value="RESOLVED">Resolved</option><option value="ALL">All</option></select></div><p className="text-xs text-muted-foreground">The flagged content itself is not viewable from this queue yet; each row shows only its entity type and identifier.</p>{flags.isLoading ? <p className="text-sm text-muted-foreground">Loading content flags…</p> : (flags.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No {flagFilter === 'ALL' ? '' : flagFilter.toLowerCase() + ' '}content flags.</p> : <MhdCard className="overflow-hidden p-0"><MhdTable><thead><tr><MhdTh>Entity</MhdTh><MhdTh>Reason</MhdTh><MhdTh>Status</MhdTh><MhdTh>Created at</MhdTh><MhdTh>Actions</MhdTh></tr></thead><tbody>{(flags.data ?? []).map((flag) => <MhdTr key={flag.id}><MhdTd className="font-mono text-xs">{flag.entityType} · {truncate(flag.entityId)}</MhdTd><MhdTd>{flag.reason}</MhdTd><MhdTd><MhdBadge variant={flag.status === 'RESOLVED' ? 'success' : 'warning'} hideIcon>{flag.status}</MhdBadge></MhdTd><MhdTd>{dateTime(flag.createdAt)}</MhdTd><MhdTd>{flag.status === 'PENDING' ? <button type="button" className="text-sm font-medium text-accent" onClick={() => setModal({ kind: 'flag', flagId: flag.id, entityType: flag.entityType })}>Resolve</button> : '—'}</MhdTd></MhdTr>)}</tbody></MhdTable></MhdCard>}</section> : null}

    {tab === 'feedback' ? <section className="space-y-3"><div><label htmlFor="feedback-course">Course</label><select id="feedback-course" value={courseId} onChange={(event) => setCourseId(event.target.value)} className={fieldClass}><option value="">Choose a course</option>{(courses.data ?? []).map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></div>{!courseId ? <p className="text-sm text-muted-foreground">Choose a course to see its feedback summary.</p> : feedback.isLoading ? <p className="text-sm text-muted-foreground">Loading feedback summary…</p> : <MhdCard className="space-y-4"><div><p className="text-sm text-muted-foreground">Course</p><p className="font-medium">{feedbackCourse?.title ?? 'Selected course'}</p></div><div className="grid gap-4 sm:grid-cols-2"><div><p className="text-sm text-muted-foreground">Average rating</p><p className="text-2xl font-semibold">{feedback.data?.averageRating ?? 0}</p></div><div><p className="text-sm text-muted-foreground">Response count</p><p className="text-2xl font-semibold">{feedback.data?.responseCount ?? 0}</p></div></div><p className="text-sm text-muted-foreground">This view is read-only and aggregate-only. Individual feedback comments are not available from the current RPC.</p></MhdCard>}</section> : null}

    {modal?.kind === 'badge' ? <MhdModal title="New badge" onClose={closeModal}><BadgeForm companyId={companyId} onSaved={closeModal} onError={setError} /></MhdModal> : null}
    {modal?.kind === 'award' ? <MhdModal title="Award badge" onClose={closeModal}><AwardForm badgeId={modal.badgeId} companyId={companyId} onSaved={closeModal} onError={setError} /></MhdModal> : null}
    {modal?.kind === 'review' ? <MhdModal title="Assign peer reviewer" onClose={closeModal}><AssignReviewerForm candidate={modal.candidate} companyId={companyId} onSaved={closeModal} onError={setError} /></MhdModal> : null}
    {modal?.kind === 'flag' ? <MhdModal title="Resolve content flag" onClose={closeModal}><ResolveFlagForm flagId={modal.flagId} entityType={modal.entityType} onSaved={closeModal} onError={setError} /></MhdModal> : null}
  </div>;
}

export default MhdEngagementAdminPage;
