import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HardHat } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdFilterBar, MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdPersonService } from '@/features/people/Service';
import { useQuery } from '@tanstack/react-query';
import {
  useMhdCreateOshaEstablishment,
  useMhdOshaEstablishments,
  useMhdSafetyIncidents,
} from '../Hook';
import { mhdOshaEstablishmentSchema } from '../Schemas';
import { MhdSafetyIncidentForm } from './MhdSafetyIncidentForm';
import { MhdSafetyIncidentList } from './MhdSafetyIncidentList';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

/**
 * Workplace Safety module home: establishment picker (+ create), the OSHA
 * 300-log-style incident list for the selected establishment/year, and the
 * incident intake form. Access is already restricted to Platform Admin/HR
 * Partner/HR Admin/Client Admin by mhdRouteAccess — every server-side RPC
 * re-enforces the identical set via mhd_can_view_safety_incident.
 */
export function MhdSafetyModulePage() {
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? '';

  const establishments = useMhdOshaEstablishments(companyId || null);
  const [establishmentId, setEstablishmentId] = useState('');
  const [calendarYear, setCalendarYear] = useState(CURRENT_YEAR);
  const [creatingEstablishment, setCreatingEstablishment] = useState(false);
  const [recordingIncident, setRecordingIncident] = useState(false);

  const selectedEstablishmentId = establishmentId || establishments.data?.[0]?.id || '';

  const incidents = useMhdSafetyIncidents(
    companyId || null,
    selectedEstablishmentId || null,
    calendarYear,
  );

  const people = useQuery({
    queryKey: ['mhd-safety', 'people', companyId],
    queryFn: () => mhdPersonService.listPeople({ companyId, searchTerm: '' }),
    enabled: Boolean(companyId),
  });
  const peopleOptions = useMemo(
    () =>
      (people.data ?? []).map((person) => ({
        id: person.id,
        name: [person.firstName, person.lastName].filter(Boolean).join(' '),
      })),
    [people.data],
  );

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Workplace Safety"
        description="OSHA/Cal-OSHA recordkeeping: establishments, the 300 log, incident detail, and the annual 300A summary."
        actions={
          <Button
            onClick={() => setCreatingEstablishment((value) => !value)}
            className="h-9 px-3 text-[16.8px]"
          >
            Add Establishment
          </Button>
        }
      />

      {creatingEstablishment ? (
        <MhdCreateEstablishmentForm
          companyId={companyId}
          onDone={() => setCreatingEstablishment(false)}
        />
      ) : null}

      {establishments.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading establishments…</p>
      ) : (establishments.data ?? []).length === 0 ? (
        <MhdEmptyState
          icon={HardHat}
          title="No establishments recorded"
          description="Add the physical worksite(s) your company reports OSHA recordkeeping under."
        />
      ) : (
        <>
          <MhdFilterBar>
            <MhdFilterSelect
              label="Establishment"
              value={selectedEstablishmentId}
              onChange={(event) => setEstablishmentId(event.target.value)}
            >
              {(establishments.data ?? []).map((establishment) => (
                <option key={establishment.id} value={establishment.id}>
                  {establishment.establishmentName}
                </option>
              ))}
            </MhdFilterSelect>
            <MhdFilterSelect
              label="Calendar year"
              value={String(calendarYear)}
              onChange={(event) => setCalendarYear(Number(event.target.value))}
            >
              {YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </MhdFilterSelect>
          </MhdFilterBar>

          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Form 300 log — {calendarYear}</h2>
            <div className="flex gap-2">
              {/* Launches the existing shared Handbook Engine's create flow,
                pre-filled for the SAFETY content pack and this establishment
                — it does not duplicate any handbook-wizard step here. */}
              <Link
                to={`/handbooks?handbookType=SAFETY&establishmentId=${selectedEstablishmentId}`}
                className="inline-flex h-9 items-center rounded-md border border-border bg-card px-3 text-[16.8px] font-semibold text-foreground hover:bg-accent-tint"
              >
                Create Or Update Safety Handbook
              </Link>
              <Link
                to={`/safety/${selectedEstablishmentId}/annual-summary?year=${calendarYear}`}
                className="inline-flex h-9 items-center rounded-md border border-border bg-card px-3 text-[16.8px] font-semibold text-foreground hover:bg-accent-tint"
              >
                Form 300A Summary
              </Link>
              <Button
                onClick={() => setRecordingIncident((value) => !value)}
                className="h-9 px-3 text-[16.8px]"
              >
                Record Incident
              </Button>
            </div>
          </div>

          {recordingIncident && selectedEstablishmentId ? (
            <MhdSafetyIncidentForm
              companyId={companyId}
              establishmentId={selectedEstablishmentId}
              peopleOptions={peopleOptions}
              onSuccess={() => setRecordingIncident(false)}
              onCancel={() => setRecordingIncident(false)}
            />
          ) : null}

          <MhdSafetyIncidentList incidents={incidents.data ?? []} isLoading={incidents.isLoading} />
        </>
      )}
    </div>
  );
}

function MhdCreateEstablishmentForm({
  companyId,
  onDone,
}: {
  companyId: string;
  onDone: () => void;
}) {
  const createEstablishment = useMhdCreateOshaEstablishment();
  const [establishmentName, setEstablishmentName] = useState('');
  const [naicsCode, setNaicsCode] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressZip, setAddressZip] = useState('');
  const [averageEmployeeCount, setAverageEmployeeCount] = useState(0);
  const [totalHoursWorkedYtd, setTotalHoursWorkedYtd] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  async function submit() {
    const parsed = mhdOshaEstablishmentSchema.safeParse({
      establishmentName,
      naicsCode,
      addressStreet,
      addressCity,
      addressState,
      addressZip,
      averageEmployeeCount,
      totalHoursWorkedYtd,
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Review the establishment details.');
      return;
    }
    setFormError(null);
    await createEstablishment.mutateAsync({ companyId, ...parsed.data });
    onDone();
  }

  return (
    <MhdCard className="space-y-4">
      <h2 className="font-semibold text-foreground">Add an establishment</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium">
          Establishment name
          <input
            className={`mt-1 ${inputClass}`}
            value={establishmentName}
            onChange={(event) => setEstablishmentName(event.target.value)}
          />
        </label>
        <label className="text-sm font-medium">
          NAICS code
          <input
            className={`mt-1 ${inputClass}`}
            value={naicsCode}
            onChange={(event) => setNaicsCode(event.target.value)}
          />
        </label>
        <label className="text-sm font-medium">
          Street
          <input
            className={`mt-1 ${inputClass}`}
            value={addressStreet}
            onChange={(event) => setAddressStreet(event.target.value)}
          />
        </label>
        <label className="text-sm font-medium">
          City
          <input
            className={`mt-1 ${inputClass}`}
            value={addressCity}
            onChange={(event) => setAddressCity(event.target.value)}
          />
        </label>
        <label className="text-sm font-medium">
          State
          <input
            className={`mt-1 ${inputClass}`}
            maxLength={2}
            value={addressState}
            onChange={(event) => setAddressState(event.target.value)}
          />
        </label>
        <label className="text-sm font-medium">
          Zip
          <input
            className={`mt-1 ${inputClass}`}
            value={addressZip}
            onChange={(event) => setAddressZip(event.target.value)}
          />
        </label>
        <label className="text-sm font-medium">
          Average employee count
          <input
            type="number"
            min={0}
            className={`mt-1 ${inputClass}`}
            value={averageEmployeeCount}
            onChange={(event) => setAverageEmployeeCount(Number(event.target.value) || 0)}
          />
        </label>
        <label className="text-sm font-medium">
          Total hours worked (YTD)
          <input
            type="number"
            min={0}
            className={`mt-1 ${inputClass}`}
            value={totalHoursWorkedYtd}
            onChange={(event) => setTotalHoursWorkedYtd(Number(event.target.value) || 0)}
          />
        </label>
      </div>
      {formError ? <p className="text-sm text-rose-700">{formError}</p> : null}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button disabled={createEstablishment.isPending} onClick={() => void submit()}>
          {createEstablishment.isPending ? 'Adding…' : 'Add establishment'}
        </Button>
      </div>
    </MhdCard>
  );
}
