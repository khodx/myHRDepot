import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { mhdRecruitingService } from '../Service';
import {
  mhdApplySchema,
  mhdEeoSelfIdSchema,
  type MhdApplyFormValues,
  type MhdEeoSelfIdFormValues,
} from '../Schemas';
import {
  MHD_RECRUITING_EEO_DISABILITY_STATUSES,
  MHD_RECRUITING_EEO_GENDERS,
  MHD_RECRUITING_EEO_RACE_ETHNICITIES,
  MHD_RECRUITING_EEO_VETERAN_STATUSES,
  mhdFormatEeoDisabilityStatus,
  mhdFormatEeoGender,
  mhdFormatEeoRaceEthnicity,
  mhdFormatEeoVeteranStatus,
} from '../Types';

interface Props {
  /**
   * The invite token. INJECTED BOUNDARY: the host route may pass it explicitly;
   * otherwise it is read from the `?token=` query string (the `/apply?token=…`
   * contract). This is the ONLY credential this page has — the page is
   * UNAUTHENTICATED, modeled on the e-signature `/sign` route. There is no auth
   * session, no company context, and no logged-in user; the token alone gates the
   * `application_submit` and `eeo_submit` RPCs server-side.
   */
  token?: string;
}

// ---------------------------------------------------------------------------
// THIS PAGE IS PUBLIC AND TOKEN-DRIVEN.
//
// It is served at the app-layer public route `/apply?token=…`, OUTSIDE the
// authenticated shell — no login, no session, no `useCompany()`. The invite
// token from the URL is the sole credential; both RPCs it calls are
// security-definer and token-gated. It calls the service DIRECTLY (no react-query
// hook, no cache) exactly as the e-sign `MhdPublicSigningPage` does.
//
// The EEO self-identification step is VOLUNTARY and writes only to the
// hard-restricted partition via `eeo_submit`. Nothing the applicant enters here
// is ever read back onto a recruiter surface.
// ---------------------------------------------------------------------------
export function MhdApplyPage({ token: tokenProp }: Props) {
  const [searchParams] = useSearchParams();
  const token = tokenProp ?? searchParams.get('token') ?? '';

  const [submitted, setSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [eeoDone, setEeoDone] = useState(false);
  const [eeoError, setEeoError] = useState<string | null>(null);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const [isSubmittingEeo, setIsSubmittingEeo] = useState(false);

  const applyForm = useForm<MhdApplyFormValues>({
    resolver: zodResolver(mhdApplySchema),
    defaultValues: {
      desiredPayRate: null,
      availabilityDate: '',
      employmentTypeDesired: '',
      coverNote: '',
    },
  });

  const eeoForm = useForm<MhdEeoSelfIdFormValues>({
    resolver: zodResolver(mhdEeoSelfIdSchema),
    defaultValues: {
      raceEthnicity: '',
      gender: '',
      veteranStatus: '',
      disabilityStatus: '',
      declined: false,
    },
  });

  async function handleApply(values: MhdApplyFormValues) {
    if (!token) return;
    setSubmitError(null);
    setIsSubmittingApplication(true);
    try {
      const result = await mhdRecruitingService.submitApplication({
        inviteToken: token,
        desiredPayRate: values.desiredPayRate ?? null,
        availabilityDate: values.availabilityDate || null,
        employmentTypeDesired: values.employmentTypeDesired || null,
        coverNote: values.coverNote || null,
      });
      setReferenceId(result.referenceId);
      setSubmitted(true);
    } catch (error) {
      // Surface the server's message (invalid/expired link, already submitted, …).
      setSubmitError(
        error instanceof Error ? error.message : 'Unable to submit your application.',
      );
    } finally {
      setIsSubmittingApplication(false);
    }
  }

  async function handleEeo(values: MhdEeoSelfIdFormValues) {
    if (!token) return;
    setEeoError(null);
    setIsSubmittingEeo(true);
    try {
      await mhdRecruitingService.submitEeo({
        inviteToken: token,
        raceEthnicity: values.raceEthnicity || null,
        gender: values.gender || null,
        veteranStatus: values.veteranStatus || null,
        disabilityStatus: values.disabilityStatus || null,
        declined: values.declined,
      });
      setEeoDone(true);
    } catch (error) {
      setEeoError(
        error instanceof Error ? error.message : 'Unable to submit your self-identification.',
      );
    } finally {
      setIsSubmittingEeo(false);
    }
  }

  if (!token) {
    return (
      <main className="min-h-screen bg-muted px-6 py-10">
        <div className="mx-auto max-w-2xl rounded-3xl border border-rose-200 bg-card p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-700">
            Apply Link Unavailable
          </p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">This apply link cannot be used</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            No application token was provided. Please use the link from your invitation email.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted px-6 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">
            My HR Depot Application
          </p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Complete your application</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Tell us a little about what you're looking for. All fields are optional.
          </p>

          {submitted ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-800">Application submitted</p>
              <p className="mt-1 text-sm text-emerald-700">
                Thank you — your application {referenceId ? `(${referenceId})` : ''} has been
                received. You may optionally complete the voluntary self-identification below.
              </p>
            </div>
          ) : (
            <form
              onSubmit={applyForm.handleSubmit(handleApply)}
              className="mt-6 space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="desiredPayRate"
                    className="block text-sm font-medium text-foreground"
                  >
                    Desired pay rate
                  </label>
                  <input
                    id="desiredPayRate"
                    type="number"
                    min={0}
                    step="0.01"
                    {...applyForm.register('desiredPayRate')}
                    className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                  />
                  {applyForm.formState.errors.desiredPayRate ? (
                    <p className="mt-1 text-xs text-rose-600">
                      {applyForm.formState.errors.desiredPayRate.message}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label
                    htmlFor="availabilityDate"
                    className="block text-sm font-medium text-foreground"
                  >
                    Available from
                  </label>
                  <input
                    id="availabilityDate"
                    type="date"
                    {...applyForm.register('availabilityDate')}
                    className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="employmentTypeDesired"
                  className="block text-sm font-medium text-foreground"
                >
                  Employment type desired
                </label>
                <input
                  id="employmentTypeDesired"
                  type="text"
                  placeholder="e.g. Full-time"
                  {...applyForm.register('employmentTypeDesired')}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label htmlFor="coverNote" className="block text-sm font-medium text-foreground">
                  Cover note
                </label>
                <textarea
                  id="coverNote"
                  rows={5}
                  {...applyForm.register('coverNote')}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                />
              </div>

              {submitError ? (
                <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {submitError}
                </div>
              ) : null}

              <Button type="submit" disabled={isSubmittingApplication}>
                {isSubmittingApplication ? 'Submitting…' : 'Submit application'}
              </Button>
            </form>
          )}
        </section>

        {/* Voluntary EEO self-identification. Separate submission; writes ONLY to
            the restricted partition. Available before or after the application
            (the token is not burned by submit). */}
        <section className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Voluntary Self-Identification
          </p>
          <h2 className="mt-2 text-2xl font-bold text-foreground">
            Equal employment opportunity (optional)
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Providing this information is entirely voluntary. It is kept confidential, is used only
            for aggregate reporting, and is <strong>not</strong> shared with the people reviewing
            your application. Declining will not affect you in any way.
          </p>

          {eeoDone ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              Thank you. Your voluntary self-identification has been recorded.
            </div>
          ) : (
            <form onSubmit={eeoForm.handleSubmit(handleEeo)} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="raceEthnicity"
                    className="block text-sm font-medium text-foreground"
                  >
                    Race / ethnicity
                  </label>
                  <select
                    id="raceEthnicity"
                    {...eeoForm.register('raceEthnicity')}
                    className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <option value="">Prefer not to answer</option>
                    {MHD_RECRUITING_EEO_RACE_ETHNICITIES.map((option) => (
                      <option key={option} value={option}>
                        {mhdFormatEeoRaceEthnicity(option)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-foreground">
                    Gender
                  </label>
                  <select
                    id="gender"
                    {...eeoForm.register('gender')}
                    className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <option value="">Prefer not to answer</option>
                    {MHD_RECRUITING_EEO_GENDERS.map((option) => (
                      <option key={option} value={option}>
                        {mhdFormatEeoGender(option)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="veteranStatus"
                    className="block text-sm font-medium text-foreground"
                  >
                    Veteran status
                  </label>
                  <select
                    id="veteranStatus"
                    {...eeoForm.register('veteranStatus')}
                    className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <option value="">Prefer not to answer</option>
                    {MHD_RECRUITING_EEO_VETERAN_STATUSES.map((option) => (
                      <option key={option} value={option}>
                        {mhdFormatEeoVeteranStatus(option)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="disabilityStatus"
                    className="block text-sm font-medium text-foreground"
                  >
                    Disability status
                  </label>
                  <select
                    id="disabilityStatus"
                    {...eeoForm.register('disabilityStatus')}
                    className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <option value="">Prefer not to answer</option>
                    {MHD_RECRUITING_EEO_DISABILITY_STATUSES.map((option) => (
                      <option key={option} value={option}>
                        {mhdFormatEeoDisabilityStatus(option)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-border bg-muted p-4 text-sm text-foreground">
                <input type="checkbox" {...eeoForm.register('declined')} className="mt-0.5" />
                <span>I decline to provide this information.</span>
              </label>

              {eeoError ? (
                <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {eeoError}
                </div>
              ) : null}

              <Button variant="secondary" type="submit" disabled={isSubmittingEeo}>
                {isSubmittingEeo ? 'Submitting…' : 'Submit self-identification'}
              </Button>
            </form>
          )}
        </section>

        <p className="text-center text-xs text-muted-foreground">
          Powered by My HR Depot. This is a secure, invitation-only application link.
        </p>
      </div>
    </main>
  );
}
