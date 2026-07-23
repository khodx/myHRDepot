import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import {
  useMhdCompleteTraining,
  useMhdTrainingAssignments,
  useMhdTrainingCompletions,
  useMhdTrainingCourses,
} from '../Hook';
import {
  mhdFormatTrainingComplianceStatus,
  type MhdTrainingAssignment,
  type MhdTrainingCourse,
} from '../Types';
import { MhdCompletionHistoryPanel } from './MhdCompletionHistoryPanel';
import { MhdCourseCategoryBadge } from './MhdCourseCategoryBadge';
import { MhdTrainingStatusBadge } from './MhdTrainingStatusBadge';

interface Props {
  companyId: string;
  /** The signed-in employee's own person id. This page shows ONLY their rows. */
  personId: string;
  /**
   * Opens the host app's Attachments picker and resolves to an `attachment_id`
   * (the certificate), or null if the user cancels. Injected as a contract so
   * this module never reaches into Attachments directly — `attachment_id` is a
   * soft link. When absent, the certificate affordance is simply not offered.
   */
  onAttachCertificate?: () => Promise<string | null>;
}

/**
 * `/my-training` — the employee self-service surface.
 *
 * Any authenticated employee reaches this page; it is gated by identity, not by
 * the privileged role that governs the admin catalog. The list is the employee's
 * OWN assignments (RLS narrows the RPC to their rows) and their own completion
 * history. They complete via `mhd_training_complete`.
 *
 * Each row's status is the SERVER-DERIVED `complianceStatus` — rendered, never
 * recomputed. The evidence gate is the server's: a `requires_evidence` course
 * refuses a bare `ATTESTED`, so this page GUIDES the employee to attach a
 * certificate (and sends `CERTIFICATE` when one is attached) but does not try to
 * enforce the rule itself — it surfaces the server's error if it fires.
 */
export function MhdMyTrainingPage({ companyId, personId, onAttachCertificate }: Props) {
  const assignments = useMhdTrainingAssignments({ companyId, personId, status: 'ALL' });
  const completions = useMhdTrainingCompletions(personId);
  // The catalog carries `requiresEvidence` / `externalUrl`, which the assignment
  // row does not — an employee may read `course_list` (it gates on company access,
  // not on the privileged role). Used only to guide the completion affordance.
  const courses = useMhdTrainingCourses({ companyId });

  const courseById = useMemo(() => {
    const map = new Map<string, MhdTrainingCourse>();
    for (const course of courses.data ?? []) map.set(course.id, course);
    return map;
  }, [courses.data]);

  const openAssignments = useMemo(
    () => (assignments.data ?? []).filter((a) => a.status === 'ASSIGNED'),
    [assignments.data],
  );
  const otherAssignments = useMemo(
    () => (assignments.data ?? []).filter((a) => a.status !== 'ASSIGNED'),
    [assignments.data],
  );

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="My training"
        description="Training assigned to you, and your completion history. Complete a course to record dated evidence."
      />

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">To do</h2>
        {assignments.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading assignments…</p>
        ) : openAssignments.length === 0 ? (
          <p className="text-sm text-muted-foreground">You have no outstanding training.</p>
        ) : (
          <ul className="space-y-2">
            {openAssignments.map((assignment) => (
              <MhdMyTrainingAssignmentRow
                key={assignment.id}
                assignment={assignment}
                course={courseById.get(assignment.courseId) ?? null}
                onAttachCertificate={onAttachCertificate}
              />
            ))}
          </ul>
        )}
      </section>

      {otherAssignments.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Assigned history</h2>
          <ul className="space-y-2">
            {otherAssignments.map((assignment) => (
              <li
                key={assignment.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{assignment.courseTitle}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <MhdCourseCategoryBadge category={assignment.category} /> ·{' '}
                    {mhdFormatTrainingComplianceStatus(assignment.complianceStatus)}
                  </p>
                </div>
                <MhdTrainingStatusBadge status={assignment.complianceStatus} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <MhdCompletionHistoryPanel
        completions={completions.data ?? []}
        isLoading={completions.isLoading}
        title="My completion history"
      />
    </div>
  );
}

interface RowProps {
  assignment: MhdTrainingAssignment;
  course: MhdTrainingCourse | null;
  onAttachCertificate?: () => Promise<string | null>;
}

/**
 * One open assignment with its completion controls. Kept as its own component so
 * the attach / submit state is isolated per row.
 */
function MhdMyTrainingAssignmentRow({ assignment, course, onAttachCertificate }: RowProps) {
  const complete = useMhdCompleteTraining();
  const [attachmentId, setAttachmentId] = useState<string | null>(null);
  const [isAttaching, setIsAttaching] = useState(false);

  const requiresEvidence = course?.requiresEvidence ?? false;
  const externalUrl = course?.externalUrl ?? null;

  async function handleAttach() {
    if (!onAttachCertificate) return;
    setIsAttaching(true);
    try {
      const id = await onAttachCertificate();
      if (id) setAttachmentId(id);
    } finally {
      setIsAttaching(false);
    }
  }

  async function handleComplete() {
    // When a certificate is attached the method is CERTIFICATE; otherwise a bare
    // ATTESTED. If the course requires evidence and none is attached, the server
    // refuses — we let that error surface below rather than pre-empting it.
    await complete.mutateAsync({
      assignmentId: assignment.id,
      completionMethod: attachmentId ? 'CERTIFICATE' : 'ATTESTED',
      attachmentId,
    });
  }

  return (
    <li className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">{assignment.courseTitle}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <MhdCourseCategoryBadge category={assignment.category} />
            {assignment.dueDate ? ` · due ${assignment.dueDate}` : ' · no due date'}
          </p>
          {externalUrl ? (
            <a
              href={externalUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-xs font-medium text-accent hover:text-accent-hover"
            >
              Open course material
            </a>
          ) : null}
        </div>
        {/* Server-derived compliance status — rendered, not recomputed. */}
        <MhdTrainingStatusBadge status={assignment.complianceStatus} />
      </div>

      {requiresEvidence ? (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          This course requires a certificate. Attach one before completing — self-attestation alone
          is not accepted.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {onAttachCertificate ? (
          <Button variant="secondary" onClick={() => void handleAttach()} disabled={isAttaching}>
            {isAttaching
              ? 'Attaching…'
              : attachmentId
                ? 'Certificate attached ✓'
                : 'Attach certificate'}
          </Button>
        ) : null}
        <Button onClick={() => void handleComplete()} disabled={complete.isPending}>
          {complete.isPending
            ? 'Recording…'
            : attachmentId
              ? 'Complete with certificate'
              : 'Attest completion'}
        </Button>
      </div>

      {/* Surface the server's error — notably the evidence-gate refusal — verbatim. */}
      {complete.isError ? (
        <p className="text-xs text-rose-600">
          {complete.error instanceof Error
            ? complete.error.message
            : 'Could not record the completion.'}
        </p>
      ) : null}
    </li>
  );
}
