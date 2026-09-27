import { Fragment, useMemo, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdModal } from '@/components/ui/MhdModal';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdCancelTrainingIltEnrollment,
  useMhdCheckInTrainingIlt,
  useMhdCheckOutTrainingIlt,
  useMhdCreateTrainingIltSession,
  useMhdEnrollTrainingIlt,
  useMhdOverrideTrainingIltAttendance,
  useMhdTrainingCourses,
  useMhdTrainingIltRoster,
  useMhdTrainingIltSessionsByCompany,
  useMhdTrainingPeople,
} from '../Hook';
import type {
  MhdTrainingEnrollmentStatus,
  MhdTrainingIltRosterEntry,
  MhdTrainingMeetingProvider,
} from '../Types';

function fieldClass() {
  return 'mt-1 w-full rounded-md border border-border bg-background px-3 py-2';
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

function formatTimestamp(value: string | null) {
  return value ? new Date(value).toLocaleString() : '—';
}

function formatProvider(value: MhdTrainingMeetingProvider) {
  return value === 'TEAMS' ? 'Microsoft Teams' : value === 'MEET' ? 'Google Meet' : 'None';
}

function statusVariant(status: MhdTrainingEnrollmentStatus): MhdBadgeVariant {
  return status === 'ENROLLED' ? 'success' : status === 'WAITLISTED' ? 'warning' : 'neutral';
}

function ServerError({ message }: { message: string | null }) {
  return message ? (
    <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      {message}
    </div>
  ) : null;
}

function SessionForm({ companyId, onSaved, onError }: { companyId: string; onSaved: () => void; onError: (message: string) => void }) {
  const courses = useMhdTrainingCourses({ companyId });
  const people = useMhdTrainingPeople(companyId);
  const create = useMhdCreateTrainingIltSession();
  const [meetingProvider, setMeetingProvider] = useState<MhdTrainingMeetingProvider>('NONE');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const startTime = String(data.get('startTime') ?? '');
    const endTime = String(data.get('endTime') ?? '');
    const capacityValue = String(data.get('capacity') ?? '').trim();
    const capacity = capacityValue ? Number(capacityValue) : null;
    if (endTime <= startTime) {
      onError('End time must be later than start time.');
      return;
    }
    if (capacity !== null && (!Number.isInteger(capacity) || capacity <= 0)) {
      onError('Capacity must be a positive whole number.');
      return;
    }
    onError('');
    try {
      await create.mutateAsync({
        companyId,
        courseId: String(data.get('courseId') ?? ''),
        sessionDate: String(data.get('sessionDate') ?? ''),
        startTime,
        endTime,
        instructorName: String(data.get('instructorName') ?? '').trim(),
        instructorPersonId: String(data.get('instructorPersonId') ?? '') || null,
        roomOrResourceLabel: String(data.get('roomOrResourceLabel') ?? '').trim() || null,
        capacity,
        meetingProvider: String(data.get('meetingProvider') ?? 'NONE') as MhdTrainingMeetingProvider,
        meetingJoinUrl: String(data.get('meetingJoinUrl') ?? '').trim() || null,
      });
      onSaved();
    } catch (error) {
      onError(errorMessage(error, 'Unable to create the ILT session.'));
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <MhdFormFieldStack>
        <div><label htmlFor="ilt-course">Course</label><select id="ilt-course" name="courseId" required defaultValue="" className={fieldClass()}><option value="">Choose a course</option>{(courses.data ?? []).map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></div>
        <div><label htmlFor="ilt-session-date">Session date</label><input id="ilt-session-date" name="sessionDate" type="date" required className={fieldClass()} /></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="ilt-start-time">Start time</label><input id="ilt-start-time" name="startTime" type="time" required className={fieldClass()} /></div><div><label htmlFor="ilt-end-time">End time</label><input id="ilt-end-time" name="endTime" type="time" required className={fieldClass()} /></div></div>
        <div><label htmlFor="ilt-instructor-name">Instructor name</label><input id="ilt-instructor-name" name="instructorName" required className={fieldClass()} /><p className="mt-1 text-xs text-muted-foreground">An external or vendor instructor is valid.</p></div>
        <div><label htmlFor="ilt-instructor-person">Linked instructor (optional)</label><select id="ilt-instructor-person" name="instructorPersonId" defaultValue="" className={fieldClass()}><option value="">External instructor (name only)</option>{(people.data ?? []).map((person) => <option key={person.id} value={person.id}>{person.displayName}</option>)}</select></div>
        <div><label htmlFor="ilt-room">Room or resource label (optional)</label><input id="ilt-room" name="roomOrResourceLabel" className={fieldClass()} /><p className="mt-1 text-xs text-muted-foreground">Informational only; this does not check for room or resource conflicts.</p></div>
        <div><label htmlFor="ilt-capacity">Capacity (optional)</label><input id="ilt-capacity" name="capacity" type="number" min="1" step="1" className={fieldClass()} /></div>
        <div><label htmlFor="ilt-provider">Meeting provider</label><select id="ilt-provider" name="meetingProvider" value={meetingProvider} onChange={(event) => setMeetingProvider(event.target.value as MhdTrainingMeetingProvider)} className={fieldClass()}><option value="NONE">None</option><option value="TEAMS">Microsoft Teams</option><option value="MEET">Google Meet</option></select><p className="mt-1 text-xs text-muted-foreground">This is only a provider label and optional join URL. There is no live Teams/Meet integration or automatic attendance sync.</p></div>
        {meetingProvider !== 'NONE' ? <div><label htmlFor="ilt-join-url">Meeting join URL (optional)</label><input id="ilt-join-url" name="meetingJoinUrl" type="url" className={fieldClass()} /></div> : null}
      </MhdFormFieldStack>
      <div className="flex justify-end"><Button type="submit" disabled={create.isPending}>{create.isPending ? 'Creating…' : 'Create session'}</Button></div>
    </form>
  );
}

function AttendanceOverrideForm({ sessionId, entry, onSaved, onError }: { sessionId: string; entry: MhdTrainingIltRosterEntry; onSaved: () => void; onError: (message: string) => void }) {
  const override = useMhdOverrideTrainingIltAttendance();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const checkInAt = String(data.get('checkInAt') ?? '');
    const checkOutAt = String(data.get('checkOutAt') ?? '');
    const reason = String(data.get('reason') ?? '').trim();
    if (!checkInAt || !checkOutAt) { onError('Both check-in and check-out timestamps are required for an override.'); return; }
    if (!reason) { onError('A reason is required for an attendance override.'); return; }
    if (new Date(checkOutAt).getTime() < new Date(checkInAt).getTime()) { onError('Check-out must be at or after check-in.'); return; }
    onError('');
    try {
      await override.mutateAsync({ sessionId, personId: entry.personId, checkInAt: new Date(checkInAt).toISOString(), checkOutAt: new Date(checkOutAt).toISOString(), reason });
      onSaved();
    } catch (error) { onError(errorMessage(error, 'Unable to override attendance.')); }
  }
  return <form onSubmit={submit} className="space-y-4"><p className="text-sm text-muted-foreground">Use this to correct attendance recorded in error, not for routine check-in or check-out.</p><MhdFormFieldStack><div><label htmlFor="override-check-in">Check-in timestamp</label><input id="override-check-in" name="checkInAt" type="datetime-local" defaultValue={entry.checkInAt ? entry.checkInAt.slice(0, 16) : ''} className={fieldClass()} /></div><div><label htmlFor="override-check-out">Check-out timestamp</label><input id="override-check-out" name="checkOutAt" type="datetime-local" defaultValue={entry.checkOutAt ? entry.checkOutAt.slice(0, 16) : ''} className={fieldClass()} /></div><div><label htmlFor="override-reason">Reason</label><textarea id="override-reason" name="reason" rows={3} className={fieldClass()} /></div></MhdFormFieldStack><div className="flex justify-end"><Button type="submit" disabled={override.isPending}>{override.isPending ? 'Saving…' : 'Save override'}</Button></div></form>;
}

function Roster({ sessionId, companyId, onError }: { sessionId: string; companyId: string; onError: (message: string) => void }) {
  const roster = useMhdTrainingIltRoster(sessionId);
  const people = useMhdTrainingPeople(companyId);
  const enroll = useMhdEnrollTrainingIlt();
  const cancel = useMhdCancelTrainingIltEnrollment();
  const checkIn = useMhdCheckInTrainingIlt();
  const checkOut = useMhdCheckOutTrainingIlt();
  const [personId, setPersonId] = useState('');
  const [overrideEntry, setOverrideEntry] = useState<MhdTrainingIltRosterEntry | null>(null);
  const rosterPersonIds = useMemo(() => new Set((roster.data ?? []).map((entry) => entry.personId)), [roster.data]);
  const availablePeople = (people.data ?? []).filter((person) => !rosterPersonIds.has(person.id));

  async function run(action: () => Promise<unknown>, fallback: string) { try { onError(''); await action(); } catch (error) { onError(errorMessage(error, fallback)); } }
  async function enrollPerson() { if (!personId) { onError('Choose a person to enroll.'); return; } await run(() => enroll.mutateAsync({ sessionId, personId }), 'Unable to enroll this person.'); setPersonId(''); }

  if (roster.isLoading) return <p className="text-sm text-muted-foreground">Loading roster…</p>;
  if (roster.error) return <ServerError message={errorMessage(roster.error, 'Unable to load the roster.')} />;
  return <div className="space-y-3"><div className="flex flex-wrap items-end gap-2"><div className="min-w-64 flex-1"><label htmlFor="enroll-person">Enroll a person</label><select id="enroll-person" value={personId} onChange={(event) => setPersonId(event.target.value)} className={fieldClass()}><option value="">Choose a person</option>{availablePeople.map((person) => <option key={person.id} value={person.id}>{person.displayName}</option>)}</select></div><Button onClick={() => void enrollPerson()} disabled={enroll.isPending || availablePeople.length === 0}>{enroll.isPending ? 'Enrolling…' : 'Enroll'}</Button></div>{(roster.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No one is enrolled in this session yet.</p> : <MhdCard className="overflow-hidden p-0"><MhdTable><thead><tr><MhdTh>Person</MhdTh><MhdTh>Status</MhdTh><MhdTh>Enrolled at</MhdTh><MhdTh>Check-in</MhdTh><MhdTh>Check-out</MhdTh><MhdTh>Source</MhdTh><MhdTh>Override reason</MhdTh><MhdTh>Actions</MhdTh></tr></thead><tbody>{(roster.data ?? []).map((entry) => <MhdTr key={entry.enrollmentId}><MhdTd className="font-medium">{entry.personDisplayName}</MhdTd><MhdTd><MhdBadge variant={statusVariant(entry.status)} hideIcon>{entry.status}</MhdBadge></MhdTd><MhdTd>{formatTimestamp(entry.enrolledAt)}</MhdTd><MhdTd>{formatTimestamp(entry.checkInAt)}</MhdTd><MhdTd>{formatTimestamp(entry.checkOutAt)}</MhdTd><MhdTd>{entry.attendanceSource ? <MhdBadge variant="info" hideIcon>{entry.attendanceSource}</MhdBadge> : '—'}</MhdTd><MhdTd>{entry.overrideReason ?? '—'}</MhdTd><MhdTd><div className="flex flex-wrap gap-2 text-xs">{(entry.status === 'ENROLLED' || entry.status === 'WAITLISTED') ? <button type="button" className="font-medium text-accent" onClick={() => { if (window.confirm(`Cancel enrollment for ${entry.personDisplayName}?`)) void run(() => cancel.mutateAsync({ enrollmentId: entry.enrollmentId }), 'Unable to cancel enrollment.'); }}>Cancel enrollment</button> : null}{entry.status === 'ENROLLED' && !entry.checkInAt ? <button type="button" className="font-medium text-accent" onClick={() => void run(() => checkIn.mutateAsync({ sessionId, personId: entry.personId }), 'Unable to check in this person.')}>Check in</button> : null}{entry.status === 'ENROLLED' && entry.checkInAt && !entry.checkOutAt ? <button type="button" className="font-medium text-accent" onClick={() => void run(() => checkOut.mutateAsync({ sessionId, personId: entry.personId }), 'Unable to check out this person.')}>Check out</button> : null}<button type="button" className="font-medium text-accent" onClick={() => { onError(''); setOverrideEntry(entry); }}>Attendance override</button></div></MhdTd></MhdTr>)}</tbody></MhdTable></MhdCard>}{overrideEntry ? <MhdModal title="Attendance override" onClose={() => setOverrideEntry(null)}><AttendanceOverrideForm sessionId={sessionId} entry={overrideEntry} onSaved={() => setOverrideEntry(null)} onError={onError} /></MhdModal> : null}</div>;
}

export function MhdIltSessionAdminPage() {
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const sessions = useMhdTrainingIltSessionsByCompany(companyId, true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const queryError = sessions.error ? errorMessage(sessions.error, 'Unable to load ILT sessions.') : null;
  return <div className="space-y-6"><MhdPageHeader title="ILT Sessions" description="Create instructor-led training sessions and manage their enrollment and attendance." actions={<Button onClick={() => { setError(null); setCreating(true); }}>New Session</Button>} /><ServerError message={error ?? queryError} />{sessions.isLoading ? <p className="text-sm text-muted-foreground">Loading ILT sessions…</p> : (sessions.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No ILT sessions have been created yet.</p> : <MhdCard className="overflow-hidden p-0"><MhdTable><thead><tr><MhdTh>Course</MhdTh><MhdTh>Date</MhdTh><MhdTh>Time</MhdTh><MhdTh>Instructor</MhdTh><MhdTh>Room/resource</MhdTh><MhdTh>Capacity</MhdTh><MhdTh>Enrolled / waitlisted</MhdTh><MhdTh>Meeting</MhdTh><MhdTh>Status</MhdTh><MhdTh>Actions</MhdTh></tr></thead><tbody>{(sessions.data ?? []).map((session) => <Fragment key={session.id}><MhdTr onClick={() => setSelectedSessionId((current) => current === session.id ? null : session.id)}><MhdTd className="font-medium">{session.courseTitle}</MhdTd><MhdTd>{formatDate(session.sessionDate)}</MhdTd><MhdTd className="whitespace-nowrap">{session.startTime.slice(0, 5)}–{session.endTime.slice(0, 5)}</MhdTd><MhdTd>{session.instructorName}</MhdTd><MhdTd>{session.roomOrResourceLabel ?? '—'}</MhdTd><MhdTd>{session.capacity ?? '—'}</MhdTd><MhdTd>{session.enrolledCount} / {session.waitlistedCount}</MhdTd><MhdTd>{formatProvider(session.meetingProvider)}</MhdTd><MhdTd><MhdBadge variant={session.isCancelled ? 'neutral' : 'success'} hideIcon>{session.isCancelled ? 'Cancelled' : 'Active'}</MhdBadge></MhdTd><MhdTd><button type="button" className="whitespace-nowrap text-sm font-medium text-accent" onClick={() => setSelectedSessionId((current) => current === session.id ? null : session.id)}>{selectedSessionId === session.id ? 'Hide roster' : 'Manage roster'}</button></MhdTd></MhdTr>{selectedSessionId === session.id ? <tr><td colSpan={10} className="bg-muted/30 px-4 py-4"><Roster sessionId={session.id} companyId={companyId} onError={setError} /></td></tr> : null}</Fragment>)}</tbody></MhdTable></MhdCard>}{creating ? <MhdModal title="New ILT session" onClose={() => setCreating(false)}><SessionForm companyId={companyId} onSaved={() => setCreating(false)} onError={setError} /></MhdModal> : null}</div>;
}

export default MhdIltSessionAdminPage;
