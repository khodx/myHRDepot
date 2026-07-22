import { useState } from 'react';
import {
  MHD_INVESTIGATION_PARTY_ROLES,
  mhdFormatInvestigationPartyRole,
  type MhdAddPartyInput,
  type MhdInvestigationParty,
  type MhdInvestigationPartyRole,
} from '../Types';

interface PersonOption {
  id: string;
  displayName: string;
}

interface Props {
  caseId: string;
  parties: MhdInvestigationParty[];
  people: PersonOption[];
  isLoading?: boolean;
  isSubmitting?: boolean;
  onAddParty: (input: MhdAddPartyInput) => Promise<void>;
  /** Reveal one party's statement. Returns the plaintext (or null if none). */
  onRevealStatement: (partyId: string) => Promise<string | null>;
  isRevealing?: boolean;
}

/**
 * The parties on a case — complainants, respondents, witnesses — plus the
 * add-party form and a per-party statement reveal.
 *
 * Confidential identities arrive PRE-MASKED from the server: a confidential
 * party's `personId` is already `null` and its `displayName` is already
 * `(confidential)`. This component renders `displayName` verbatim and never
 * re-derives or infers identity from any other field — the mask is a hard
 * server-side check (it holds even against a grant-holder who is the respondent),
 * and second-guessing it client-side would be the exact leak the module prevents.
 *
 * Statements are ciphertext at rest. `hasStatement` only says one exists; the
 * text is fetched solely through the audited reveal, on an explicit click, never
 * on mount.
 */
export function MhdPartyPanel({
  caseId,
  parties,
  people,
  isLoading = false,
  isSubmitting = false,
  onAddParty,
  onRevealStatement,
  isRevealing = false,
}: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [partyRole, setPartyRole] = useState<MhdInvestigationPartyRole>('WITNESS');
  const [personId, setPersonId] = useState('');
  const [externalName, setExternalName] = useState('');
  const [isConfidential, setIsConfidential] = useState(false);
  const [statement, setStatement] = useState('');

  // Reveal state is per-party and lives only in memory — the plaintext is never
  // cached in the query layer, so leaving the panel drops it and the next look
  // is a fresh audited reveal.
  const [revealedStatements, setRevealedStatements] = useState<Record<string, string>>({});
  const [revealingId, setRevealingId] = useState<string | null>(null);

  async function submitAdd() {
    await onAddParty({
      caseId,
      partyRole,
      personId: personId || null,
      externalName: externalName.trim() || null,
      isConfidential,
      statement: statement.trim() || null,
    });
    setIsAdding(false);
    setPartyRole('WITNESS');
    setPersonId('');
    setExternalName('');
    setIsConfidential(false);
    setStatement('');
  }

  async function revealStatement(partyId: string) {
    setRevealingId(partyId);
    try {
      const plain = await onRevealStatement(partyId);
      setRevealedStatements((previous) => ({
        ...previous,
        [partyId]: plain ?? '(no statement recorded)',
      }));
    } finally {
      setRevealingId(null);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">Parties</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Complainants, respondents and witnesses. Confidential identities are masked for everyone.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAdding((value) => !value)}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700"
        >
          {isAdding ? 'Cancel' : 'Add party'}
        </button>
      </div>

      {isAdding ? (
        <div className="space-y-3 rounded-md border border-neutral-200 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="partyRole" className="block text-sm font-medium text-neutral-700">
                Role
              </label>
              <select
                id="partyRole"
                value={partyRole}
                onChange={(event) =>
                  setPartyRole(event.target.value as MhdInvestigationPartyRole)
                }
                className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
              >
                {MHD_INVESTIGATION_PARTY_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {mhdFormatInvestigationPartyRole(role)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="partyPerson" className="block text-sm font-medium text-neutral-700">
                Employee <span className="font-normal text-neutral-500">(optional)</span>
              </label>
              <select
                id="partyPerson"
                value={personId}
                onChange={(event) => setPersonId(event.target.value)}
                className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="">Not on roster</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="externalName" className="block text-sm font-medium text-neutral-700">
              External name <span className="font-normal text-neutral-500">(optional)</span>
            </label>
            <input
              id="externalName"
              type="text"
              value={externalName}
              onChange={(event) => setExternalName(event.target.value)}
              placeholder="A party outside the roster. Leave blank for anonymous intake."
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
            {/* Both person and external name may be blank — anonymous intake (a
                hotline complaint with no named source) is a valid party. */}
            <p className="mt-1 text-xs text-neutral-500">
              Leave both employee and name blank for an anonymous party.
            </p>
          </div>

          <div>
            <label htmlFor="statement" className="block text-sm font-medium text-neutral-700">
              Statement <span className="font-normal text-neutral-500">(optional)</span>
            </label>
            <textarea
              id="statement"
              rows={3}
              value={statement}
              onChange={(event) => setStatement(event.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-neutral-500">
              Encrypted at rest; read back only through the audited reveal.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={isConfidential}
              onChange={(event) => setIsConfidential(event.target.checked)}
              className="rounded border-neutral-300"
            />
            Confidential — mask this party&rsquo;s identity from everyone, including the respondent
          </label>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void submitAdd()}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-neutral-50 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving…' : 'Add party'}
            </button>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-neutral-500">Loading parties…</p>
      ) : parties.length === 0 ? (
        <p className="text-sm text-neutral-500">No parties recorded on this case yet.</p>
      ) : (
        <ul className="space-y-2">
          {parties.map((party) => (
            <li key={party.id} className="rounded-md border border-neutral-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  {/* displayName is rendered verbatim — it is already '(confidential)'
                      for a masked party. We never look at personId to second-guess it. */}
                  <p className="text-sm font-medium text-neutral-900">
                    {party.displayName}
                    {party.isConfidential ? (
                      <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-normal text-neutral-500">
                        confidential
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {mhdFormatInvestigationPartyRole(party.partyRole)}
                  </p>
                </div>
                {party.hasStatement ? (
                  <button
                    type="button"
                    disabled={isRevealing && revealingId === party.id}
                    onClick={() => void revealStatement(party.id)}
                    className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 disabled:opacity-50"
                  >
                    {revealingId === party.id ? 'Revealing…' : 'Reveal statement'}
                  </button>
                ) : (
                  <span className="text-xs text-neutral-400">No statement</span>
                )}
              </div>

              {revealedStatements[party.id] !== undefined ? (
                <div className="mt-3 border-t border-neutral-200 pt-3">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Statement</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-800">
                    {revealedStatements[party.id]}
                  </p>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
