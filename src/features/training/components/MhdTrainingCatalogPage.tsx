import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { cn } from '@/utils/cn';
import {
  useMhdAssignTraining,
  useMhdCreateTrainingCourse,
  useMhdSetTrainingCourseActive,
  useMhdTrainingCourses,
  useMhdTrainingPeople,
  useMhdUpdateTrainingCourse,
} from '../Hook';
import type {
  MhdAssignTrainingFormValues,
  MhdTrainingCourseFormValues,
} from '../Schemas';
import {
  mhdFormatTrainingDeliveryMode,
  mhdFormatTrainingRecurrence,
  type MhdTrainingCourse,
} from '../Types';
import { MhdAssignTrainingPanel } from './MhdAssignTrainingPanel';
import { MhdCourseCategoryBadge } from './MhdCourseCategoryBadge';
import { MhdTrainingComplianceBoard } from './MhdTrainingComplianceBoard';
import { MhdTrainingCourseForm } from './MhdTrainingCourseForm';

interface Props {
  companyId: string;
  /**
   * Whether this viewer belongs to the privileged set (Platform Admin / HR
   * Partner / Client Admin) that may author courses and assign. This page lives
   * at the admin `/training` route and is gated to that set — the RPCs re-check
   * `mhd_training_is_privileged` regardless; this only governs the affordances.
   */
  canManage: boolean;
}

/**
 * `/training` — the admin catalog and compliance board.
 *
 * The catalog lists company + platform-global courses. A GLOBAL course
 * (`isGlobal`) is platform-owned: it can be read and assigned but NOT edited or
 * retired — the edit / retire controls are hidden for those rows, and the RPCs
 * refuse them anyway. Company courses are fully editable by an admin.
 */
export function MhdTrainingCatalogPage({ companyId, canManage }: Props) {
  const [includeInactive, setIncludeInactive] = useState(false);
  const [editing, setEditing] = useState<MhdTrainingCourse | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const courses = useMhdTrainingCourses({ companyId, includeInactive });
  const people = useMhdTrainingPeople(canManage ? companyId : null);

  const createCourse = useMhdCreateTrainingCourse();
  const updateCourse = useMhdUpdateTrainingCourse();
  const setActive = useMhdSetTrainingCourseActive();
  const assign = useMhdAssignTraining();

  const activeCourses = useMemo(
    () => (courses.data ?? []).filter((course) => course.isActive),
    [courses.data],
  );

  const peopleOptions = useMemo(
    // `people.data` is MhdPerson[]; its name fields are `string | null`, so infer
    // the element type rather than pinning a `preferredName?: string` shape that
    // does not match the live person model.
    () =>
      (people.data ?? []).map((person) => ({
        id: person.id,
        displayName:
          person.preferredName ||
          [person.firstName, person.lastName].filter(Boolean).join(' '),
      })),
    [people.data],
  );

  async function handleCreate(values: MhdTrainingCourseFormValues) {
    await createCourse.mutateAsync({
      companyId: values.companyId,
      courseKey: values.courseKey,
      title: values.title,
      description: values.description ?? null,
      category: values.category,
      deliveryMode: values.deliveryMode,
      durationMinutes: values.durationMinutes ?? null,
      recurrenceMonths: values.recurrenceMonths ?? null,
      requiresEvidence: values.requiresEvidence,
      externalUrl: values.externalUrl || null,
    });
    setIsCreating(false);
  }

  async function handleUpdate(values: MhdTrainingCourseFormValues) {
    if (!editing) return;
    await updateCourse.mutateAsync({
      courseId: editing.id,
      title: values.title,
      description: values.description ?? null,
      category: values.category,
      deliveryMode: values.deliveryMode,
      durationMinutes: values.durationMinutes ?? null,
      recurrenceMonths: values.recurrenceMonths ?? null,
      requiresEvidence: values.requiresEvidence,
      externalUrl: values.externalUrl || null,
    });
    setEditing(null);
  }

  async function handleAssign(values: MhdAssignTrainingFormValues) {
    await assign.mutateAsync({
      companyId: values.companyId,
      courseId: values.courseId,
      personId: values.personId,
      dueDate: values.dueDate || null,
    });
    setIsAssigning(false);
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Training"
        description="The course catalog and company compliance. Global courses are platform-seeded and read-only."
        actions={
          canManage ? (
            <>
              <Button variant="secondary" onClick={() => setIsAssigning(true)}>
                Assign training
              </Button>
              <Button onClick={() => setIsCreating(true)}>New course</Button>
            </>
          ) : undefined
        }
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground">Catalog</h2>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(event) => setIncludeInactive(event.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Show retired
          </label>
        </div>

        {courses.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading catalog…</p>
        ) : (courses.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No courses in the catalog yet.</p>
        ) : (
          <MhdCard className="overflow-hidden p-0">
            <MhdTable>
              <thead>
                <tr>
                  <MhdTh>Course</MhdTh>
                  <MhdTh>Category</MhdTh>
                  <MhdTh>Delivery</MhdTh>
                  <MhdTh>Recurrence</MhdTh>
                  <MhdTh>Evidence</MhdTh>
                  <MhdTh />
                </tr>
              </thead>
              <tbody>
                {(courses.data ?? []).map((course) => (
                  <MhdTr key={course.id} className={cn(!course.isActive && 'opacity-60')}>
                    <MhdTd>
                      <div className="font-medium text-foreground">
                        {course.title}
                        {course.isGlobal ? (
                          <MhdBadge variant="info" className="ml-2">
                            Global
                          </MhdBadge>
                        ) : null}
                        {!course.isActive ? (
                          <MhdBadge variant="neutral" className="ml-2">
                            Retired
                          </MhdBadge>
                        ) : null}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">{course.referenceId}</div>
                    </MhdTd>
                    <MhdTd>
                      <MhdCourseCategoryBadge category={course.category} />
                    </MhdTd>
                    <MhdTd className="whitespace-nowrap text-muted-foreground">
                      {mhdFormatTrainingDeliveryMode(course.deliveryMode)}
                    </MhdTd>
                    <MhdTd className="whitespace-nowrap text-muted-foreground">
                      {mhdFormatTrainingRecurrence(course.recurrenceMonths)}
                    </MhdTd>
                    <MhdTd className="text-muted-foreground">
                      {course.requiresEvidence ? 'Required' : '—'}
                    </MhdTd>
                    <MhdTd className="whitespace-nowrap text-right">
                      {/* A global course is platform-owned: no edit / retire here.
                          The RPC refuses those on a global course regardless. */}
                      {canManage && !course.isGlobal ? (
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setEditing(course)}
                            className="text-sm font-medium text-accent hover:text-accent-hover"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={setActive.isPending}
                            onClick={() =>
                              void setActive.mutateAsync({
                                courseId: course.id,
                                isActive: !course.isActive,
                              })
                            }
                            className="text-sm font-medium text-accent hover:text-accent-hover disabled:opacity-50"
                          >
                            {course.isActive ? 'Retire' : 'Reactivate'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {course.isGlobal ? 'Read-only' : ''}
                        </span>
                      )}
                    </MhdTd>
                  </MhdTr>
                ))}
              </tbody>
            </MhdTable>
          </MhdCard>
        )}
      </section>

      <MhdTrainingComplianceBoard companyId={companyId} />

      {isCreating && canManage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-foreground">New course</h2>
            <MhdTrainingCourseForm
              companyId={companyId}
              onSubmit={handleCreate}
              onCancel={() => setIsCreating(false)}
              isSubmitting={createCourse.isPending}
            />
          </div>
        </div>
      ) : null}

      {editing && canManage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-foreground">Edit course</h2>
            <MhdTrainingCourseForm
              companyId={companyId}
              course={editing}
              onSubmit={handleUpdate}
              onCancel={() => setEditing(null)}
              isSubmitting={updateCourse.isPending}
            />
          </div>
        </div>
      ) : null}

      {isAssigning && canManage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-foreground">Assign training</h2>
            <MhdAssignTrainingPanel
              companyId={companyId}
              courses={activeCourses}
              people={peopleOptions}
              onSubmit={handleAssign}
              onCancel={() => setIsAssigning(false)}
              isSubmitting={assign.isPending}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
