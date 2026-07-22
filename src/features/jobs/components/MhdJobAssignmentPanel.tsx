import { useState } from 'react';
import { useMhdAssignJob, useMhdJobAssignments, useMhdJobs, useMhdJobsPeople } from '../Hook';
import { MhdFlsaBadge } from './MhdFlsaBadge';

interface Props {
  companyId: string;
  personId: string;
  /** False for an employee viewing their own history — read-only. */
  canAssign: boolean;
}

/**
 * A person's job history.
 *
 * Reassignment closes the current row and opens a new one; it never rewrites
 * what came before. That is why the whole history is shown rather than just the
 * current job — a review written last year resolves against the job held then,
 * and someone reading that review needs to be able to see it.
 */
export function MhdJobAssignmentPanel({ companyId, personId, canAssign }: Props) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [jobId, setJobId] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [managerPersonId, setManagerPersonId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const assignments = useMhdJobAssignments(personId);
  const jobs = useMhdJobs(canAssign ? companyId : null);
  const people = useMhdJobsPeople(canAssign ? companyId : null);
  const assign = useMhdAssignJob();

  const current = (assignments.data ?? []).find((a) => a.effectiveTo === null);
  const history = (assignments.data ?? []).filter((a) => a.effectiveTo !== null);

  async function submit() {
    if (!jobId) {
      setError('Choose a job.');
      return;
    }
    if (managerPersonId && managerPersonId === personId) {
      setError('Somebody cannot manage themselves.');
      return;
    }
    setError(null);
    await assign.mutateAsync({
      personId,
      jobId,
      effectiveFrom,
      managerPersonId: managerPersonId || null,
    });
    setIsAssigning(false);
    setJobId('');
    setManagerPersonId('');
  }

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-neutral-900">Job</h2>
        {canAssign ? (
          <button
            type="button"
            onClick={() => setIsAssigning((previous) => !previous)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700"
          >
            {isAssigning ? 'Cancel' : current ? 'Change job' : 'Assign job'}
          </button>
        ) : null}
      </header>

      {assignments.isLoading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : current ? (
        <div className="rounded-md border border-neutral-200 p-4">
          <p className="text-sm font-medium text-neutral-900">{current.jobTitle}</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            {current.jobReference} · since {current.effectiveFrom}
          </p>
          <div className="mt-2">
            <MhdFlsaBadge
              flsaClassification={current.flsaClassification}
              isSafetySensitive={current.isSafetySensitive}
            />
          </div>
        </div>
      ) : (
        <p className="text-sm text-neutral-500">No job assigned.</p>
      )}

      {isAssigning && canAssign ? (
        <div className="space-y-3 rounded-md border border-neutral-200 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="assignJob" className="block text-sm font-medium text-neutral-700">
                Job
              </label>
              <select
                id="assignJob"
                value={jobId}
                onChange={(event) => setJobId(event.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="">Select…</option>
                {(jobs.data ?? [])
                  .filter((job) => job.isActive)
                  .map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.jobTitle}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label htmlFor="assignFrom" className="block text-sm font-medium text-neutral-700">
                Effective from
              </label>
              <input
                id="assignFrom"
                type="date"
                value={effectiveFrom}
                onChange={(event) => setEffectiveFrom(event.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="assignManager" className="block text-sm font-medium text-neutral-700">
              Reports to <span className="font-normal text-neutral-500">(optional)</span>
            </label>
            <select
              id="assignManager"
              value={managerPersonId}
              onChange={(event) => setManagerPersonId(event.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="">Nobody recorded</option>
              {(people.data ?? [])
                .filter((person: { id: string }) => person.id !== personId)
                .map((person: { id: string; firstName?: string; lastName?: string }) => (
                  <option key={person.id} value={person.id}>
                    {[person.firstName, person.lastName].filter(Boolean).join(' ')}
                  </option>
                ))}
            </select>
          </div>

          {current ? (
            <p className="text-xs text-neutral-500">
              The current assignment will be closed the day before this date. Nothing already
              recorded against it changes.
            </p>
          ) : null}
          {error ? <p className="text-xs text-rose-600">{error}</p> : null}

          <div className="flex justify-end">
            <button
              type="button"
              disabled={assign.isPending}
              onClick={() => void submit()}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {assign.isPending ? 'Saving…' : 'Assign'}
            </button>
          </div>
        </div>
      ) : null}

      {history.length > 0 ? (
        <details>
          <summary className="cursor-pointer text-xs text-neutral-500">
            Previous jobs ({history.length})
          </summary>
          <ul className="mt-2 space-y-1 text-sm text-neutral-600">
            {history.map((assignment) => (
              <li key={assignment.id}>
                {assignment.jobTitle}: {assignment.effectiveFrom} → {assignment.effectiveTo}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
