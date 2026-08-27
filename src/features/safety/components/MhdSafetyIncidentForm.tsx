import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { useMhdCreateSafetyIncident } from '../Hook';
import { mhdSafetyIncidentSchema } from '../Schemas';
import type { MhdSafetyIncidentClassification, MhdSafetyIllnessType } from '../Types';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

const CLASSIFICATIONS: Array<{ value: MhdSafetyIncidentClassification; label: string }> = [
  { value: 'DEATH', label: 'Death' },
  { value: 'DAYS_AWAY_FROM_WORK', label: 'Days Away From Work' },
  { value: 'JOB_TRANSFER_OR_RESTRICTION', label: 'Job Transfer Or Restriction' },
  { value: 'OTHER_RECORDABLE', label: 'Other Recordable Case' },
];

const ILLNESS_TYPES: Array<{ value: MhdSafetyIllnessType; label: string }> = [
  { value: 'INJURY', label: 'Injury' },
  { value: 'SKIN_DISORDER', label: 'Skin Disorder' },
  { value: 'RESPIRATORY_CONDITION', label: 'Respiratory Condition' },
  { value: 'POISONING', label: 'Poisoning' },
  { value: 'HEARING_LOSS', label: 'Hearing Loss' },
  { value: 'ALL_OTHER_ILLNESSES', label: 'All Other Illnesses' },
];

interface MhdSafetyIncidentFormProps {
  companyId: string;
  establishmentId: string;
  peopleOptions: Array<{ id: string; name: string }>;
  onSuccess: () => void;
  onCancel: () => void;
}

/** OSHA Form 300/301 intake — one incident, both the log-line and the incident-report detail. */
export function MhdSafetyIncidentForm({
  companyId,
  establishmentId,
  peopleOptions,
  onSuccess,
  onCancel,
}: MhdSafetyIncidentFormProps) {
  const createIncident = useMhdCreateSafetyIncident();
  const [personId, setPersonId] = useState('');
  const [nonEmployeeName, setNonEmployeeName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [dateOfIncident, setDateOfIncident] = useState('');
  const [locationDescription, setLocationDescription] = useState('');
  const [whatHappened, setWhatHappened] = useState('');
  const [injuryIllnessDescription, setInjuryIllnessDescription] = useState('');
  const [classification, setClassification] = useState<MhdSafetyIncidentClassification>(
    'DAYS_AWAY_FROM_WORK',
  );
  const [illnessType, setIllnessType] = useState<MhdSafetyIllnessType | ''>('');
  const [daysAwayCount, setDaysAwayCount] = useState(0);
  const [daysRestrictedOrTransferredCount, setDaysRestrictedOrTransferredCount] = useState(0);
  const [isPrivacyCase, setIsPrivacyCase] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function submit() {
    const parsed = mhdSafetyIncidentSchema.safeParse({
      establishmentId,
      dateOfIncident,
      whatHappened,
      injuryIllnessDescription,
      classification,
      personId: personId || null,
      nonEmployeeName: nonEmployeeName || null,
      jobTitle,
      locationDescription,
      illnessType: illnessType || null,
      daysAwayCount,
      daysRestrictedOrTransferredCount,
      isPrivacyCase,
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Review the incident details.');
      return;
    }
    setFormError(null);
    await createIncident.mutateAsync({
      companyId,
      establishmentId,
      dateOfIncident: parsed.data.dateOfIncident,
      whatHappened: parsed.data.whatHappened,
      injuryIllnessDescription: parsed.data.injuryIllnessDescription,
      classification: parsed.data.classification,
      personId: parsed.data.personId,
      nonEmployeeName: parsed.data.nonEmployeeName,
      jobTitle: parsed.data.jobTitle,
      locationDescription: parsed.data.locationDescription,
      illnessType: parsed.data.illnessType,
      daysAwayCount: parsed.data.daysAwayCount,
      daysRestrictedOrTransferredCount: parsed.data.daysRestrictedOrTransferredCount,
      isPrivacyCase: parsed.data.isPrivacyCase,
    });
    onSuccess();
  }

  return (
    <MhdCard className="space-y-4">
      <div>
        <h2 className="font-semibold text-foreground">Record a safety incident</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          OSHA Form 300/301 detail. Mark "Privacy case" for injuries/illnesses OSHA treats as
          privacy-concern cases (e.g. intimate-body-part injuries, sexual assault, mental-health
          conditions, HIV, sharps injuries) — the subject's name is then hidden from every viewer
          except Platform Admin/HR Partner.
        </p>
      </div>

      <MhdFormFieldStack>
        <label className="text-sm font-medium">
          Employee
          <select
            className={`mt-1 ${inputClass}`}
            value={personId}
            onChange={(event) => setPersonId(event.target.value)}
          >
            <option value="">Non-employee (enter name)…</option>
            {peopleOptions.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>
        {!personId ? (
          <label className="text-sm font-medium">
            Non-employee name
            <input
              className={`mt-1 ${inputClass}`}
              value={nonEmployeeName}
              onChange={(event) => setNonEmployeeName(event.target.value)}
              placeholder="e.g. contractor, visitor"
            />
          </label>
        ) : (
          <label className="text-sm font-medium">
            Job title
            <input
              className={`mt-1 ${inputClass}`}
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
            />
          </label>
        )}
        <label className="text-sm font-medium">
          Date of incident
          <input
            type="date"
            className={`mt-1 ${inputClass}`}
            value={dateOfIncident}
            onChange={(event) => setDateOfIncident(event.target.value)}
          />
        </label>
        <label className="text-sm font-medium">
          Location
          <input
            className={`mt-1 ${inputClass}`}
            value={locationDescription}
            onChange={(event) => setLocationDescription(event.target.value)}
          />
        </label>
        <label className="text-sm font-medium">
          Classification
          <select
            className={`mt-1 ${inputClass}`}
            value={classification}
            onChange={(event) =>
              setClassification(event.target.value as MhdSafetyIncidentClassification)
            }
          >
            {CLASSIFICATIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Illness type (leave blank for an injury)
          <select
            className={`mt-1 ${inputClass}`}
            value={illnessType}
            onChange={(event) => setIllnessType(event.target.value as MhdSafetyIllnessType | '')}
          >
            <option value="">Not an illness</option>
            {ILLNESS_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Days away from work
          <input
            type="number"
            min={0}
            className={`mt-1 ${inputClass}`}
            value={daysAwayCount}
            onChange={(event) => setDaysAwayCount(Number(event.target.value) || 0)}
          />
        </label>
        <label className="text-sm font-medium">
          Days restricted / transferred
          <input
            type="number"
            min={0}
            className={`mt-1 ${inputClass}`}
            value={daysRestrictedOrTransferredCount}
            onChange={(event) => setDaysRestrictedOrTransferredCount(Number(event.target.value) || 0)}
          />
        </label>
      </MhdFormFieldStack>

      <label className="block text-sm font-medium">
        What happened
        <textarea
          className={`mt-1 min-h-20 ${inputClass}`}
          value={whatHappened}
          onChange={(event) => setWhatHappened(event.target.value)}
        />
      </label>
      <label className="block text-sm font-medium">
        Injury or illness description
        <textarea
          className={`mt-1 min-h-20 ${inputClass}`}
          value={injuryIllnessDescription}
          onChange={(event) => setInjuryIllnessDescription(event.target.value)}
        />
      </label>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={isPrivacyCase}
          onChange={(event) => setIsPrivacyCase(event.target.checked)}
        />
        Privacy case (redact the subject's name from the log for non-PA/HRP viewers)
      </label>

      {formError ? <p className="text-sm text-rose-700">{formError}</p> : null}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button disabled={createIncident.isPending} onClick={() => void submit()}>
          {createIncident.isPending ? 'Recording…' : 'Record incident'}
        </Button>
      </div>
    </MhdCard>
  );
}
