import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTabs } from '@/components/ui/MhdTabs';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdAddTrainingPrerequisite,
  useMhdApproveTrainingContent,
  useMhdPublishTrainingContent,
  useMhdRemoveTrainingPrerequisite,
  useMhdSetTrainingCourseContentMode,
  useMhdSubmitTrainingContentForReview,
  useMhdTrainingContentApprovals,
  useMhdTrainingCourses,
  useMhdTrainingPrerequisites,
  useMhdTrainingPrograms,
} from '../Hook';
import {
  mhdFormatTrainingApprovalStatus,
  mhdFormatTrainingCategory,
  mhdFormatTrainingContentMode,
  mhdFormatTrainingDeliveryMode,
  mhdFormatTrainingRecurrence,
  type MhdTrainingApprovalStatus,
  type MhdTrainingContentMode,
} from '../Types';
import { MhdCourseCategoryBadge } from './MhdCourseCategoryBadge';
import { MhdTrainingContentTreeEditor } from './MhdTrainingContentTreeEditor';

type Tab = 'overview' | 'prerequisites' | 'content';

const APPROVAL_VARIANTS: Record<MhdTrainingApprovalStatus, MhdBadgeVariant> = {
  DRAFT: 'neutral',
  IN_REVIEW: 'warning',
  APPROVED: 'info',
  PUBLISHED: 'success',
};

const CONTENT_MODE_VARIANTS: Record<MhdTrainingContentMode, MhdBadgeVariant> = {
  EVIDENCE_ONLY: 'neutral',
  AUTHORED: 'info',
};

export function MhdTrainingCourseDetailPage() {
  const { courseId = '' } = useParams<{ courseId: string }>();
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? '';

  const courses = useMhdTrainingCourses({ companyId, includeInactive: true });
  const programs = useMhdTrainingPrograms({ companyId });
  const prerequisites = useMhdTrainingPrerequisites(courseId || null);
  const approvals = useMhdTrainingContentApprovals(courseId || null);

  const mode = useMhdSetTrainingCourseContentMode();
  const submit = useMhdSubmitTrainingContentForReview();
  const approve = useMhdApproveTrainingContent();
  const publish = useMhdPublishTrainingContent();
  const addPrerequisite = useMhdAddTrainingPrerequisite();
  const removePrerequisite = useMhdRemoveTrainingPrerequisite();

  const [tab, setTab] = useState<Tab>('overview');
  const [error, setError] = useState<string | null>(null);
  const [selectedPrerequisite, setSelectedPrerequisite] = useState('');

  const course = courses.data?.find((item) => item.id === courseId);

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'The action could not be completed.');
    }
  }

  if (!course) {
    return (
      <div className="space-y-4">
        <MhdPageHeader title="Course" backTo="/training" backLabel="Training" />
        {courses.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading course…</p>
        ) : (
          <p className="text-sm text-muted-foreground">Course not found.</p>
        )}
      </div>
    );
  }

  const courseId_ = course.id;
  const approvalStatus = course.approvalStatus;

  async function convert() {
    if (!window.confirm('Convert this evidence-only course to an authored course? This cannot be reversed.')) return;
    await run(() => mode.mutateAsync({ courseId: courseId_, contentMode: 'AUTHORED' }));
  }

  async function advanceApproval() {
    if (approvalStatus === 'DRAFT') {
      await run(() => submit.mutateAsync({ courseId: courseId_ }));
      return;
    }
    if (approvalStatus === 'IN_REVIEW') {
      const notes = window.prompt('Optional review notes:');
      await run(() => approve.mutateAsync({ courseId: courseId_, reviewNotes: notes || null }));
      return;
    }
    if (approvalStatus === 'APPROVED') {
      await run(() => publish.mutateAsync({ courseId: courseId_ }));
    }
  }

  async function handleAddPrerequisite() {
    if (!selectedPrerequisite || selectedPrerequisite === courseId_) return;
    await run(async () => {
      await addPrerequisite.mutateAsync({ courseId: courseId_, prerequisiteCourseId: selectedPrerequisite });
      setSelectedPrerequisite('');
    });
  }

  async function handleRemovePrerequisite(prerequisiteCourseId: string) {
    await run(() =>
      removePrerequisite.mutateAsync({ courseId: courseId_, prerequisiteCourseId }),
    );
  }

  const approvalActionLabel =
    course.approvalStatus === 'DRAFT'
      ? 'Submit for Review'
      : course.approvalStatus === 'IN_REVIEW'
        ? 'Approve Content'
        : course.approvalStatus === 'APPROVED'
          ? 'Publish Content'
          : null;

  const existingPrerequisiteIds = new Set(
    (prerequisites.data ?? []).map((item) => item.prerequisiteCourseId),
  );
  const availablePrerequisiteCourses = (courses.data ?? []).filter(
    (item) => item.id !== courseId_ && !existingPrerequisiteIds.has(item.id),
  );

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title={course.title}
        backTo="/training"
        backLabel="Training"
        chips={
          <>
            <MhdCourseCategoryBadge category={course.category} />
            <MhdBadge variant={CONTENT_MODE_VARIANTS[course.contentMode]}>
              {mhdFormatTrainingContentMode(course.contentMode)}
            </MhdBadge>
            <MhdBadge variant={APPROVAL_VARIANTS[course.approvalStatus]}>
              {mhdFormatTrainingApprovalStatus(course.approvalStatus)}
            </MhdBadge>
          </>
        }
      />

      {error ? (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <MhdTabs
        tabs={[
          { value: 'overview', label: 'Overview' },
          { value: 'prerequisites', label: 'Prerequisites', count: prerequisites.data?.length },
          { value: 'content', label: 'Content' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'overview' ? (
        <div className="space-y-4">
          <MhdCard className="space-y-4">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Category</dt>
                <dd>{mhdFormatTrainingCategory(course.category)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Delivery mode</dt>
                <dd>{mhdFormatTrainingDeliveryMode(course.deliveryMode)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Duration</dt>
                <dd>{course.durationMinutes ? `${course.durationMinutes} minutes` : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Recurrence</dt>
                <dd>{mhdFormatTrainingRecurrence(course.recurrenceMonths)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Requires evidence</dt>
                <dd>{course.requiresEvidence ? 'Yes' : 'No'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Program</dt>
                <dd>{programs.data?.find((program) => program.id === course.programId)?.title ?? 'No program'}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2">
              {course.contentMode === 'EVIDENCE_ONLY' ? (
                <Button variant="secondary" onClick={() => void convert()}>
                  Convert to Authored Course
                </Button>
              ) : null}
              {approvalActionLabel ? (
                <Button onClick={() => void advanceApproval()}>{approvalActionLabel}</Button>
              ) : null}
            </div>
          </MhdCard>

          <MhdCard className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Approval History</h2>
            {approvals.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading approval history…</p>
            ) : (approvals.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No approval transitions recorded yet.</p>
            ) : (
              <ul className="space-y-2">
                {(approvals.data ?? []).map((entry) => (
                  <li key={entry.id} className="border-b border-border pb-2 text-sm last:border-0 last:pb-0">
                    <span className="font-medium text-foreground">
                      {mhdFormatTrainingApprovalStatus(entry.fromStatus as MhdTrainingApprovalStatus)}
                      {' → '}
                      {mhdFormatTrainingApprovalStatus(entry.toStatus as MhdTrainingApprovalStatus)}
                    </span>
                    <span className="text-muted-foreground"> by {entry.reviewedByName}</span>
                    {entry.reviewNotes ? <p className="mt-1 text-muted-foreground">{entry.reviewNotes}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </MhdCard>
        </div>
      ) : null}

      {tab === 'prerequisites' ? (
        <MhdCard className="space-y-4">
          <div className="flex gap-2">
            <select
              value={selectedPrerequisite}
              onChange={(event) => setSelectedPrerequisite(event.target.value)}
              className="min-w-0 flex-1 rounded-md border border-border px-3 py-2 text-sm"
            >
              <option value="">Choose a prerequisite course</option>
              {availablePrerequisiteCourses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
            <Button onClick={() => void handleAddPrerequisite()} disabled={!selectedPrerequisite}>
              Add
            </Button>
          </div>
          {prerequisites.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading prerequisites…</p>
          ) : (prerequisites.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">This course has no prerequisites.</p>
          ) : (
            (prerequisites.data ?? []).map((item) => (
              <div
                key={item.prerequisiteCourseId}
                className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0"
              >
                <span>{item.prerequisiteTitle}</span>
                <button
                  type="button"
                  className="text-red-700"
                  onClick={() => void handleRemovePrerequisite(item.prerequisiteCourseId)}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </MhdCard>
      ) : null}

      {tab === 'content' ? (
        <MhdTrainingContentTreeEditor courseId={courseId_} />
      ) : null}
    </div>
  );
}

export default MhdTrainingCourseDetailPage;
