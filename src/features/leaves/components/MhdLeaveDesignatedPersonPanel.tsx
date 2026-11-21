import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdDetailField } from '@/components/ui/MhdDetailField';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { mhdFormatDate } from '@/utils/mhdDateFormat';
import type {
  MhdLeaveDesignatedPerson,
  MhdLeaveDesignatedPersonInput,
  MhdLeaveDesignatedPersonVoidInput,
} from '../WorkflowTypes';
import { mhdLeaveEnumLabel } from './mhdLeaveLabels';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

export interface MhdLeaveDesignatedPersonPanelProps {
  caseId: string;
  persons: MhdLeaveDesignatedPerson[];
  /** The relationship the leave is being evaluated under (normally DESIGNATED_PERSON). */
  familyRelationship: string;
  limitDesignatedPerson: boolean;
  privileged: boolean;
  /** Resolve true once saved; false when the caller showed a refusal. */
  onRecord: (input: MhdLeaveDesignatedPersonInput) => Promise<boolean>;
  onVoid: (input: MhdLeaveDesignatedPersonVoidInput) => Promise<boolean>;
  isPending: boolean;
}

/**
 * A designated person is a recorded fact (who, when, attested when), replacing the old
 * "designated person selected" checkbox. The company's one-per-12-months limit, when elected,
 * is enforced by the database; its refusal is shown by the caller.
 */
export function MhdLeaveDesignatedPersonPanel({
  caseId,
  persons,
  familyRelationship,
  limitDesignatedPerson,
  privileged,
  onRecord,
  onVoid,
  isPending,
}: MhdLeaveDesignatedPersonPanelProps) {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [attestedOn, setAttestedOn] = useState('');
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');

  async function record() {
    const saved = await onRecord({
      caseId,
      designatedName: name,
      relationshipNote: note || null,
      pflAttestedOn: attestedOn || null,
    });
    if (!saved) return;
    setName('');
    setNote('');
    setAttestedOn('');
  }

  async function voidDesignation(designatedPersonId: string) {
    const saved = await onVoid({ designatedPersonId, reason: voidReason });
    if (!saved) return;
    setVoidingId(null);
    setVoidReason('');
  }

  return (
    <MhdCard className="space-y-3">
      <MhdCardHeader title="Designated Person" />
      <dl>
        <MhdDetailField
          label="Leave relationship"
          value={familyRelationship ? mhdLeaveEnumLabel(familyRelationship) : null}
        />
      </dl>
      <p className="text-xs text-muted-foreground">
        {limitDesignatedPerson
          ? 'This company limits each employee to one designated person in a 12-month period. A second designation in that period will be refused.'
          : 'This company has not elected a limit on designated persons.'}
      </p>

      {persons.length ? (
        <ul className="space-y-2" aria-label="Designated Persons">
          {persons.map((person) => (
            <li key={person.id} className="space-y-2 rounded-md border border-border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-foreground">{person.designated_name}</span>
                <MhdBadge variant={person.voided_at ? 'neutral' : 'success'}>
                  {person.voided_at ? 'Voided' : 'Active'}
                </MhdBadge>
              </div>
              <dl className="grid gap-2 sm:grid-cols-2">
                <MhdDetailField label="Relationship note" value={person.relationship_note} />
                <MhdDetailField label="Designated on" value={mhdFormatDate(person.designated_at)} />
                <MhdDetailField label="PFL attested on" value={person.pfl_attested_on} />
                <MhdDetailField
                  label="Voided"
                  value={
                    person.voided_at
                      ? `${mhdFormatDate(person.voided_at)}: ${person.void_reason ?? 'No reason recorded'}`
                      : 'Not voided'
                  }
                />
              </dl>
              {privileged && !person.voided_at ? (
                voidingId === person.id ? (
                  <div className="space-y-2 border-t border-border pt-2">
                    <label className="block text-xs">
                      Void reason
                      <input
                        className={`mt-1 ${inputClass}`}
                        value={voidReason}
                        onChange={(event) => setVoidReason(event.target.value)}
                      />
                    </label>
                    <div className="flex gap-2">
                      <Button
                        disabled={isPending || !voidReason.trim()}
                        onClick={() => void voidDesignation(person.id)}
                      >
                        Confirm Void
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setVoidingId(null);
                          setVoidReason('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setVoidingId(person.id);
                      setVoidReason('');
                    }}
                  >
                    Void Designation
                  </Button>
                )
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No designated person recorded.</p>
      )}

      {privileged ? (
        <div className="space-y-3 border-t border-border pt-3">
          <MhdFormFieldStack>
            <label className="block text-xs">
              Designated person name
              <input
                className={`mt-1 ${inputClass}`}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label className="block text-xs">
              Relationship note
              <input
                className={`mt-1 ${inputClass}`}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </label>
            <div>
              <label className="block text-xs">
                PFL Attestation Date
                <MhdDateField
                  className={`mt-1 ${inputClass}`}
                  value={attestedOn}
                  onChange={setAttestedOn}
                />
              </label>
              <p className="mt-1 text-xs text-muted-foreground">
                Required for Paid Family Leave claims filed on or after July 1, 2028.
              </p>
            </div>
          </MhdFormFieldStack>
          <Button disabled={isPending || !name.trim()} onClick={() => void record()}>
            {isPending ? 'Recording…' : 'Record Designated Person'}
          </Button>
        </div>
      ) : null}
    </MhdCard>
  );
}
