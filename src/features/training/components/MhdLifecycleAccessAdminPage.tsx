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
  useMhdCreateTrainingExternalAuditorGrant,
  useMhdRetireTrainingCourse,
  useMhdRevokeTrainingExternalAuditorGrant,
  useMhdSetTrainingContentLicense,
  useMhdSetTrainingTimeOnTask,
  useMhdTrainingContentLicenses,
  useMhdTrainingCourses,
  useMhdTrainingExternalAuditorGrants,
  useMhdTrainingTimeOnTaskSettings,
} from '../Hook';
import { mhdFormatTrainingCategory, type MhdTrainingCourse } from '../Types';

const fieldClass = 'mt-1 w-full rounded-md border border-border bg-background px-3 py-2';
type Tab = 'retirement' | 'licensing' | 'grants' | 'time-on-task';

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function ServerError({ message }: { message: string | null }) {
  return message ? <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{message}</div> : null;
}

function dateTime(value: string | null) {
  return value ? new Date(value).toLocaleString() : '—';
}

function dateTimeInputValue(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function RetirementForm({ course, courses, onSaved, onError }: { course: MhdTrainingCourse; courses: MhdTrainingCourse[]; onSaved: () => void; onError: (message: string) => void }) {
  const retire = useMhdRetireTrainingCourse();
  const successors = courses.filter((candidate) => candidate.id !== course.id && !candidate.isGlobal && !candidate.retiredAt);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const successorCourseId = String(new FormData(event.currentTarget).get('successorCourseId') ?? '') || null;
    onError('');
    try {
      await retire.mutateAsync({ courseId: course.id, successorCourseId });
      onSaved();
    } catch (error) { onError(errorMessage(error, 'Unable to retire the course.')); }
  }

  return <form onSubmit={submit} className="space-y-4"><MhdFormFieldStack>
    <p className="text-sm text-muted-foreground">Retiring this course immediately blocks new assignments for it. Existing assignments and completions are untouched.</p>
    <div><label htmlFor="retirement-successor">Successor course (optional)</label><select id="retirement-successor" name="successorCourseId" defaultValue="" className={fieldClass}><option value="">No successor set</option>{successors.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.title}</option>)}</select><p className="mt-1 text-xs text-muted-foreground">Only active, company-owned courses are available as successors.</p></div>
  </MhdFormFieldStack><div className="flex justify-end"><Button type="submit" disabled={retire.isPending}>{retire.isPending ? 'Retiring…' : 'Retire course'}</Button></div></form>;
}

function LicenseForm({ companyId, course, currentExpiry, onSaved, onError }: { companyId: string; course: MhdTrainingCourse; currentExpiry: string | null; onSaved: () => void; onError: (message: string) => void }) {
  const setLicense = useMhdSetTrainingContentLicense();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get('expiresAt') ?? '');
    if (!value) { onError('An expiry date and time is required.'); return; }
    onError('');
    try {
      await setLicense.mutateAsync({ companyId, courseId: course.id, expiresAt: new Date(value).toISOString() });
      onSaved();
    } catch (error) { onError(errorMessage(error, 'Unable to set the content license.')); }
  }

  return <form onSubmit={submit} className="space-y-4"><MhdFormFieldStack>
    <div><label htmlFor="license-expires-at">Expiry date and time</label><input id="license-expires-at" name="expiresAt" type="datetime-local" required defaultValue={dateTimeInputValue(currentExpiry)} className={fieldClass} /><p className="mt-1 text-xs text-muted-foreground">A lapsed license only blocks new assignments for this company. It does not interrupt a learner already mid-course.</p></div>
  </MhdFormFieldStack><div className="flex justify-end"><Button type="submit" disabled={setLicense.isPending}>{setLicense.isPending ? 'Saving…' : 'Save license'}</Button></div></form>;
}

function GrantForm({ companyId, courses, onSaved, onError }: { companyId: string; courses: MhdTrainingCourse[]; onSaved: () => void; onError: (message: string) => void }) {
  const create = useMhdCreateTrainingExternalAuditorGrant();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const courseId = String(data.get('courseId') ?? '');
    const auditorLabel = String(data.get('auditorLabel') ?? '').trim();
    const validUntil = String(data.get('validUntil') ?? '');
    if (!courseId || !auditorLabel || !validUntil) { onError('Course, auditor label, and valid-until date and time are required.'); return; }
    onError('');
    try {
      await create.mutateAsync({ companyId, courseId, auditorLabel, validUntil: new Date(validUntil).toISOString() });
      onSaved();
    } catch (error) { onError(errorMessage(error, 'Unable to create the auditor grant.')); }
  }

  return <form onSubmit={submit} className="space-y-4"><MhdFormFieldStack>
    <div><label htmlFor="grant-course">Course</label><select id="grant-course" name="courseId" required defaultValue="" className={fieldClass}><option value="">Choose a course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select><p className="mt-1 text-xs text-muted-foreground">Any global or company-owned course may be selected.</p></div>
    <div><label htmlFor="grant-auditor-label">Auditor label</label><input id="grant-auditor-label" name="auditorLabel" required className={fieldClass} /></div>
    <div><label htmlFor="grant-valid-until">Valid until</label><input id="grant-valid-until" name="validUntil" type="datetime-local" required className={fieldClass} /></div>
  </MhdFormFieldStack><div className="flex justify-end"><Button type="submit" disabled={create.isPending}>{create.isPending ? 'Creating…' : 'Create grant'}</Button></div></form>;
}

function grantStatus(grant: { revokedAt: string | null; validUntil: string }) {
  if (grant.revokedAt) return { label: 'Revoked', variant: 'neutral' as const };
  if (new Date(grant.validUntil).getTime() <= Date.now()) return { label: 'Expired', variant: 'error' as const };
  return { label: 'Active', variant: 'success' as const };
}

export function MhdLifecycleAccessAdminPage() {
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const [tab, setTab] = useState<Tab>('retirement');
  const [retiring, setRetiring] = useState<MhdTrainingCourse | null>(null);
  const [licensing, setLicensing] = useState<{ course: MhdTrainingCourse; expiry: string | null } | null>(null);
  const [creatingGrant, setCreatingGrant] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const courses = useMhdTrainingCourses({ companyId, includeInactive: true });
  const licenses = useMhdTrainingContentLicenses({ companyId });
  const grants = useMhdTrainingExternalAuditorGrants({ companyId });
  const timeOnTask = useMhdTrainingTimeOnTaskSettings({ companyId });
  const revoke = useMhdRevokeTrainingExternalAuditorGrant();
  const setTimeOnTask = useMhdSetTrainingTimeOnTask();

  const companyCourses = useMemo(() => (courses.data ?? []).filter((course) => !course.isGlobal), [courses.data]);
  const globalCourses = useMemo(() => (courses.data ?? []).filter((course) => course.isGlobal), [courses.data]);
  const licenseByCourse = useMemo(() => new Map((licenses.data ?? []).map((license) => [license.courseId, license])), [licenses.data]);
  const queryError = tab === 'retirement' ? courses.error : tab === 'licensing' ? (courses.error ?? licenses.error) : tab === 'grants' ? (courses.error ?? grants.error) : timeOnTask.error;

  async function saveTimeOnTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(new FormData(event.currentTarget).get('maxSessionMinutes'));
    if (!Number.isInteger(value) || value <= 0) { setError('Maximum session minutes must be a positive whole number.'); return; }
    setError(null);
    try { await setTimeOnTask.mutateAsync({ companyId, maxSessionMinutes: value }); } catch (err) { setError(errorMessage(err, 'Unable to save the time-on-task cap.')); }
  }

  async function revokeGrant(grantId: string) {
    setError(null);
    try { await revoke.mutateAsync({ grantId }); } catch (err) { setError(errorMessage(err, 'Unable to revoke the auditor grant.')); }
  }

  return <div className="space-y-6">
    <MhdPageHeader title="Lifecycle & Access" description="Manage course retirement, global-content licensing, external auditor access, and time-on-task reporting limits." />
    <MhdTabs tabs={[{ value: 'retirement', label: 'Course Retirement' }, { value: 'licensing', label: 'Content Licensing' }, { value: 'grants', label: 'External Auditor Grants' }, { value: 'time-on-task', label: 'Time-on-Task' }]} value={tab} onChange={setTab} />
    <ServerError message={error ?? (queryError ? errorMessage(queryError, 'Unable to load this view.') : null)} />

    {tab === 'retirement' ? <section className="space-y-3"><p className="text-sm text-muted-foreground">This view is limited to company-owned courses. Retired courses cannot be un-retired here.</p>{courses.isLoading ? <p className="text-sm text-muted-foreground">Loading courses…</p> : companyCourses.length === 0 ? <p className="text-sm text-muted-foreground">No company-owned courses.</p> : <MhdCard className="overflow-hidden p-0"><MhdTable><thead><tr><MhdTh>Title</MhdTh><MhdTh>Category</MhdTh><MhdTh>Status</MhdTh><MhdTh>Successor</MhdTh><MhdTh>Actions</MhdTh></tr></thead><tbody>{companyCourses.map((course) => <MhdTr key={course.id}><MhdTd className="font-medium">{course.title}</MhdTd><MhdTd>{mhdFormatTrainingCategory(course.category)}</MhdTd><MhdTd><MhdBadge variant={course.retiredAt ? 'neutral' : 'success'} hideIcon>{course.retiredAt ? 'Retired' : 'Active'}</MhdBadge></MhdTd><MhdTd>{course.retiredAt ? course.successorCourseTitle ?? 'No successor set' : '—'}</MhdTd><MhdTd>{course.retiredAt ? '—' : <button type="button" className="text-sm font-medium text-accent disabled:opacity-50" disabled={Boolean(retiring) || course.isGlobal} onClick={() => setRetiring(course)}>Retire</button>}</MhdTd></MhdTr>)}</tbody></MhdTable></MhdCard>}</section> : null}

    {tab === 'licensing' ? <section className="space-y-3"><p className="text-sm text-muted-foreground">Licensing is available only for global courses. A lapsed license only blocks new assignments for this company; it does not interrupt a learner already mid-course.</p>{licenses.isLoading || courses.isLoading ? <p className="text-sm text-muted-foreground">Loading licenses…</p> : globalCourses.length === 0 ? <p className="text-sm text-muted-foreground">No global courses.</p> : <MhdCard className="overflow-hidden p-0"><MhdTable><thead><tr><MhdTh>Title</MhdTh><MhdTh>Current expiry</MhdTh><MhdTh>Last updated</MhdTh><MhdTh>Actions</MhdTh></tr></thead><tbody>{globalCourses.map((course) => { const license = licenseByCourse.get(course.id); return <MhdTr key={course.id}><MhdTd className="font-medium">{course.title}</MhdTd><MhdTd>{license?.expiresAt ? dateTime(license.expiresAt) : 'Unrestricted'}</MhdTd><MhdTd>{dateTime(license?.updatedAt ?? null)}</MhdTd><MhdTd><button type="button" className="text-sm font-medium text-accent" onClick={() => setLicensing({ course, expiry: license?.expiresAt ?? null })}>Set license</button></MhdTd></MhdTr>; })}</tbody></MhdTable></MhdCard>}</section> : null}

    {tab === 'grants' ? <section className="space-y-3"><div className="flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Grant status is derived from the grant's revoked-at field and valid-until timestamp.</p><Button onClick={() => { setError(null); setCreatingGrant(true); }}>New Grant</Button></div>{grants.isLoading ? <p className="text-sm text-muted-foreground">Loading grants…</p> : (grants.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No external auditor grants.</p> : <MhdCard className="overflow-hidden p-0"><MhdTable><thead><tr><MhdTh>Course</MhdTh><MhdTh>Auditor</MhdTh><MhdTh>Valid from</MhdTh><MhdTh>Valid until</MhdTh><MhdTh>Status</MhdTh><MhdTh>Actions</MhdTh></tr></thead><tbody>{(grants.data ?? []).map((grant) => { const status = grantStatus(grant); return <MhdTr key={grant.id}><MhdTd className="font-medium">{grant.courseTitle}</MhdTd><MhdTd>{grant.auditorLabel}</MhdTd><MhdTd>{dateTime(grant.validFrom)}</MhdTd><MhdTd>{dateTime(grant.validUntil)}</MhdTd><MhdTd><MhdBadge variant={status.variant} hideIcon>{status.label}</MhdBadge></MhdTd><MhdTd>{status.label === 'Active' && !grant.revokedAt ? <button type="button" className="text-sm font-medium text-accent disabled:opacity-50" disabled={revoke.isPending} onClick={() => void revokeGrant(grant.id)}>Revoke</button> : '—'}</MhdTd></MhdTr>; })}</tbody></MhdTable></MhdCard>}</section> : null}

    {tab === 'time-on-task' ? <section className="max-w-xl space-y-4"><div className="rounded-md border border-border bg-muted/30 p-4"><p className="text-sm text-muted-foreground">Current maximum session minutes</p><p className="text-2xl font-semibold">{timeOnTask.data?.maxSessionMinutes ?? '—'}</p><p className="mt-1 text-xs text-muted-foreground">Last updated: {dateTime(timeOnTask.data?.updatedAt ?? null)}</p></div><p className="text-sm text-muted-foreground">This caps reported session length for payroll/time-on-task exports. It does not enforce an inactivity timeout or lock a learner out at the limit.</p><form key={timeOnTask.data?.updatedAt ?? 'time-on-task-loading'} onSubmit={saveTimeOnTask} className="space-y-4"><MhdFormFieldStack><div><label htmlFor="max-session-minutes">Maximum session minutes</label><input id="max-session-minutes" name="maxSessionMinutes" type="number" min="1" step="1" required defaultValue={timeOnTask.data?.maxSessionMinutes ?? ''} className={fieldClass} /></div></MhdFormFieldStack><div className="flex justify-end"><Button type="submit" disabled={setTimeOnTask.isPending}>{setTimeOnTask.isPending ? 'Saving…' : 'Save cap'}</Button></div></form></section> : null}

    {retiring ? <MhdModal title={`Retire ${retiring.title}`} onClose={() => setRetiring(null)}><RetirementForm course={retiring} courses={companyCourses} onSaved={() => setRetiring(null)} onError={setError} /></MhdModal> : null}
    {licensing ? <MhdModal title={`Set license: ${licensing.course.title}`} onClose={() => setLicensing(null)}><LicenseForm companyId={companyId} course={licensing.course} currentExpiry={licensing.expiry} onSaved={() => setLicensing(null)} onError={setError} /></MhdModal> : null}
    {creatingGrant ? <MhdModal title="New external auditor grant" onClose={() => setCreatingGrant(false)}><GrantForm companyId={companyId} courses={courses.data ?? []} onSaved={() => setCreatingGrant(false)} onError={setError} /></MhdModal> : null}
  </div>;
}

export default MhdLifecycleAccessAdminPage;
