import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdWizardOutputStep } from '@/components/ui/MhdWizardOutputStep';
import { MhdWizardShell } from '@/components/ui/MhdWizardShell';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdGrievancesService } from '../Service';
import {
  MHD_GRIEVANCE_CATEGORIES,
  MHD_GRIEVANCE_CATEGORY_LABELS,
  type MhdGrievanceCategory,
  type MhdGrievanceIntakeInput,
} from '../Types';
import { useMhdGrievancePeople, useMhdOpenGrievanceFromIntake } from '../Hook';
import { useMhdWizardFlow, type MhdWizardStepDefinition } from '@/utils/useMhdWizardFlow';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

interface WitnessDraft {
  id: number;
  name: string;
  personId: string;
  whatTheyKnow: string;
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function todayIso(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function localMiddayIso(value: string): string | null {
  return value ? new Date(`${value}T12:00:00`).toISOString() : null;
}

function personName(person: { displayName: string; firstName: string; lastName: string }): string {
  return person.displayName || [person.firstName, person.lastName].filter(Boolean).join(' ');
}

export function MhdGrievanceIntakeWizard() {
  const navigate = useNavigate();
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const personId = profile?.personId ?? null;
  const userId = profile?.userId ?? '';
  const peopleQuery = useMhdGrievancePeople(companyId || null);
  const file = useMhdOpenGrievanceFromIntake();

  const [category, setCategory] = useState<MhdGrievanceCategory | ''>('');
  const [whatHappened, setWhatHappened] = useState('');
  const [grievanceWhen, setGrievanceWhen] = useState('');
  const [where, setWhere] = useState('');
  const [personGrievedAgainstId, setPersonGrievedAgainstId] = useState('');
  const [grievanceWho, setGrievanceWho] = useState('');
  const [disagreement, setDisagreement] = useState('');
  const [why, setWhy] = useState('');
  const [stepsAlreadyTaken, setStepsAlreadyTaken] = useState('');
  const [concernsUnrecordedOralReprimand, setConcernsUnrecordedOralReprimand] = useState(false);
  const [remedy, setRemedy] = useState('');
  const [isHarassmentRelated, setIsHarassmentRelated] = useState(false);
  const [retaliationConcern, setRetaliationConcern] = useState(false);
  const [witnesses, setWitnesses] = useState<WitnessDraft[]>([]);
  const [signatureName, setSignatureName] = useState('');
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof file.mutateAsync>> | null>(null);

  const people = useMemo(
    () => (peopleQuery.data ?? []).filter((person) => person.id !== personId),
    [peopleQuery.data, personId],
  );
  const witnessRows = useMemo(
    () => witnesses.filter((witness) => witness.name || witness.whatTheyKnow),
    [witnesses],
  );
  const input = useMemo<MhdGrievanceIntakeInput>(
    () => ({
      companyId,
      personId: personId ?? '',
      grievanceWhat: whatHappened.trim(),
      disagreementExplanation: disagreement.trim(),
      remedyRequested: remedy.trim(),
      employeeSignatureName: signatureName.trim(),
      grievanceCategory: category || null,
      personGrievedAgainstId: personGrievedAgainstId || null,
      grievanceWho: blankToNull(grievanceWho),
      grievanceWhere: blankToNull(where),
      grievanceWhen: localMiddayIso(grievanceWhen),
      grievanceWhy: blankToNull(why),
      stepsAlreadyTaken: blankToNull(stepsAlreadyTaken),
      isHarassmentRelated,
      retaliationConcern,
      concernsUnrecordedOralReprimand,
      witnesses: witnessRows.map((witness) => ({
        witnessName: witness.name.trim(),
        witnessPersonId: witness.personId || null,
        whatTheyKnow: blankToNull(witness.whatTheyKnow),
      })),
    }),
    [
      category,
      companyId,
      concernsUnrecordedOralReprimand,
      disagreement,
      grievanceWho,
      grievanceWhen,
      isHarassmentRelated,
      personGrievedAgainstId,
      personId,
      remedy,
      retaliationConcern,
      signatureName,
      stepsAlreadyTaken,
      where,
      why,
      whatHappened,
      witnessRows,
    ],
  );

  function validateWhat(): string | null {
    if (!whatHappened.trim()) return 'Describe what happened.';
    if (grievanceWhen && grievanceWhen > todayIso()) return 'The date cannot be in the future.';
    return null;
  }

  function validateWhy(): string | null {
    return disagreement.trim() ? null : 'Explain why you disagree or object.';
  }

  function validateOutcome(): string | null {
    if (!remedy.trim()) return 'Say what outcome you are asking for.';
    if (witnesses.length > 10) return 'List at most 10 witnesses.';
    if (witnessRows.some((witness) => !witness.name.trim())) return 'Every witness needs a name.';
    return null;
  }

  function validateSign(): string | null {
    if (!signatureName.trim()) return 'Type your full name to sign.';
    if (!signatureConfirmed) return 'Confirm that this is accurate before you submit.';
    return null;
  }

  const steps: MhdWizardStepDefinition[] = [
    {
      id: 'what',
      title: 'What Happened',
      description: 'Describe the concern.',
      validate: validateWhat,
    },
    {
      id: 'why',
      title: 'Why You Disagree',
      description: 'Explain your concern.',
      validate: validateWhy,
    },
    {
      id: 'outcome',
      title: 'Outcome & Concerns',
      description: 'Tell us what you would like to happen.',
      validate: validateOutcome,
    },
    {
      id: 'sign',
      title: 'Review & Sign',
      description: 'Review and confirm your grievance.',
      validate: validateSign,
    },
  ];

  const isDirty = Boolean(
    category ||
    whatHappened ||
    grievanceWhen ||
    where ||
    personGrievedAgainstId ||
    grievanceWho ||
    disagreement ||
    why ||
    stepsAlreadyTaken ||
    concernsUnrecordedOralReprimand ||
    remedy ||
    isHarassmentRelated ||
    retaliationConcern ||
    witnesses.length ||
    signatureName ||
    signatureConfirmed,
  );
  const flow = useMhdWizardFlow({
    steps,
    isDirty,
    onSubmit: async () => {
      if (!personId) return;
      const saved = await file.mutateAsync(input);
      setResult(saved);
    },
  });

  function setWitness(id: number, patch: Partial<WitnessDraft>) {
    setWitnesses((current) =>
      current.map((witness) => (witness.id === id ? { ...witness, ...patch } : witness)),
    );
  }

  function renderWhat() {
    return (
      <MhdFormFieldStack>
        <div>
          <label htmlFor="grievance-category" className="text-sm font-medium">
            Type of concern
          </label>
          <select
            id="grievance-category"
            className={inputClass}
            value={category}
            onChange={(event) => setCategory(event.target.value as MhdGrievanceCategory | '')}
          >
            <option value="">Choose a type</option>
            {MHD_GRIEVANCE_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {MHD_GRIEVANCE_CATEGORY_LABELS[item]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="grievance-what" className="text-sm font-medium">
            What happened
          </label>
          <textarea
            id="grievance-what"
            className={`${inputClass} min-h-24`}
            value={whatHappened}
            onChange={(event) => setWhatHappened(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="grievance-when" className="text-sm font-medium">
            When it happened
          </label>
          <MhdDateField id="grievance-when" value={grievanceWhen} onChange={setGrievanceWhen} />
        </div>
        <div>
          <label htmlFor="grievance-where" className="text-sm font-medium">
            Where it happened
          </label>
          <input
            id="grievance-where"
            className={inputClass}
            value={where}
            onChange={(event) => setWhere(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="grievance-person" className="text-sm font-medium">
            Who this is about
          </label>
          <select
            id="grievance-person"
            className={inputClass}
            value={personGrievedAgainstId}
            onChange={(event) => setPersonGrievedAgainstId(event.target.value)}
          >
            <option value="">Not listed or not a person</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {personName(person)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="grievance-others" className="text-sm font-medium">
            Others involved
          </label>
          <input
            id="grievance-others"
            className={inputClass}
            value={grievanceWho}
            onChange={(event) => setGrievanceWho(event.target.value)}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Write what you saw and experienced. You can add detail later by telling Human Resources.
        </p>
      </MhdFormFieldStack>
    );
  }

  function renderWhy() {
    return (
      <MhdFormFieldStack>
        <div>
          <label htmlFor="grievance-disagreement" className="text-sm font-medium">
            Why do you disagree or object
          </label>
          <textarea
            id="grievance-disagreement"
            className={`${inputClass} min-h-24`}
            value={disagreement}
            onChange={(event) => setDisagreement(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="grievance-why" className="text-sm font-medium">
            Why do you think it happened
          </label>
          <textarea
            id="grievance-why"
            className={`${inputClass} min-h-24`}
            value={why}
            onChange={(event) => setWhy(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="grievance-tried" className="text-sm font-medium">
            What have you already tried
          </label>
          <textarea
            id="grievance-tried"
            className={`${inputClass} min-h-24`}
            value={stepsAlreadyTaken}
            onChange={(event) => setStepsAlreadyTaken(event.target.value)}
          />
          <p className="mt-1 text-sm text-muted-foreground">
            For example speaking to your supervisor or to Human Resources.
          </p>
        </div>
        <label htmlFor="grievance-reprimand" className="flex items-center gap-2 text-sm">
          <input
            id="grievance-reprimand"
            type="checkbox"
            checked={concernsUnrecordedOralReprimand}
            onChange={(event) => setConcernsUnrecordedOralReprimand(event.target.checked)}
          />
          This concerns an oral reprimand that was never put in writing
        </label>
      </MhdFormFieldStack>
    );
  }

  function renderOutcome() {
    return (
      <MhdFormFieldStack>
        <div>
          <label htmlFor="grievance-outcome" className="text-sm font-medium">
            What outcome are you asking for
          </label>
          <textarea
            id="grievance-outcome"
            className={`${inputClass} min-h-24`}
            value={remedy}
            onChange={(event) => setRemedy(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="grievance-harassment" className="flex items-center gap-2 text-sm">
            <input
              id="grievance-harassment"
              type="checkbox"
              checked={isHarassmentRelated}
              onChange={(event) => setIsHarassmentRelated(event.target.checked)}
            />
            This concerns harassment or discrimination
          </label>
          <p className="mt-1 text-sm text-muted-foreground">
            It will be sent to Human Resources right away to be reviewed under the harassment
            policy.
          </p>
        </div>
        <div>
          <label htmlFor="grievance-retaliation" className="flex items-center gap-2 text-sm">
            <input
              id="grievance-retaliation"
              type="checkbox"
              checked={retaliationConcern}
              onChange={(event) => setRetaliationConcern(event.target.checked)}
            />
            I am worried about retaliation for filing this
          </label>
          <p className="mt-1 text-sm text-muted-foreground">
            Tell us if anyone has threatened you or treated you differently because you spoke up.
          </p>
        </div>
        <fieldset>
          <legend className="text-sm font-medium">Witnesses</legend>
          <div className="mt-2 space-y-3">
            {witnesses.map((witness) => (
              <div key={witness.id} className="space-y-2 rounded-md border border-border p-3">
                <div>
                  <label htmlFor={`witness-name-${witness.id}`} className="text-sm font-medium">
                    Name
                  </label>
                  <input
                    id={`witness-name-${witness.id}`}
                    className={inputClass}
                    value={witness.name}
                    onChange={(event) => setWitness(witness.id, { name: event.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor={`witness-person-${witness.id}`} className="text-sm font-medium">
                    Choose a colleague
                  </label>
                  <select
                    id={`witness-person-${witness.id}`}
                    className={inputClass}
                    value={witness.personId}
                    onChange={(event) => {
                      const selected = people.find((person) => person.id === event.target.value);
                      setWitness(witness.id, {
                        personId: event.target.value,
                        name: selected ? personName(selected) : witness.name,
                      });
                    }}
                  >
                    <option value="">Choose a colleague</option>
                    {people.map((person) => (
                      <option key={person.id} value={person.id}>
                        {personName(person)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor={`witness-knowledge-${witness.id}`}
                    className="text-sm font-medium"
                  >
                    What they know
                  </label>
                  <input
                    id={`witness-knowledge-${witness.id}`}
                    className={inputClass}
                    value={witness.whatTheyKnow}
                    onChange={(event) =>
                      setWitness(witness.id, { whatTheyKnow: event.target.value })
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setWitnesses((current) => current.filter((item) => item.id !== witness.id))
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </fieldset>
        <Button
          type="button"
          variant="secondary"
          disabled={witnesses.length >= 10}
          onClick={() =>
            setWitnesses((current) => [
              ...current,
              { id: Date.now(), name: '', personId: '', whatTheyKnow: '' },
            ])
          }
        >
          Add A Witness
        </Button>
      </MhdFormFieldStack>
    );
  }

  function renderSign() {
    return (
      <MhdFormFieldStack>
        <div className="space-y-1 text-sm">
          <p>
            <strong>Type of concern:</strong>{' '}
            {category ? MHD_GRIEVANCE_CATEGORY_LABELS[category] : 'Not selected'}
          </p>
          <p>
            <strong>What happened:</strong> {whatHappened}
          </p>
          <p>
            <strong>When:</strong> {grievanceWhen || 'Not provided'}
          </p>
          <p>
            <strong>Where:</strong> {where || 'Not provided'}
          </p>
          <p>
            <strong>Who this is about:</strong>{' '}
            {(people.find((person) => person.id === personGrievedAgainstId)?.displayName ??
              grievanceWho) ||
              'Not provided'}
          </p>
          <p>
            <strong>Why you disagree:</strong> {disagreement}
          </p>
          <p>
            <strong>Why you think it happened:</strong> {why || 'Not provided'}
          </p>
          <p>
            <strong>What you tried:</strong> {stepsAlreadyTaken || 'Not provided'}
          </p>
          <p>
            <strong>Outcome:</strong> {remedy}
          </p>
          <p>
            <strong>Witnesses:</strong> {witnessRows.length || 'None'}
          </p>
        </div>
        <p className="text-sm">Only you and Human Resources can see this grievance.</p>
        <div>
          <label htmlFor="grievance-signature" className="text-sm font-medium">
            Your full name
          </label>
          <input
            id="grievance-signature"
            className={inputClass}
            value={signatureName}
            onChange={(event) => setSignatureName(event.target.value)}
          />
        </div>
        <label htmlFor="grievance-confirm" className="flex items-center gap-2 text-sm">
          <input
            id="grievance-confirm"
            type="checkbox"
            checked={signatureConfirmed}
            onChange={(event) => setSignatureConfirmed(event.target.checked)}
          />
          By typing my name I confirm this is an accurate record of my grievance.
        </label>
      </MhdFormFieldStack>
    );
  }

  if (!personId) {
    return (
      <p>
        Your account is not linked to an employee record, so a grievance cannot be filed. Contact
        Human Resources.
      </p>
    );
  }

  const completion = result ? (
    <div className="space-y-4">
      <MhdCard>
        <h2 className="text-xl font-semibold text-foreground">Grievance Filed</h2>
        <p className="mt-2 text-sm">Reference ID: {result.referenceId}</p>
        <p className="text-sm">
          Human Resources has been told. They will acknowledge your grievance and contact you about
          what happens next.
        </p>
        {result.referred ? (
          <p className="text-sm">
            Because you said this concerns harassment, it was sent for review right away.
          </p>
        ) : null}
        <Button onClick={() => navigate('/my-grievances')}>Back To My Grievances</Button>
      </MhdCard>
      <MhdCard>
        <h2 className="text-lg font-semibold text-foreground">Your Receipt</h2>
        <p className="mt-2 text-sm">
          You can generate a receipt for your records and sign it to confirm this is accurate.
        </p>
        <MhdWizardOutputStep
          companyId={companyId}
          sourceWizard="GRIEVANCE"
          templateKey="GRIEVANCE_ACKNOWLEDGMENT"
          entityType="GRIEVANCE"
          entityId={result.id}
          recordLabel="grievance receipt"
          signing={{
            createRequest: (generated) =>
              mhdGrievancesService.requestFilerSignature({
                companyId,
                generationId: generated.generationId,
                documentHash: generated.documentHash,
                userId,
              }),
          }}
        />
      </MhdCard>
    </div>
  ) : undefined;
  const body =
    flow.currentStep?.id === 'what'
      ? renderWhat()
      : flow.currentStep?.id === 'why'
        ? renderWhy()
        : flow.currentStep?.id === 'outcome'
          ? renderOutcome()
          : renderSign();
  return (
    <MhdWizardShell
      title="File a grievance"
      description="Tell us what happened and what you would like to see happen. Only you and Human Resources can see your grievance. Your manager is not told about it through this system, and retaliation for filing in good faith is not allowed."
      backTo="/my-grievances"
      backLabel="My Grievances"
      cancelTo="/my-grievances"
      flow={flow}
      completion={completion}
    >
      {body}
    </MhdWizardShell>
  );
}

export default MhdGrievanceIntakeWizard;
