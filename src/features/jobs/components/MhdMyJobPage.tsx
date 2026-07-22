import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdPublishedJobForPerson } from '../Hook';
import { mhdFormatIndustry, mhdFormatQualificationType } from '../Types';
import { MhdEssentialFunctionList } from './MhdEssentialFunctionList';
import { MhdFlsaBadge } from './MhdFlsaBadge';

/**
 * `/my-job` route entry — the employee's own published job description.
 *
 * A separate route rather than a filtered `/jobs`, deliberately. This screen
 * answers exactly one question, and giving it its own page means the privileged
 * list never has to be defensively filtered on every render. The RPC enforces
 * the boundary regardless; the separate route means a mistake in the list
 * component cannot become a disclosure.
 *
 * Reads the viewer's OWN person id from auth. Pay is absent here by design — it
 * is never returned to a Client User.
 */
export function MhdMyJobPage() {
  const { profile } = useMhdAuth();
  const personId = profile?.personId ?? null;
  const published = useMhdPublishedJobForPerson(personId);

  if (!personId || published.isLoading) {
    return <p className="p-6 text-sm text-neutral-500">Loading your job description…</p>;
  }

  const job = published.data;

  if (!job) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-neutral-900">My job</h1>
        <p className="mt-2 text-sm text-neutral-600">
          No published job description is available for you yet. If you believe this is wrong, speak
          to your HR contact — it usually means a description has been drafted but not published.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-xl font-semibold text-neutral-900">{job.jobTitle}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <MhdFlsaBadge
            flsaClassification={job.flsaClassification}
            isSafetySensitive={job.isSafetySensitive}
          />
          <span className="text-xs text-neutral-500">{mhdFormatIndustry(job.industry)}</span>
          <span className="text-xs text-neutral-500">
            Version {job.versionNumber} · effective {job.effectiveFrom}
          </span>
        </div>
      </header>

      {job.summary ? (
        <section>
          <h2 className="text-sm font-semibold text-neutral-900">Summary</h2>
          <p className="mt-1 text-sm text-neutral-800">{job.summary}</p>
        </section>
      ) : null}

      <MhdEssentialFunctionList
        essential={job.essentialFunctions}
        marginal={job.marginalFunctions}
        readOnly
      />

      {job.qualifications.length > 0 ? (
        <section>
          <h2 className="text-sm font-semibold text-neutral-900">Qualifications</h2>
          <ul className="mt-1 space-y-1 text-sm text-neutral-800">
            {job.qualifications.map((qual, index) => (
              <li key={`qual-${index}`}>
                {qual.text}{' '}
                <span className="text-xs text-neutral-500">
                  ({mhdFormatQualificationType(qual.type)} ·{' '}
                  {qual.required ? 'required' : 'preferred'})
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {job.competencies.length > 0 ? (
        <section>
          <h2 className="text-sm font-semibold text-neutral-900">Competencies</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            These are what a performance review of this role is assessed against.
          </p>
          <ul className="mt-1 space-y-1 text-sm text-neutral-800">
            {job.competencies.map((competency) => (
              <li key={competency.competencyId}>
                {competency.name}
                {competency.isRegulated ? (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                    Regulated
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-xs text-neutral-500">
        This is the published version of your job description. If your role has changed and this no
        longer reflects it, raise it with your HR contact.
      </p>
    </div>
  );
}
