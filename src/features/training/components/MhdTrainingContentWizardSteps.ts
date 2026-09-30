import type { MhdStep } from '@/components/ui/MhdStepper';

export type MhdTrainingContentEntityType = 'CURRICULUM' | 'PROGRAM' | 'COURSE';

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
    {
      id: 'content',
      title: 'Content',
      description: 'Build the module, lesson, and block sequence.',
    },
    {
      id: 'prerequisites',
      title: 'Prerequisites',
      description: 'Choose courses that must be completed first.',
    },
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
