import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdStepper, type MhdStep } from '@/components/ui/MhdStepper';
import { MhdModal } from '@/components/ui/MhdModal';
import {
  useMhdCreateTrainingCurriculum,
  useMhdCreateTrainingProgram,
  useMhdTrainingCourses,
  useMhdTrainingCurriculums,
  useMhdTrainingPrograms,
  useMhdUpdateTrainingCourse,
  useMhdUpdateTrainingCurriculum,
  useMhdUpdateTrainingProgram,
} from '../Hook';
import type { MhdTrainingCurriculum, MhdTrainingProgram } from '../Types';

export type MhdTrainingContentEntityType = 'CURRICULUM' | 'PROGRAM';

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
};

export function validateWizardStep(stepIndex: number, title: string): string | null {
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
}: {
  entityType: MhdTrainingContentEntityType;
  title: string;
  description: string;
  curriculumId: string;
  sortOrder: number;
  isActive: boolean;
  curricula: MhdTrainingCurriculum[];
  onChange: (patch: Partial<{ title: string; description: string; curriculumId: string; sortOrder: number; isActive: boolean }>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="wizard-title">Title</label>
        <input id="wizard-title" value={title} onChange={(event) => onChange({ title: event.target.value })} className="mt-1 w-full rounded-md border border-border px-3 py-2" />
      </div>
      <div>
        <label htmlFor="wizard-description">Description</label>
        <textarea id="wizard-description" value={description} onChange={(event) => onChange({ description: event.target.value })} className="mt-1 w-full rounded-md border border-border px-3 py-2" />
      </div>
      {entityType === 'PROGRAM' ? (
        <>
          <div>
            <label htmlFor="wizard-curriculum">Curriculum</label>
            <select id="wizard-curriculum" value={curriculumId} onChange={(event) => onChange({ curriculumId: event.target.value })} className="mt-1 w-full rounded-md border border-border px-3 py-2">
              <option value="">No curriculum</option>
              {curricula.map((curriculum) => <option key={curriculum.id} value={curriculum.id}>{curriculum.title}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="wizard-sort-order">Sort order</label>
            <input id="wizard-sort-order" type="number" min="0" value={sortOrder} onChange={(event) => onChange({ sortOrder: Number(event.target.value) || 0 })} className="mt-1 w-full rounded-md border border-border px-3 py-2" />
          </div>
        </>
      ) : null}
      <label className="flex gap-2"><input type="checkbox" checked={isActive} onChange={(event) => onChange({ isActive: event.target.checked })} /> Active</label>
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
  const attachedPrograms = programs.filter((program) => program.curriculumId === entityId).sort((a, b) => a.sortOrder - b.sortOrder);
  const attachedCourses = courses.filter((course) => course.programId === entityId);
  const availablePrograms = programs.filter((program) => program.curriculumId !== entityId);
  const availableCourses = courses.filter((course) => course.programId !== entityId);
  if (!entityId) return <p className="text-sm text-muted-foreground">Save the Details step to begin composing this {entityType === 'CURRICULUM' ? 'curriculum' : 'program'}.</p>;
  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <h2 className="font-semibold">Attached {entityType === 'CURRICULUM' ? 'programs' : 'courses'}</h2>
        {(entityType === 'CURRICULUM' ? attachedPrograms : attachedCourses).length === 0 ? <p className="text-sm text-muted-foreground">Nothing attached yet.</p> : null}
        {entityType === 'CURRICULUM' ? attachedPrograms.map((program, index) => (
          <div key={program.id} className="flex items-center justify-between rounded-md border border-border p-2">
            <span>{itemLabel(program.title)}</span>
            <span className="flex gap-2"><button type="button" aria-label={`Move ${program.title} up`} disabled={index === 0} onClick={() => onReorder(program, -1)}>↑</button><button type="button" aria-label={`Move ${program.title} down`} disabled={index === attachedPrograms.length - 1} onClick={() => onReorder(program, 1)}>↓</button><button type="button" className="text-red-700" onClick={() => onAttachProgram(program, false)}>Detach</button></span>
          </div>
        )) : attachedCourses.map((course) => <div key={course.id} className="flex items-center justify-between rounded-md border border-border p-2"><span>{itemLabel(course.title)}</span><button type="button" className="text-red-700" onClick={() => onAttachCourse(course, false)}>Detach</button></div>)}
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold">Add existing {entityType === 'CURRICULUM' ? 'programs' : 'courses'}</h2>
        {(entityType === 'CURRICULUM' ? availablePrograms : availableCourses).map((item) => <div key={item.id} className="flex items-center justify-between rounded-md border border-border p-2"><span>{itemLabel(item.title)}</span><button type="button" onClick={() => entityType === 'CURRICULUM' ? onAttachProgram(item as MhdTrainingProgram, true) : onAttachCourse(item as { id: string; programId: string | null }, true)}>Attach</button></div>)}
      </section>
    </div>
  );
}

export function MhdTrainingContentWizard({ entityType, companyId, entityId, onClose }: MhdTrainingContentWizardProps) {
  const steps = WIZARD_STEPS[entityType];
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showOverview, setShowOverview] = useState(true);
  const [savedEntityId, setSavedEntityId] = useState(entityId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [curriculumId, setCurriculumId] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const curricula = useMhdTrainingCurriculums(companyId, true);
  const programs = useMhdTrainingPrograms({ companyId, includeInactive: true });
  const courses = useMhdTrainingCourses({ companyId, includeInactive: true });
  const createCurriculum = useMhdCreateTrainingCurriculum();
  const updateCurriculum = useMhdUpdateTrainingCurriculum();
  const createProgram = useMhdCreateTrainingProgram();
  const updateProgram = useMhdUpdateTrainingProgram();
  const updateCourse = useMhdUpdateTrainingCourse();
  const currentCurriculum = entityType === 'CURRICULUM' ? (curricula.data ?? []).find((item) => item.id === savedEntityId) : undefined;
  const currentProgram = entityType === 'PROGRAM' ? (programs.data ?? []).find((item) => item.id === savedEntityId) : undefined;

  // The wizard owns editable draft state, so hydrate it when the query returns
  // the row being resumed. This is an intentional server-data-to-form sync.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const item = currentCurriculum ?? currentProgram;
    if (!item) return;
    setTitle(item.title);
      setDescription(item.description ?? '');
      setIsActive(item.isActive);
    if ('curriculumId' in item) {
      setCurriculumId(item.curriculumId ?? '');
      setSortOrder(item.sortOrder);
    }
  }, [currentCurriculum, currentProgram]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const complete = useMemo(() => [Boolean(title.trim()), entityType === 'CURRICULUM' ? (programs.data ?? []).some((item) => item.curriculumId === savedEntityId) : (courses.data ?? []).some((item) => item.programId === savedEntityId), Boolean(savedEntityId)], [courses.data, entityType, programs.data, savedEntityId, title]);

  async function saveDetails() {
    const validationError = validateWizardStep(0, title);
    if (validationError) { setError(validationError); return false; }
    setError(null);
    if (entityType === 'CURRICULUM') {
      if (savedEntityId) await updateCurriculum.mutateAsync({ curriculumId: savedEntityId, title: title.trim(), description, isActive });
      else {
        const result = await createCurriculum.mutateAsync({ companyId, title: title.trim(), description });
        setSavedEntityId(result.id);
      }
    } else if (savedEntityId) {
      await updateProgram.mutateAsync({ programId: savedEntityId, title: title.trim(), description, curriculumId: curriculumId || undefined, clearCurriculumId: !curriculumId, sortOrder, isActive });
    } else {
      const result = await createProgram.mutateAsync({ companyId, title: title.trim(), description, curriculumId: curriculumId || null, sortOrder });
      setSavedEntityId(result.id);
    }
    return true;
  }

  // Shared by both the stepper's Next/Previous and the overview checklist's
  // direct jumps: leaving step 0 for any other step — including jumping
  // straight to Review from a brand-new, never-saved wizard — must persist
  // Details first. Without this guard the checklist could reach Review and
  // "Finish" a curriculum/program that was never actually created.
  async function goToStep(nextIndex: number) {
    if (currentStepIndex === 0 && nextIndex !== 0 && !(await saveDetails())) return;
    setCurrentStepIndex(nextIndex);
    setShowOverview(false);
  }

  async function attachProgram(program: MhdTrainingProgram, attach: boolean) {
    await updateProgram.mutateAsync({ programId: program.id, curriculumId: attach ? savedEntityId : undefined, clearCurriculumId: !attach });
  }

  async function attachCourse(course: { id: string; programId: string | null }, attach: boolean) {
    await updateCourse.mutateAsync({ courseId: course.id, programId: attach ? savedEntityId : undefined, clearProgramId: !attach });
  }

  async function reorder(program: MhdTrainingProgram, delta: number) {
    await updateProgram.mutateAsync({ programId: program.id, sortOrder: Math.max(0, program.sortOrder + delta) });
  }

  const reviewItems = entityType === 'CURRICULUM' ? (programs.data ?? []).filter((item) => item.curriculumId === savedEntityId) : (courses.data ?? []).filter((item) => item.programId === savedEntityId);
  return (
    <MhdModal title={entityType === 'CURRICULUM' ? 'Curriculum Wizard' : 'Program Wizard'} onClose={onClose}>
      <div className="space-y-5">
        {error ? <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
        {showOverview ? <Checklist steps={steps} complete={complete} onSelect={(index) => void goToStep(index)} /> : <>
          <div className="flex justify-end"><Button type="button" variant="secondary" onClick={() => setShowOverview(true)}>Overview</Button></div>
          {currentStepIndex === 0 ? <DetailsStep entityType={entityType} title={title} description={description} curriculumId={curriculumId} sortOrder={sortOrder} isActive={isActive} curricula={curricula.data ?? []} onChange={(patch) => { if (patch.title !== undefined) setTitle(patch.title); if (patch.description !== undefined) setDescription(patch.description); if (patch.curriculumId !== undefined) setCurriculumId(patch.curriculumId); if (patch.sortOrder !== undefined) setSortOrder(patch.sortOrder); if (patch.isActive !== undefined) setIsActive(patch.isActive); }} /> : null}
          {currentStepIndex === 1 ? <CompositionStep entityType={entityType} entityId={savedEntityId} programs={programs.data ?? []} courses={courses.data ?? []} onAttachProgram={(item, attach) => void attachProgram(item, attach)} onAttachCourse={(item, attach) => void attachCourse(item, attach)} onReorder={(item, delta) => void reorder(item, delta)} /> : null}
          {currentStepIndex === 2 ? <div className="space-y-3"><h2 className="text-lg font-semibold">Review</h2><p><strong>Title:</strong> {itemLabel(title)}</p><p><strong>Description:</strong> {description || '—'}</p><p><strong>Attached {entityType === 'CURRICULUM' ? 'programs' : 'courses'}:</strong> {reviewItems.length ? reviewItems.map((item) => itemLabel(item.title)).join(', ') : 'None'}</p><Button type="button" onClick={onClose}>Finish</Button></div> : null}
          <MhdStepper steps={steps} currentStepIndex={currentStepIndex} onNavigate={(index) => void goToStep(index)} validateCurrentStep={() => !validateWizardStep(currentStepIndex, title)} onSubmit={onClose} showSubmit={false} />
        </>}
      </div>
    </MhdModal>
  );
}

export default MhdTrainingContentWizard;
