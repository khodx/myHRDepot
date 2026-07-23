import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
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
    return <p className="text-sm text-muted-foreground">Loading your job description…</p>;
  }

  const job = published.data;

  if (!job) {
    return (
      <div className="space-y-6">
        <MhdPageHeader
          title="My job"
          description="No published job description is available for you yet. If you believe this is wrong, speak to your HR contact — it usually means a description has been drafted but not published."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title={job.jobTitle}
        chips={
          <MhdFlsaBadge
            flsaClassification={job.flsaClassification}
            isSafetySensitive={job.isSafetySensitive}
          />
        }
        description={
          <>
            {mhdFormatIndustry(job.industry)} · Version {job.versionNumber} · effective{' '}
            {job.effectiveFrom}
          </>
        }
      />

      {job.summary ? (
        <section>
          <h2 className="text-sm font-semibold text-foreground">Summary</h2>
          <p className="mt-1 text-sm text-foreground">{job.summary}</p>
        </section>
      ) : null}

      <MhdEssentialFunctionList
        essential={job.essentialFunctions}
        marginal={job.marginalFunctions}
        readOnly
      />

      {job.qualifications.length > 0 ? (
        <section>
          <h2 className="text-sm font-semibold text-foreground">Qualifications</h2>
          <ul className="mt-1 space-y-1 text-sm text-foreground">
            {job.qualifications.map((qual, index) => (
              <li key={`qual-${index}`}>
                {qual.text}{' '}
                <span className="text-xs text-muted-foreground">
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
          <h2 className="text-sm font-semibold text-foreground">Competencies</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            These are what a performance review of this role is assessed against.
          </p>
          <ul className="mt-1 space-y-1 text-sm text-foreground">
            {job.competencies.map((competency) => (
              <li key={competency.competencyId}>
                {competency.name}
                {competency.isRegulated ? (
                  <MhdBadge variant="warning" className="ml-2">
                    Regulated
                  </MhdBadge>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-xs text-muted-foreground">
        This is the published version of your job description. If your role has changed and this no
        longer reflects it, raise it with your HR contact.
      </p>
    </div>
  );
}
