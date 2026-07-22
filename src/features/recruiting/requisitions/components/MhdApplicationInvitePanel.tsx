import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMhdInviteApplication, useMhdRecruitingPeople } from '../Hook';
import { mhdInviteApplicationSchema, type MhdInviteApplicationFormValues } from '../Schemas';
import type { MhdRecruitingInviteResult } from '../Types';

interface Props {
  companyId: string;
  requisitionId: string;
  /**
   * Builds the applicant-facing apply URL from the invite token. Injected by the
   * host route because the app owns its routing / public origin — the panel does
   * not hard-code the deploy URL. Defaults to `${origin}/apply?token=…`, matching
   * the public apply page's `/apply?token=` contract and the e-sign `/sign` model.
   * The app layer is what actually EMAILS the link; this panel only shows/copies
   * it so the recruiter can hand it off.
   */
  buildApplyUrl?: (inviteToken: string) => string;
}

function defaultBuildApplyUrl(inviteToken: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/apply?token=${encodeURIComponent(inviteToken)}`;
}

/**
 * Invite a person to apply, then surface the resulting apply link.
 *
 * The invite RPC returns the token ONCE (`application_invite`). We turn it into a
 * copyable link and hold it in local state for this session only — the token is
 * NEVER re-listed by any read RPC, so once the panel unmounts the recruiter must
 * re-invite (a duplicate raises the one-per-person-per-req guard) or rely on the
 * emailed copy. An applicant is a PERSON: the picker is the company's people.
 */
export function MhdApplicationInvitePanel({
  companyId,
  requisitionId,
  buildApplyUrl = defaultBuildApplyUrl,
}: Props) {
  const [issued, setIssued] = useState<MhdRecruitingInviteResult | null>(null);
  const [copied, setCopied] = useState(false);

  const people = useMhdRecruitingPeople(companyId);
  const invite = useMhdInviteApplication();

  const peopleOptions = useMemo(
    () =>
      (people.data ?? []).map(
        (person: { id: string; firstName?: string | null; lastName?: string | null; preferredName?: string | null }) => ({
          id: person.id,
          displayName:
            person.preferredName ||
            [person.firstName, person.lastName].filter(Boolean).join(' '),
        }),
      ),
    [people.data],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MhdInviteApplicationFormValues>({
    resolver: zodResolver(mhdInviteApplicationSchema),
    defaultValues: { requisitionId, personId: '', source: '' },
  });

  const applyUrl = issued ? buildApplyUrl(issued.inviteToken) : '';

  async function handleInvite(values: MhdInviteApplicationFormValues) {
    const result = await invite.mutateAsync({
      requisitionId: values.requisitionId,
      personId: values.personId,
      source: values.source || null,
    });
    setIssued(result);
    setCopied(false);
    reset({ requisitionId, personId: '', source: '' });
  }

  async function handleCopy() {
    if (!applyUrl) return;
    try {
      await navigator.clipboard.writeText(applyUrl);
      setCopied(true);
    } catch {
      // Clipboard may be unavailable (permissions / insecure context); the link
      // text remains selectable in the field below, so no hard failure here.
      setCopied(false);
    }
  }

  return (
    <section className="space-y-4 rounded-lg border border-neutral-200 p-4">
      <div>
        <h2 className="text-base font-semibold text-neutral-900">Invite an applicant</h2>
        <p className="mt-0.5 text-xs text-neutral-500">
          Creates a tokenized apply link for a person. The applicant completes it unauthenticated —
          the link is the only credential.
        </p>
      </div>

      <form onSubmit={handleSubmit(handleInvite)} className="space-y-4">
        <input type="hidden" {...register('requisitionId')} readOnly />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="invitePerson" className="block text-sm font-medium text-neutral-700">
              Person
            </label>
            <select
              id="invitePerson"
              {...register('personId')}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="">Choose a person…</option>
              {peopleOptions.map((person) => (
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
            <label htmlFor="inviteSource" className="block text-sm font-medium text-neutral-700">
              Source <span className="font-normal text-neutral-500">(optional)</span>
            </label>
            <input
              id="inviteSource"
              type="text"
              {...register('source')}
              placeholder="e.g. Referral, LinkedIn"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={invite.isPending}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {invite.isPending ? 'Creating link…' : 'Create apply link'}
          </button>
        </div>
      </form>

      {issued ? (
        <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-sm font-medium text-emerald-800">
            Apply link created ({issued.referenceId})
          </p>
          <p className="text-xs text-emerald-700">
            Copy this link now — it is shown once and cannot be listed again. The app emails it to
            the applicant.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={applyUrl}
              readOnly
              onFocus={(event) => event.target.select()}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="whitespace-nowrap rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
