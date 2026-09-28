import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdStepper, type MhdStep } from '@/components/ui/MhdStepper';
import { MhdModal } from '@/components/ui/MhdModal';
import {
  useMhdCreateTrainingCurriculum,
  useMhdCreateTrainingCourse,
  useMhdCreateTrainingCourseFromTemplate,
  useMhdCreateTrainingProgram,
  useMhdTrainingCourses,
  useMhdTrainingCurriculums,
  useMhdTrainingPrograms,
  useMhdTrainingTemplateSlots,
  useMhdTrainingTemplates,
  useMhdUpdateTrainingCourse,
  useMhdUpdateTrainingCurriculum,
  useMhdUpdateTrainingProgram,
} from '../Hook';
import {
  MHD_TRAINING_CATEGORIES,
  MHD_TRAINING_DELIVERY_MODES,
  mhdFormatTrainingCategory,
  mhdFormatTrainingDeliveryMode,
  type MhdTrainingCategory,
  type MhdTrainingCurriculum,
  type MhdTrainingDeliveryMode,
  type MhdTrainingProgram,
  type MhdTrainingTemplate,
} from '../Types';

export type MhdTrainingContentEntityType = 'CURRICULUM' | 'PROGRAM' | 'COURSE';

export interface MhdTrainingContentWizardProps {
  entityType: MhdTrainingContentEntityType;
  companyId: string;
  entityId: string | null;
  onClose: () => void;
}

export const WIZARD_STEPS: Record<MhdTrainingContentEntityType, MhdStep[]> = {
  CURRICULUM: [
    { id: 'details', title: 'Details', description: 'Name and describe the curriculum.' },
    { id: 'programs', title: 'Programs', description: 'Compose existing programs.' },
    { id: 'review', title: 'Review', description: 'Confirm and finish.' },
  ],
  PROGRAM: [
    { id: 'details', title: 'Details', description: 'Name and place the program.' },
    { id: 'courses', title: 'Courses', description: 'Compose existing courses.' },
    { id: 'review', title: 'Review', description: 'Confirm and finish.' },
  ],
  COURSE: [
    { id: 'details', title: 'Details', description: 'Define the course metadata.' },
    { id: 'template', title: 'Template', description: 'Start blank or choose a template.' },
    { id: 'review', title: 'Review', description: 'Confirm and finish.' },
  ],
};

export function validateWizardStep(
  stepIndex: number,
  title: string,
  courseKey = '',
  isCourseStep = false,
): string | null {
  // `isCourseStep` must be explicit, not inferred from `courseKey` being
  // non-empty: a genuinely blank Course courseKey ('') is indistinguishable
  // from "not applicable" (also '') without it, which let an empty
  // course_key slip through creation entirely untested.
  if (stepIndex === 0 && isCourseStep && !courseKey.trim())
    return 'Enter a course key to continue.';
  if (stepIndex === 0 && !title.trim()) return 'Enter a title to continue.';
  return null;
}

function itemLabel(title: string | null | undefined) {
  return title?.trim() || 'Untitled';
}

function Checklist({
  steps,
  complete,
  onSelect,
}: {
  steps: MhdStep[];
  complete: boolean[];
  onSelect: (index: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Wizard overview</h2>
        <p className="text-sm text-muted-foreground">Choose a step to start or resume authoring.</p>
      </div>
      <ol className="space-y-2" aria-label="Wizard overview">
        {steps.map((step, index) => (
          <li key={step.id}>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-md border border-border p-3 text-left hover:bg-muted"
              onClick={() => onSelect(index)}
            >
              <span>
                <span className="block font-medium">{step.title}</span>
                <span className="text-sm text-muted-foreground">{step.description}</span>
              </span>
              <span className={complete[index] ? 'text-green-700' : 'text-muted-foreground'}>
                {complete[index] ? 'Complete' : 'Incomplete'}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

function DetailsStep({
  entityType,
  title,
  description,
  curriculumId,
  sortOrder,
  isActive,
  curricula,
  onChange,
  courseKey,
  category,
  deliveryMode,
  durationMinutes,
  recurrenceMonths,
  requiresEvidence,
  externalUrl,
  programs,
  savedEntityId,
}: {
  entityType: MhdTrainingContentEntityType;
  title: string;
  description: string;
  curriculumId: string;
  sortOrder: number;
  isActive: boolean;
  curricula: MhdTrainingCurriculum[];
  courseKey?: string;
  category?: MhdTrainingCategory;
  deliveryMode?: MhdTrainingDeliveryMode;
  durationMinutes?: number | null;
  recurrenceMonths?: number | null;
  requiresEvidence?: boolean;
  externalUrl?: string;
  programs?: MhdTrainingProgram[];
  savedEntityId?: string | null;
  onChange: (
    patch: Partial<{
      title: string;
      description: string;
      curriculumId: string;
      sortOrder: number;
      isActive: boolean;
      courseKey: string;
      category: MhdTrainingCategory;
      deliveryMode: MhdTrainingDeliveryMode;
      durationMinutes: number | null;
      recurrenceMonths: number | null;
      requiresEvidence: boolean;
      externalUrl: string;
    }>,
  ) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="wizard-title">Title</label>
        <input
          id="wizard-title"
          value={title}
          onChange={(event) => onChange({ title: event.target.value })}
          className="mt-1 w-full rounded-md border border-border px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="wizard-description">Description</label>
        <textarea
          id="wizard-description"
          value={description}
          onChange={(event) => onChange({ description: event.target.value })}
          className="mt-1 w-full rounded-md border border-border px-3 py-2"
        />
      </div>
      {entityType === 'PROGRAM' ? (
        <>
          <div>
            <label htmlFor="wizard-curriculum">Curriculum</label>
            <select
              id="wizard-curriculum"
              value={curriculumId}
              onChange={(event) => onChange({ curriculumId: event.target.value })}
              className="mt-1 w-full rounded-md border border-border px-3 py-2"
            >
              <option value="">No curriculum</option>
              {curricula.map((curriculum) => (
                <option key={curriculum.id} value={curriculum.id}>
                  {curriculum.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="wizard-sort-order">Sort order</label>
            <input
              id="wizard-sort-order"
              type="number"
              min="0"
              value={sortOrder}
              onChange={(event) => onChange({ sortOrder: Number(event.target.value) || 0 })}
              className="mt-1 w-full rounded-md border border-border px-3 py-2"
            />
          </div>
        </>
      ) : null}
      {entityType === 'COURSE' ? (
        <>
          <div>
            <label htmlFor="wizard-course-key">Course key</label>
            <input
              id="wizard-course-key"
              value={courseKey ?? ''}
              readOnly={Boolean(savedEntityId)}
              onChange={(event) => onChange({ courseKey: event.target.value })}
              className="mt-1 w-full rounded-md border border-border px-3 py-2"
            />
            {savedEntityId ? (
              <p className="mt-1 text-xs text-muted-foreground">
                The key is the course&apos;s stable identity and cannot be changed.
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="wizard-category">Category</label>
            <select
              id="wizard-category"
              value={category}
              onChange={(event) =>
                onChange({ category: event.target.value as MhdTrainingCategory })
              }
              className="mt-1 w-full rounded-md border border-border px-3 py-2"
            >
              {MHD_TRAINING_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {mhdFormatTrainingCategory(value)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="wizard-program">
              Program <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <select
              id="wizard-program"
              value={curriculumId}
              onChange={(event) => onChange({ curriculumId: event.target.value })}
              className="mt-1 w-full rounded-md border border-border px-3 py-2"
            >
              <option value="">No program</option>
              {(programs ?? []).map((program) => (
                <option key={program.id} value={program.id}>
                  {program.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="wizard-delivery-mode">Delivery mode</label>
            <select
              id="wizard-delivery-mode"
              value={deliveryMode}
              onChange={(event) =>
                onChange({ deliveryMode: event.target.value as MhdTrainingDeliveryMode })
              }
              className="mt-1 w-full rounded-md border border-border px-3 py-2"
            >
              {MHD_TRAINING_DELIVERY_MODES.map((value) => (
                <option key={value} value={value}>
                  {mhdFormatTrainingDeliveryMode(value)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="wizard-duration">
              Duration (minutes){' '}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              id="wizard-duration"
              type="number"
              min={1}
              value={durationMinutes ?? ''}
              onChange={(event) =>
                onChange({
                  durationMinutes: event.target.value ? Number(event.target.value) : null,
                })
              }
              className="mt-1 w-full rounded-md border border-border px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="wizard-recurrence">
              Recurrence (months){' '}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              id="wizard-recurrence"
              type="number"
              min={1}
              value={recurrenceMonths ?? ''}
              onChange={(event) =>
                onChange({
                  recurrenceMonths: event.target.value ? Number(event.target.value) : null,
                })
              }
              className="mt-1 w-full rounded-md border border-border px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="wizard-external-url">
              External URL <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              id="wizard-external-url"
              type="url"
              value={externalUrl ?? ''}
              onChange={(event) => onChange({ externalUrl: event.target.value })}
              className="mt-1 w-full rounded-md border border-border px-3 py-2"
            />
          </div>
          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={Boolean(requiresEvidence)}
              onChange={(event) => onChange({ requiresEvidence: event.target.checked })}
            />{' '}
            Requires evidence
          </label>
        </>
      ) : null}
      <label className="flex gap-2">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) => onChange({ isActive: event.target.checked })}
        />{' '}
        Active
      </label>
    </div>
  );
}

function TemplateStep({
  templates,
  selectedTemplateId,
  slots,
  onSelect,
  savedEntityId,
}: {
  templates: MhdTrainingTemplate[];
  selectedTemplateId: string;
  slots: Array<{
    id: string;
    slotLabel: string;
    expectedBlockType: string | null;
    isRequired: boolean;
  }>;
  onSelect: (templateId: string) => void;
  savedEntityId: string | null;
}) {
  const selected = templates.find((template) => template.id === selectedTemplateId);
  return (
    <div className="space-y-4">
      {savedEntityId ? (
        <p className="rounded-md border border-border bg-muted p-3 text-sm">
          The template choice was saved when this course was created and cannot be changed.
        </p>
      ) : null}
      <div>
        <label htmlFor="wizard-template">Course template</label>
        <select
          id="wizard-template"
          value={selectedTemplateId}
          disabled={Boolean(savedEntityId)}
          onChange={(event) => onSelect(event.target.value)}
          className="mt-1 w-full rounded-md border border-border px-3 py-2"
        >
          <option value="">Start blank</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.title}
              {template.isGlobal ? ' (Global)' : ''}
            </option>
          ))}
        </select>
      </div>
      {selected ? (
        <div className="space-y-3 rounded-md border border-border p-3">
          <p className="text-sm">
            {selected.rigidity === 'LOCKED'
              ? 'This LOCKED template will create these slots automatically as course modules when the course is created.'
              : 'This COMPOSABLE template is a guide. Its slots are not auto-applied; you can pick and arrange content during authoring.'}
          </p>
          {slots.length ? (
            <ul className="space-y-2" aria-label="Template slots">
              {slots.map((slot) => (
                <li key={slot.id} className="rounded border border-border p-2 text-sm">
                  <span className="font-medium">{slot.slotLabel}</span>
                  {slot.expectedBlockType ? ` — ${slot.expectedBlockType}` : ''}
                  {slot.isRequired ? ' (required)' : ' (optional)'}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">This template has no slots yet.</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No template will be applied. You can author the course structure in a later step.
        </p>
      )}
    </div>
  );
}

function CompositionStep({
  entityType,
  entityId,
  programs,
  courses,
  onAttachProgram,
  onAttachCourse,
  onReorder,
}: {
  entityType: MhdTrainingContentEntityType;
  entityId: string | null;
  programs: MhdTrainingProgram[];
  courses: Array<{ id: string; title: string; programId: string | null }>;
  onAttachProgram: (program: MhdTrainingProgram, attach: boolean) => void;
  onAttachCourse: (course: { id: string; programId: string | null }, attach: boolean) => void;
  onReorder: (program: MhdTrainingProgram, delta: number) => void;
}) {
  const attachedPrograms = programs
    .filter((program) => program.curriculumId === entityId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const attachedCourses = courses.filter((course) => course.programId === entityId);
  const availablePrograms = programs.filter((program) => program.curriculumId !== entityId);
  const availableCourses = courses.filter((course) => course.programId !== entityId);
  if (!entityId)
    return (
      <p className="text-sm text-muted-foreground">
        Save the Details step to begin composing this{' '}
        {entityType === 'CURRICULUM' ? 'curriculum' : 'program'}.
      </p>
    );
  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <h2 className="font-semibold">
          Attached {entityType === 'CURRICULUM' ? 'programs' : 'courses'}
        </h2>
        {(entityType === 'CURRICULUM' ? attachedPrograms : attachedCourses).length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing attached yet.</p>
        ) : null}
        {entityType === 'CURRICULUM'
          ? attachedPrograms.map((program, index) => (
              <div
                key={program.id}
                className="flex items-center justify-between rounded-md border border-border p-2"
              >
                <span>{itemLabel(program.title)}</span>
                <span className="flex gap-2">
                  <button
                    type="button"
                    aria-label={`Move ${program.title} up`}
                    disabled={index === 0}
                    onClick={() => onReorder(program, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${program.title} down`}
                    disabled={index === attachedPrograms.length - 1}
                    onClick={() => onReorder(program, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="text-red-700"
                    onClick={() => onAttachProgram(program, false)}
                  >
                    Detach
                  </button>
                </span>
              </div>
            ))
          : attachedCourses.map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between rounded-md border border-border p-2"
              >
                <span>{itemLabel(course.title)}</span>
                <button
                  type="button"
                  className="text-red-700"
                  onClick={() => onAttachCourse(course, false)}
                >
                  Detach
                </button>
              </div>
            ))}
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold">
          Add existing {entityType === 'CURRICULUM' ? 'programs' : 'courses'}
        </h2>
        {(entityType === 'CURRICULUM' ? availablePrograms : availableCourses).map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-md border border-border p-2"
          >
            <span>{itemLabel(item.title)}</span>
            <button
              type="button"
              onClick={() =>
                entityType === 'CURRICULUM'
                  ? onAttachProgram(item as MhdTrainingProgram, true)
                  : onAttachCourse(item as { id: string; programId: string | null }, true)
              }
            >
              Attach
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}

export function MhdTrainingContentWizard({
  entityType,
  companyId,
  entityId,
  onClose,
}: MhdTrainingContentWizardProps) {
  const steps = WIZARD_STEPS[entityType];
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showOverview, setShowOverview] = useState(true);
  const [savedEntityId, setSavedEntityId] = useState(entityId);
  const [title, setTitle] = useState('');
  const [courseKey, setCourseKey] = useState('');
  const [description, setDescription] = useState('');
  const [curriculumId, setCurriculumId] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [category, setCategory] = useState<MhdTrainingCategory>('OTHER');
  const [deliveryMode, setDeliveryMode] = useState<MhdTrainingDeliveryMode>('DOCUMENT');
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [recurrenceMonths, setRecurrenceMonths] = useState<number | null>(null);
  const [requiresEvidence, setRequiresEvidence] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const curricula = useMhdTrainingCurriculums(companyId, true);
  const programs = useMhdTrainingPrograms({ companyId, includeInactive: true });
  const courses = useMhdTrainingCourses({ companyId, includeInactive: true });
  const createCurriculum = useMhdCreateTrainingCurriculum();
  const updateCurriculum = useMhdUpdateTrainingCurriculum();
  const createProgram = useMhdCreateTrainingProgram();
  const updateProgram = useMhdUpdateTrainingProgram();
  const updateCourse = useMhdUpdateTrainingCourse();
  const createCourse = useMhdCreateTrainingCourse();
  const createCourseFromTemplate = useMhdCreateTrainingCourseFromTemplate();
  const templates = useMhdTrainingTemplates(entityType === 'COURSE' ? companyId : null);
  const templateSlots = useMhdTrainingTemplateSlots(
    entityType === 'COURSE' ? selectedTemplateId || null : null,
  );
  const currentCurriculum =
    entityType === 'CURRICULUM'
      ? (curricula.data ?? []).find((item) => item.id === savedEntityId)
      : undefined;
  const currentProgram =
    entityType === 'PROGRAM'
      ? (programs.data ?? []).find((item) => item.id === savedEntityId)
      : undefined;
  const currentCourse =
    entityType === 'COURSE'
      ? (courses.data ?? []).find((item) => item.id === savedEntityId)
      : undefined;

  // The wizard owns editable draft state, so hydrate it when the query returns
  // the row being resumed. This is an intentional server-data-to-form sync.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const item = currentCurriculum ?? currentProgram;
    if (currentCourse) {
      setCourseKey(currentCourse.courseKey);
      setTitle(currentCourse.title);
      setDescription(currentCourse.description ?? '');
      setCategory(currentCourse.category);
      setDeliveryMode(currentCourse.deliveryMode);
      setDurationMinutes(currentCourse.durationMinutes);
      setRecurrenceMonths(currentCourse.recurrenceMonths);
      setRequiresEvidence(currentCourse.requiresEvidence);
      setExternalUrl(currentCourse.externalUrl ?? '');
      setCurriculumId(currentCourse.programId ?? '');
      setSelectedTemplateId(currentCourse.templateId ?? '');
      setIsActive(currentCourse.isActive);
      return;
    }
    if (!item) return;
    setTitle(item.title);
    setDescription(item.description ?? '');
    setIsActive(item.isActive);
    if ('curriculumId' in item) {
      setCurriculumId(item.curriculumId ?? '');
      setSortOrder(item.sortOrder);
    }
  }, [currentCourse, currentCurriculum, currentProgram]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const complete = useMemo(
    () =>
      entityType === 'COURSE'
        ? [
            Boolean(title.trim() && courseKey.trim()),
            Boolean(savedEntityId),
            Boolean(savedEntityId),
          ]
        : [
            Boolean(title.trim()),
            entityType === 'CURRICULUM'
              ? (programs.data ?? []).some((item) => item.curriculumId === savedEntityId)
              : (courses.data ?? []).some((item) => item.programId === savedEntityId),
            Boolean(savedEntityId),
          ],
    [courseKey, courses.data, entityType, programs.data, savedEntityId, title],
  );

  async function saveDetails() {
    const validationError = validateWizardStep(
      0,
      title,
      entityType === 'COURSE' ? courseKey : '',
      entityType === 'COURSE',
    );
    if (validationError) {
      setError(validationError);
      return false;
    }
    setError(null);
    if (entityType === 'COURSE') {
      if (savedEntityId)
        await updateCourse.mutateAsync({
          courseId: savedEntityId,
          title: title.trim(),
          description,
          category,
          deliveryMode,
          durationMinutes,
          recurrenceMonths,
          requiresEvidence,
          externalUrl: externalUrl || null,
          programId: curriculumId || undefined,
        });
      return true;
    }
    if (entityType === 'CURRICULUM') {
      if (savedEntityId)
        await updateCurriculum.mutateAsync({
          curriculumId: savedEntityId,
          title: title.trim(),
          description,
          isActive,
        });
      else {
        const result = await createCurriculum.mutateAsync({
          companyId,
          title: title.trim(),
          description,
        });
        setSavedEntityId(result.id);
      }
    } else if (savedEntityId) {
      await updateProgram.mutateAsync({
        programId: savedEntityId,
        title: title.trim(),
        description,
        curriculumId: curriculumId || undefined,
        clearCurriculumId: !curriculumId,
        sortOrder,
        isActive,
      });
    } else {
      const result = await createProgram.mutateAsync({
        companyId,
        title: title.trim(),
        description,
        curriculumId: curriculumId || null,
        sortOrder,
      });
      setSavedEntityId(result.id);
    }
    return true;
  }

  async function createCourseAtTemplateStep() {
    if (savedEntityId) return true;
    const input = {
      companyId,
      courseKey: courseKey.trim(),
      title: title.trim(),
      description,
      category,
      deliveryMode,
      durationMinutes,
      recurrenceMonths,
      requiresEvidence,
      externalUrl: externalUrl || null,
      programId: curriculumId || null,
    };
    const result = selectedTemplateId
      ? await createCourseFromTemplate.mutateAsync({ ...input, templateId: selectedTemplateId })
      : await createCourse.mutateAsync(input);
    setSavedEntityId(result.id);
    return true;
  }

  // Shared by both the stepper's Next/Previous and the overview checklist's
  // direct jumps: leaving step 0 for any other step — including jumping
  // straight to Review from a brand-new, never-saved wizard — must persist
  // Details first. Without this guard the checklist could reach Review and
  // "Finish" a curriculum/program that was never actually created.
  async function goToStep(nextIndex: number) {
    if (currentStepIndex === 0 && nextIndex !== 0 && !(await saveDetails())) return;
    if (
      entityType === 'COURSE' &&
      currentStepIndex === 0 &&
      nextIndex > 1 &&
      !(await createCourseAtTemplateStep())
    )
      return;
    if (
      entityType === 'COURSE' &&
      currentStepIndex === 1 &&
      nextIndex !== 1 &&
      !(await createCourseAtTemplateStep())
    )
      return;
    setCurrentStepIndex(nextIndex);
    setShowOverview(false);
  }

  async function attachProgram(program: MhdTrainingProgram, attach: boolean) {
    await updateProgram.mutateAsync({
      programId: program.id,
      curriculumId: attach ? savedEntityId : undefined,
      clearCurriculumId: !attach,
    });
  }

  async function attachCourse(course: { id: string; programId: string | null }, attach: boolean) {
    await updateCourse.mutateAsync({
      courseId: course.id,
      programId: attach ? savedEntityId : undefined,
      clearProgramId: !attach,
    });
  }

  async function reorder(program: MhdTrainingProgram, delta: number) {
    await updateProgram.mutateAsync({
      programId: program.id,
      sortOrder: Math.max(0, program.sortOrder + delta),
    });
  }

  const reviewItems =
    entityType === 'CURRICULUM'
      ? (programs.data ?? []).filter((item) => item.curriculumId === savedEntityId)
      : (courses.data ?? []).filter((item) => item.programId === savedEntityId);
  return (
    <MhdModal
      title={
        entityType === 'CURRICULUM'
          ? 'Curriculum Wizard'
          : entityType === 'PROGRAM'
            ? 'Program Wizard'
            : 'Course Wizard'
      }
      onClose={onClose}
    >
      <div className="space-y-5">
        {error ? (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            {error}
          </p>
        ) : null}
        {showOverview ? (
          <Checklist steps={steps} complete={complete} onSelect={(index) => void goToStep(index)} />
        ) : (
          <>
            <div className="flex justify-end">
              <Button type="button" variant="secondary" onClick={() => setShowOverview(true)}>
                Overview
              </Button>
            </div>
            {currentStepIndex === 0 ? (
              <DetailsStep
                entityType={entityType}
                title={title}
                description={description}
                curriculumId={curriculumId}
                sortOrder={sortOrder}
                isActive={isActive}
                curricula={curricula.data ?? []}
                programs={programs.data ?? []}
                savedEntityId={savedEntityId}
                courseKey={courseKey}
                category={category}
                deliveryMode={deliveryMode}
                durationMinutes={durationMinutes}
                recurrenceMonths={recurrenceMonths}
                requiresEvidence={requiresEvidence}
                externalUrl={externalUrl}
                onChange={(patch) => {
                  if (patch.title !== undefined) setTitle(patch.title);
                  if (patch.description !== undefined) setDescription(patch.description);
                  if (patch.curriculumId !== undefined) setCurriculumId(patch.curriculumId);
                  if (patch.sortOrder !== undefined) setSortOrder(patch.sortOrder);
                  if (patch.isActive !== undefined) setIsActive(patch.isActive);
                  if (patch.courseKey !== undefined) setCourseKey(patch.courseKey);
                  if (patch.category !== undefined) setCategory(patch.category);
                  if (patch.deliveryMode !== undefined) setDeliveryMode(patch.deliveryMode);
                  if (patch.durationMinutes !== undefined)
                    setDurationMinutes(patch.durationMinutes);
                  if (patch.recurrenceMonths !== undefined)
                    setRecurrenceMonths(patch.recurrenceMonths);
                  if (patch.requiresEvidence !== undefined)
                    setRequiresEvidence(patch.requiresEvidence);
                  if (patch.externalUrl !== undefined) setExternalUrl(patch.externalUrl);
                }}
              />
            ) : null}
            {currentStepIndex === 1 ? (
              entityType === 'COURSE' ? (
                <TemplateStep
                  templates={templates.data ?? []}
                  selectedTemplateId={selectedTemplateId}
                  slots={templateSlots.data ?? []}
                  onSelect={setSelectedTemplateId}
                  savedEntityId={savedEntityId}
                />
              ) : (
                <CompositionStep
                  entityType={entityType}
                  entityId={savedEntityId}
                  programs={programs.data ?? []}
                  courses={courses.data ?? []}
                  onAttachProgram={(item, attach) => void attachProgram(item, attach)}
                  onAttachCourse={(item, attach) => void attachCourse(item, attach)}
                  onReorder={(item, delta) => void reorder(item, delta)}
                />
              )
            ) : null}
            {currentStepIndex === 2 ? (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Review</h2>
                <p>
                  <strong>Title:</strong> {itemLabel(title)}
                </p>
                {entityType === 'COURSE' ? (
                  <>
                    <p>
                      <strong>Course key:</strong> {courseKey}
                    </p>
                    <p>
                      <strong>Template:</strong>{' '}
                      {selectedTemplateId
                        ? (templates.data?.find((template) => template.id === selectedTemplateId)
                            ?.title ?? 'Selected template')
                        : 'Start blank'}
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      <strong>Description:</strong> {description || '—'}
                    </p>
                    <p>
                      <strong>
                        Attached {entityType === 'CURRICULUM' ? 'programs' : 'courses'}:
                      </strong>{' '}
                      {reviewItems.length
                        ? reviewItems.map((item) => itemLabel(item.title)).join(', ')
                        : 'None'}
                    </p>
                  </>
                )}
                <Button type="button" onClick={onClose}>
                  Finish
                </Button>
              </div>
            ) : null}
            <MhdStepper
              steps={steps}
              currentStepIndex={currentStepIndex}
              onNavigate={(index) => void goToStep(index)}
              validateCurrentStep={() =>
                !validateWizardStep(
                  currentStepIndex,
                  title,
                  entityType === 'COURSE' ? courseKey : '',
                  entityType === 'COURSE',
                )
              }
              onSubmit={onClose}
              showSubmit={false}
            />
          </>
        )}
      </div>
    </MhdModal>
  );
}

export default MhdTrainingContentWizard;
