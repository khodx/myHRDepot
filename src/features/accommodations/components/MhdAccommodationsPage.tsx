import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Accessibility } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdFilterBar, MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTableActions, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdAccommodationsIsPrivileged } from '@/appshell/mhdRouteAccess';
import {
  useMhdAccommodationCases,
  useMhdAccommodationPeople,
  useMhdAccommodationReadiness,
  useMhdCreateAccommodation,
} from '../Hook';
import { mhdAccommodationRequestSchema } from '../Schemas';
import {
  MHD_ACCOMMODATION_REQUEST_CHANNELS,
  MHD_ACCOMMODATION_REQUEST_SOURCES,
  MHD_ACCOMMODATION_STATUSES,
  mhdFormatAccommodationValue,
  type MhdAccommodationRequestChannel,
  type MhdAccommodationRequestSource,
  type MhdAccommodationStatus,
} from '../Types';
import { MhdComplianceGateBanner } from '@/components/ui/MhdComplianceGateBanner';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

export function MhdAccommodationsPage() {
  const navigate = useNavigate();
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const selfPersonId = profile?.personId ?? null;
  const isPrivileged = mhdAccommodationsIsPrivileged(roles);
  const [status, setStatus] = useState<MhdAccommodationStatus | 'ALL'>('ALL');
  const [personId, setPersonId] = useState(isPrivileged ? '' : (selfPersonId ?? ''));
  const [creating, setCreating] = useState(false);
  const [requestSource, setRequestSource] = useState<MhdAccommodationRequestSource>('SELF');
  const [requestChannel, setRequestChannel] = useState<MhdAccommodationRequestChannel>('VERBAL');
  const [requestSummary, setRequestSummary] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const cases = useMhdAccommodationCases(companyId || null, status, personId || null);
  const people = useMhdAccommodationPeople(isPrivileged ? companyId || null : null);
  const readiness = useMhdAccommodationReadiness();
  const createCase = useMhdCreateAccommodation();
  const peopleOptions = useMemo(
    () =>
      (people.data ?? []).map((person) => ({
        id: person.id,
        name: [person.firstName, person.lastName].filter(Boolean).join(' '),
      })),
    [people.data],
  );

  async function submitRequest() {
    const selectedPerson = isPrivileged ? personId : selfPersonId;
    const requestedAt = new Date().toISOString();
    const parsed = mhdAccommodationRequestSchema.safeParse({
      personId: selectedPerson,
      requestSource,
      requestChannel,
      requestedAt,
      requestSummary,
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Review the request details.');
      return;
    }
    setFormError(null);
    const result = await createCase.mutateAsync({
      companyId,
      personId: parsed.data.personId,
      requestSource: parsed.data.requestSource,
      requestChannel: parsed.data.requestChannel,
      requestedAt,
      requestSummary: parsed.data.requestSummary,
    });
    navigate(`/accommodations/${result.id}`);
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Reasonable accommodations"
        description="Requests, interactive process, options, decisions, implementation, and review."
        actions={<Button onClick={() => setCreating((value) => !value)}>Open request</Button>}
      />
      <MhdComplianceGateBanner readiness={readiness.data} />

      {creating ? (
        <MhdCard className="space-y-4">
          <div>
            <h2 className="font-semibold text-foreground">Open an accommodation process</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A request may be verbal and does not require this form or any special words. Record
              the workplace change or assistance requested—never a diagnosis or medical history.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {isPrivileged ? (
              <label className="text-sm font-medium">
                Person
                <select
                  className={`mt-1 ${inputClass}`}
                  value={personId}
                  onChange={(event) => setPersonId(event.target.value)}
                >
                  <option value="">Choose…</option>
                  {peopleOptions.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="text-sm font-medium">
              How the need came to us
              <select
                className={`mt-1 ${inputClass}`}
                value={requestSource}
                onChange={(event) =>
                  setRequestSource(event.target.value as MhdAccommodationRequestSource)
                }
              >
                {MHD_ACCOMMODATION_REQUEST_SOURCES.map((value) => (
                  <option key={value} value={value}>
                    {mhdFormatAccommodationValue(value)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Channel
              <select
                className={`mt-1 ${inputClass}`}
                value={requestChannel}
                onChange={(event) =>
                  setRequestChannel(event.target.value as MhdAccommodationRequestChannel)
                }
              >
                {MHD_ACCOMMODATION_REQUEST_CHANNELS.map((value) => (
                  <option key={value} value={value}>
                    {mhdFormatAccommodationValue(value)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm font-medium">
            Requested workplace change or assistance
            <textarea
              className={`mt-1 min-h-24 ${inputClass}`}
              value={requestSummary}
              onChange={(event) => setRequestSummary(event.target.value)}
              placeholder="Describe the requested adjustment and work-related need. Do not enter a diagnosis."
            />
          </label>
          {formError ? <p className="text-sm text-rose-700">{formError}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button disabled={createCase.isPending} onClick={() => void submitRequest()}>
              {createCase.isPending ? 'Opening…' : 'Open process'}
            </Button>
          </div>
        </MhdCard>
      ) : null}

      <MhdFilterBar>
        {isPrivileged ? (
          <MhdFilterSelect
            label="Person"
            value={personId}
            onChange={(event) => setPersonId(event.target.value)}
          >
            <option value="">All people</option>
            {peopleOptions.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </MhdFilterSelect>
        ) : null}
        <MhdFilterSelect
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value as MhdAccommodationStatus | 'ALL')}
        >
          <option value="ALL">All statuses</option>
          {MHD_ACCOMMODATION_STATUSES.map((value) => (
            <option key={value} value={value}>
              {mhdFormatAccommodationValue(value)}
            </option>
          ))}
        </MhdFilterSelect>
      </MhdFilterBar>

      {cases.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading accommodation cases…</p>
      ) : (cases.data ?? []).length === 0 ? (
        <MhdEmptyState
          icon={Accessibility}
          title="No accommodation cases"
          description="Requests will appear here whether they begin verbally, in writing, or through another workflow."
        />
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Reference</MhdTh>
                <MhdTh>Person</MhdTh>
                <MhdTh>Request</MhdTh>
                <MhdTh>Status</MhdTh>
                <MhdTh>Review due</MhdTh>
                <MhdTh />
              </tr>
            </thead>
            <tbody>
              {(cases.data ?? []).map((item) => (
                <MhdTr key={item.id}>
                  <MhdTd className="font-mono">{item.referenceId}</MhdTd>
                  <MhdTd>{item.personDisplayName}</MhdTd>
                  <MhdTd>{mhdFormatAccommodationValue(item.requestSource)}</MhdTd>
                  <MhdTd>{mhdFormatAccommodationValue(item.status)}</MhdTd>
                  <MhdTd>{item.reviewDueDate ?? '—'}</MhdTd>
                  <MhdTd>
                    <MhdTableActions viewTo={`/accommodations/${item.id}`} />
                  </MhdTd>
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
        </MhdCard>
      )}
    </div>
  );
}
