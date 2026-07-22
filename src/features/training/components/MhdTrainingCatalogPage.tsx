import { useMemo, useState } from 'react';
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
    <div className="space-y-8 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Training</h1>
          <p className="mt-1 text-sm text-neutral-600">
            The course catalog and company compliance. Global courses are platform-seeded and
            read-only.
          </p>
        </div>
        {canManage ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsAssigning(true)}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
            >
              Assign training
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-50"
            >
              New course
            </button>
          </div>
        ) : null}
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-neutral-900">Catalog</h2>
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(event) => setIncludeInactive(event.target.checked)}
              className="h-4 w-4 rounded border-neutral-300"
            />
            Show retired
          </label>
        </div>

        {courses.isLoading ? (
          <p className="text-sm text-neutral-500">Loading catalog…</p>
        ) : (courses.data ?? []).length === 0 ? (
          <p className="text-sm text-neutral-500">No courses in the catalog yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="py-2 pr-4 font-medium">Course</th>
                  <th className="py-2 pr-4 font-medium">Category</th>
                  <th className="py-2 pr-4 font-medium">Delivery</th>
                  <th className="py-2 pr-4 font-medium">Recurrence</th>
                  <th className="py-2 pr-4 font-medium">Evidence</th>
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {(courses.data ?? []).map((course) => (
                  <tr
                    key={course.id}
                    className={`border-b border-neutral-100 text-neutral-800 ${
                      course.isActive ? '' : 'opacity-60'
                    }`}
                  >
                    <td className="py-2 pr-4">
                      <div className="font-medium text-neutral-900">
                        {course.title}
                        {course.isGlobal ? (
                          <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">
                            Global
                          </span>
                        ) : null}
                        {!course.isActive ? (
                          <span className="ml-2 rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600">
                            Retired
                          </span>
                        ) : null}
                      </div>
                      <div className="font-mono text-xs text-neutral-400">{course.referenceId}</div>
                    </td>
                    <td className="py-2 pr-4">
                      <MhdCourseCategoryBadge category={course.category} />
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap text-neutral-600">
                      {mhdFormatTrainingDeliveryMode(course.deliveryMode)}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap text-neutral-600">
                      {mhdFormatTrainingRecurrence(course.recurrenceMonths)}
                    </td>
                    <td className="py-2 pr-4 text-neutral-600">
                      {course.requiresEvidence ? 'Required' : '—'}
                    </td>
                    <td className="py-2 text-right whitespace-nowrap">
                      {/* A global course is platform-owned: no edit / retire here.
                          The RPC refuses those on a global course regardless. */}
                      {canManage && !course.isGlobal ? (
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setEditing(course)}
                            className="text-sm text-neutral-500 underline"
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
                            className="text-sm text-neutral-500 underline disabled:opacity-50"
                          >
                            {course.isActive ? 'Retire' : 'Reactivate'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400">
                          {course.isGlobal ? 'Read-only' : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <MhdTrainingComplianceBoard companyId={companyId} />

      {isCreating && canManage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-lg bg-card p-6">
            <h2 className="mb-4 text-base font-semibold text-neutral-900">New course</h2>
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
          <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-lg bg-card p-6">
            <h2 className="mb-4 text-base font-semibold text-neutral-900">Edit course</h2>
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
          <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-lg bg-card p-6">
            <h2 className="mb-4 text-base font-semibold text-neutral-900">Assign training</h2>
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
