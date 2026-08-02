import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { mhdAssignTrainingSchema, type MhdAssignTrainingFormValues } from '../Schemas';
import { mhdFormatTrainingCategory, type MhdTrainingCourse } from '../Types';

interface PersonOption {
  id: string;
  displayName: string;
}

interface Props {
  companyId: string;
  /** Active courses only — a retired course cannot be assigned (the RPC refuses it). */
  courses: MhdTrainingCourse[];
  people: PersonOption[];
  onSubmit: (values: MhdAssignTrainingFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

/**
 * Admin assigns a course to a person, with an optional due date.
 *
 * Assigning fans out to a Task and a Notification server-side — but ONLY if the
 * person has a user account. A person with no login still gets the assignment
 * row (an admin records their completion later); nothing here needs to know
 * that — the RPC handles the fan-out. The one-live-assignment-per-person-per-course
 * guard is a server invariant; a duplicate raises, and that error is surfaced
 * rather than pre-empted here.
 */
export function MhdAssignTrainingPanel({
  companyId,
  courses,
  people,
  onSubmit,
  onCancel,
  isSubmitting,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdAssignTrainingFormValues>({
    resolver: zodResolver(mhdAssignTrainingSchema),
    defaultValues: {
      companyId,
      courseId: '',
      personId: '',
      dueDate: null,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" value={companyId} {...register('companyId')} readOnly />

      <div>
        <label htmlFor="assignCourse" className="block text-sm font-medium text-foreground">
          Course
        </label>
        <select
          id="assignCourse"
          {...register('courseId')}
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
        >
          <option value="">Choose a course…</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {mhdFormatTrainingCategory(course.category)} — {course.title}
            </option>
          ))}
        </select>
        {errors.courseId ? (
          <p className="mt-1 text-xs text-rose-600">{errors.courseId.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="assignPerson" className="block text-sm font-medium text-foreground">
          Assign to
        </label>
        <select
          id="assignPerson"
          {...register('personId')}
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
        >
          <option value="">Choose a person…</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.displayName}
            </option>
          ))}
        </select>
        {errors.personId ? (
          <p className="mt-1 text-xs text-rose-600">{errors.personId.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="assignDue" className="block text-sm font-medium text-foreground">
          Due date <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          id="assignDue"
          type="date"
          {...register('dueDate')}
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          A due date drives the OVERDUE status and the due-soon reminder. Leave blank for no
          deadline.
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Assigning…' : 'Assign Training'}
        </Button>
      </div>
    </form>
  );
}
