import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdModal } from '@/components/ui/MhdModal';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { MhdTabs } from '@/components/ui/MhdTabs';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdJobs } from '@/features/jobs/Hook';
import {
  useMhdApplyTrainingComplianceRule,
  useMhdCreateTrainingComplianceRule,
  useMhdDecideTrainingSelfEnrollment,
  useMhdTrainingComplianceRules,
  useMhdTrainingCourses,
  useMhdTrainingManagerTeamStatus,
  useMhdTrainingPeople,
  useMhdTrainingSelfEnrollments,
} from '../Hook';
import {
  MHD_TRAINING_COMPLIANCE_RULE_TARGET_TYPES,
  type MhdTrainingComplianceRuleTargetType,
  type MhdTrainingSelfEnrollmentStatus,
} from '../Types';

const fieldClass = 'mt-1 w-full rounded-md border border-border bg-background px-3 py-2';
type Tab = 'rules' | 'requests' | 'manager';

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function ServerError({ message }: { message: string | null }) {
  return message ? <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{message}</div> : null;
}

function dateTime(value: string | null) {
  return value ? new Date(value).toLocaleString() : '—';
}

function dateOnly(value: string | null) {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString() : '—';
}

function statusVariant(status: string) {
  if (status === 'CURRENT' || status === 'APPROVED' || status === 'COMPLETED') return 'success' as const;
  if (status === 'OVERDUE' || status === 'EXPIRED' || status === 'DENIED') return 'error' as const;
  return 'warning' as const;
}

function RuleForm({ companyId, onSaved, onError }: { companyId: string; onSaved: () => void; onError: (message: string) => void }) {
  const courses = useMhdTrainingCourses({ companyId });
  const jobs = useMhdJobs(companyId, null, true);
  const create = useMhdCreateTrainingComplianceRule();
  const [targetType, setTargetType] = useState<MhdTrainingComplianceRuleTargetType>('ORG_UNIT');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get('title') ?? '').trim();
    const courseId = String(data.get('courseId') ?? '');
    const dueValue = String(data.get('dueOffsetDays') ?? '').trim();
    const dueOffsetDays = dueValue ? Number(dueValue) : null;
    if (!title || !courseId) { onError('Title and course are required.'); return; }
    if (dueOffsetDays !== null && (!Number.isInteger(dueOffsetDays) || dueOffsetDays < 0)) { onError('Due offset days must be a non-negative whole number.'); return; }
    onError('');
    try {
      await create.mutateAsync({
        companyId, title, courseId, targetType,
        targetDepartment: targetType === 'ORG_UNIT' ? String(data.get('targetDepartment') ?? '').trim() || null : null,
        targetJobId: targetType === 'JOB_TITLE' ? String(data.get('targetJobId') ?? '') || null : null,
        dueOffsetDays,
      });
      onSaved();
    } catch (error) { onError(errorMessage(error, 'Unable to create the compliance rule.')); }
  }

  return <form onSubmit={submit} className="space-y-4"><MhdFormFieldStack>
    <div><label htmlFor="rule-title">Title</label><input id="rule-title" name="title" required className={fieldClass} /></div>
    <div><label htmlFor="rule-course">Course</label><select id="rule-course" name="courseId" required defaultValue="" className={fieldClass}><option value="">Choose a course</option>{(courses.data ?? []).map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></div>
    <div><label htmlFor="rule-target-type">Target type</label><select id="rule-target-type" value={targetType} onChange={(event) => setTargetType(event.target.value as MhdTrainingComplianceRuleTargetType)} className={fieldClass}>{MHD_TRAINING_COMPLIANCE_RULE_TARGET_TYPES.filter((type) => type !== 'JURISDICTION').map((type) => <option key={type} value={type}>{type === 'ORG_UNIT' ? 'Organization unit / department' : 'Job title'}</option>)}</select><p className="mt-1 text-xs text-muted-foreground">Jurisdiction-based targeting is not supported because no person-level jurisdiction field exists to match against.</p></div>
    {targetType === 'ORG_UNIT' ? <div><label htmlFor="rule-department">Department / organization unit</label><input id="rule-department" name="targetDepartment" required className={fieldClass} /><p className="mt-1 text-xs text-muted-foreground">Enter the department name as recorded for people in scope.</p></div> : <div><label htmlFor="rule-job">Job title</label><select id="rule-job" name="targetJobId" required defaultValue="" className={fieldClass}><option value="">Choose a job title</option>{(jobs.data ?? []).map((job) => <option key={job.id} value={job.id}>{job.jobTitle}</option>)}</select></div>}
    <div><label htmlFor="rule-due-offset">Due offset days (optional)</label><input id="rule-due-offset" name="dueOffsetDays" type="number" min="0" step="1" className={fieldClass} /></div>
  </MhdFormFieldStack><div className="flex justify-end"><Button type="submit" disabled={create.isPending}>{create.isPending ? 'Creating…' : 'Create rule'}</Button></div></form>;
}

export function MhdComplianceAdminPage() {
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const [tab, setTab] = useState<Tab>('rules');
  const [requestStatus, setRequestStatus] = useState<MhdTrainingSelfEnrollmentStatus | null>('PENDING');
  const [managerId, setManagerId] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rules = useMhdTrainingComplianceRules(companyId);
  const courses = useMhdTrainingCourses({ companyId });
  const jobs = useMhdJobs(companyId, null, true);
  const requests = useMhdTrainingSelfEnrollments({ companyId, status: requestStatus });
  const people = useMhdTrainingPeople(companyId);
  const teamStatus = useMhdTrainingManagerTeamStatus(managerId || null);
  const apply = useMhdApplyTrainingComplianceRule();
  const decide = useMhdDecideTrainingSelfEnrollment();

  const courseTitle = (id: string) => (courses.data ?? []).find((course) => course.id === id)?.title ?? '—';
  const jobTitle = (id: string | null) => (jobs.data ?? []).find((job) => job.id === id)?.jobTitle ?? id ?? '—';
  const queryError = tab === 'rules' ? rules.error : tab === 'requests' ? requests.error : teamStatus.error;

  async function applyRule(ruleId: string) {
    setError(null);
    try { await apply.mutateAsync(ruleId); } catch (err) { setError(errorMessage(err, 'Unable to apply the compliance rule.')); }
  }

  async function decideRequest(requestId: string, approve: boolean) {
    const notes = window.prompt(`${approve ? 'Approve' : 'Deny'} request notes (optional):`);
    setError(null);
    try { await decide.mutateAsync({ requestId, approve, notes: notes?.trim() || null }); } catch (err) { setError(errorMessage(err, 'Unable to decide the self-enrollment request.')); }
  }

  return <div className="space-y-6"><MhdPageHeader title="Training Compliance & Assignment Admin" description="Manage compliance rules, self-enrollment requests, and manager team visibility." actions={<Button onClick={() => { setError(null); setCreating(true); }}>New Rule</Button>} />
    <MhdTabs tabs={[{ value: 'rules', label: 'Compliance Rules' }, { value: 'requests', label: 'Self-Enrollment Requests' }, { value: 'manager', label: 'Manager Team Status' }]} value={tab} onChange={setTab} />
    <ServerError message={error ?? (queryError ? errorMessage(queryError, 'Unable to load this view.') : null)} />
    {tab === 'rules' ? <section className="space-y-3"><p className="text-sm text-muted-foreground">Rules are create-only: no update or delete action is available. “Apply now” creates assignments immediately for anyone in scope who is not already assigned.</p>{rules.isLoading ? <p className="text-sm text-muted-foreground">Loading compliance rules…</p> : (rules.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No compliance rules have been created yet.</p> : <MhdCard className="overflow-hidden p-0"><MhdTable><thead><tr><MhdTh>Title</MhdTh><MhdTh>Course</MhdTh><MhdTh>Target</MhdTh><MhdTh>Due offset</MhdTh><MhdTh>State</MhdTh><MhdTh>Actions</MhdTh></tr></thead><tbody>{(rules.data ?? []).map((rule) => <MhdTr key={rule.id}><MhdTd className="font-medium">{rule.title}</MhdTd><MhdTd>{rule.courseTitle || courseTitle(rule.courseId)}</MhdTd><MhdTd>{rule.targetType === 'ORG_UNIT' ? `Department: ${rule.targetDepartment ?? '—'}` : rule.targetType === 'JOB_TITLE' ? `Job title: ${jobTitle(rule.targetJobId)}` : `Jurisdiction: ${rule.targetJurisdiction ?? '—'}`}</MhdTd><MhdTd>{rule.dueOffsetDays ?? '—'} days</MhdTd><MhdTd><MhdBadge variant={rule.isActive ? 'success' : 'neutral'} hideIcon>{rule.isActive ? 'Active' : 'Inactive'}</MhdBadge></MhdTd><MhdTd><button type="button" className="text-sm font-medium text-accent disabled:opacity-50" disabled={apply.isPending} onClick={() => void applyRule(rule.id)}>Apply now</button></MhdTd></MhdTr>)}</tbody></MhdTable></MhdCard>}</section> : null}
    {tab === 'requests' ? <section className="space-y-3"><div className="flex items-center gap-3"><label htmlFor="request-status" className="text-sm font-medium">Status</label><select id="request-status" value={requestStatus ?? ''} onChange={(event) => setRequestStatus((event.target.value || null) as MhdTrainingSelfEnrollmentStatus | null)} className="rounded-md border border-border bg-background px-3 py-2 text-sm"><option value="">All</option><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="DENIED">Denied</option></select></div>{requests.isLoading ? <p className="text-sm text-muted-foreground">Loading self-enrollment requests…</p> : (requests.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No {requestStatus ? `${requestStatus.toLowerCase()} ` : ''}self-enrollment requests.</p> : <MhdCard className="overflow-hidden p-0"><MhdTable><thead><tr><MhdTh>Learner</MhdTh><MhdTh>Course</MhdTh><MhdTh>Requested at</MhdTh><MhdTh>Status</MhdTh><MhdTh>Decided at</MhdTh><MhdTh>Decision notes</MhdTh><MhdTh>Actions</MhdTh></tr></thead><tbody>{(requests.data ?? []).map((request) => <MhdTr key={request.id}><MhdTd className="font-medium">{request.personDisplayName}</MhdTd><MhdTd>{request.courseTitle}</MhdTd><MhdTd>{dateTime(request.requestedAt)}</MhdTd><MhdTd><MhdBadge variant={statusVariant(request.status)} hideIcon>{request.status}</MhdBadge></MhdTd><MhdTd>{dateTime(request.decidedAt)}</MhdTd><MhdTd>{request.decisionNotes ?? '—'}</MhdTd><MhdTd>{request.status === 'PENDING' ? <div className="flex gap-3"><button type="button" className="text-sm font-medium text-accent" onClick={() => void decideRequest(request.id, true)}>Approve</button><button type="button" className="text-sm font-medium text-accent" onClick={() => void decideRequest(request.id, false)}>Deny</button></div> : '—'}</MhdTd></MhdTr>)}</tbody></MhdTable></MhdCard>}</section> : null}
    {tab === 'manager' ? <section className="space-y-3"><div><label htmlFor="manager-person">Manager</label><select id="manager-person" value={managerId} onChange={(event) => setManagerId(event.target.value)} className={fieldClass}><option value="">Choose a manager</option>{(people.data ?? []).map((person) => <option key={person.id} value={person.id}>{person.displayName}</option>)}</select></div>{!managerId ? <p className="text-sm text-muted-foreground">Choose a manager to see their team's training status.</p> : teamStatus.isLoading ? <p className="text-sm text-muted-foreground">Loading team status…</p> : (teamStatus.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">This manager's team has no training assignments.</p> : <MhdCard className="overflow-hidden p-0"><MhdTable><thead><tr><MhdTh>Person</MhdTh><MhdTh>Course</MhdTh><MhdTh>Assignment status</MhdTh><MhdTh>Compliance status</MhdTh><MhdTh>Due date</MhdTh></tr></thead><tbody>{(teamStatus.data ?? []).map((row) => <MhdTr key={`${row.personId}-${row.courseId}`}><MhdTd className="font-medium">{row.personDisplayName}</MhdTd><MhdTd>{row.courseTitle}</MhdTd><MhdTd>{row.status}</MhdTd><MhdTd><MhdBadge variant={statusVariant(row.complianceStatus)} hideIcon>{row.complianceStatus}</MhdBadge></MhdTd><MhdTd>{dateOnly(row.dueDate)}</MhdTd></MhdTr>)}</tbody></MhdTable></MhdCard>}</section> : null}
    {creating ? <MhdModal title="New compliance rule" onClose={() => setCreating(false)}><RuleForm companyId={companyId} onSaved={() => setCreating(false)} onError={setError} /></MhdModal> : null}
  </div>;
}

export default MhdComplianceAdminPage;
