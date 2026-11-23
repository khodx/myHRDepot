import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdFormModal } from '@/components/ui/MhdFormModal';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdPeoplePicker } from '@/features/people/Hook';
import {
  useMhdAssignWorksite,
  useMhdCompanyWorksiteAssignments,
  useMhdCompanyWorksites,
  useMhdSaveWorksite,
} from '../Hook';
import { type MhdCompanyWorksite } from '../Types';

const inputClass = 'mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm';

export function MhdCompanyWorksitesPanel({ companyId }: { companyId: string }) {
  const { roles } = useMhdAuth();
  const canManage = ['Platform Admin', 'Client Admin', 'HR Partner', 'HR Admin'].some((role) =>
    roles.includes(role as (typeof roles)[number]),
  );
  const worksites = useMhdCompanyWorksites(companyId);
  const assignments = useMhdCompanyWorksiteAssignments(companyId);
  const people = useMhdPeoplePicker(canManage ? companyId : null);
  const save = useMhdSaveWorksite();
  const assign = useMhdAssignWorksite();
  const [editing, setEditing] = useState<MhdCompanyWorksite | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [personId, setPersonId] = useState('');
  const [worksiteId, setWorksiteId] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');

  function startEdit(worksite?: MhdCompanyWorksite) {
    setEditing(worksite ?? null);
    setName(worksite?.worksiteName ?? '');
    setStreet(worksite?.addressStreet ?? '');
    setCity(worksite?.addressCity ?? '');
    setState(worksite?.addressState ?? '');
    setZip(worksite?.addressZip ?? '');
    setLatitude(worksite ? String(worksite.latitude) : '');
    setLongitude(worksite ? String(worksite.longitude) : '');
    setOpen(true);
  }

  if (!canManage) return null;
  return (
    <div className="space-y-4">
      <MhdCard>
        <MhdCardHeader title="Company Worksites" />
        <div className="flex justify-end">
          <Button onClick={() => startEdit()}>Add Worksite</Button>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(worksites.data ?? []).map((worksite) => (
                <tr key={worksite.id} className="border-t border-border">
                  <td className="py-2">{worksite.worksiteName}</td>
                  <td>
                    {worksite.addressStreet}, {worksite.addressCity}, {worksite.addressState}{' '}
                    {worksite.addressZip}
                  </td>
                  <td>{worksite.isActive ? 'Yes' : 'No'}</td>
                  <td>
                    <Button variant="secondary" onClick={() => startEdit(worksite)}>
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MhdCard>
      <MhdCard className="space-y-3">
        <MhdCardHeader title="Person Assignment" />
        <div className="grid gap-3 md:grid-cols-3">
          <select
            className={inputClass}
            value={personId}
            onChange={(event) => setPersonId(event.target.value)}
          >
            <option value="">Person</option>
            {(people.data ?? []).map((person) => (
              <option key={person.id} value={person.id}>
                {person.displayName}
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            value={worksiteId}
            onChange={(event) => setWorksiteId(event.target.value)}
          >
            <option value="">Worksite</option>
            {(worksites.data ?? []).map((worksite) => (
              <option key={worksite.id} value={worksite.id}>
                {worksite.worksiteName}
              </option>
            ))}
          </select>
          <input
            className={inputClass}
            type="date"
            value={effectiveFrom}
            onChange={(event) => setEffectiveFrom(event.target.value)}
          />
        </div>
        <Button
          disabled={!personId || !worksiteId || !effectiveFrom || assign.isPending}
          onClick={() => void assign.mutateAsync({ personId, worksiteId, effectiveFrom })}
        >
          Assign Worksite
        </Button>
        <p className="text-xs text-muted-foreground">
          {assignments.data?.length ?? 0} assignment(s) recorded.
        </p>
      </MhdCard>
      {open ? (
        <MhdFormModal
          title={editing ? 'Edit Worksite' : 'Add Worksite'}
          onClose={() => setOpen(false)}
        >
          <div className="space-y-3">
            <input
              className={inputClass}
              placeholder="Worksite name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Street address"
              value={street}
              onChange={(event) => setStreet(event.target.value)}
            />
            <div className="grid gap-3 md:grid-cols-3">
              <input
                className={inputClass}
                placeholder="City"
                value={city}
                onChange={(event) => setCity(event.target.value)}
              />
              <input
                className={inputClass}
                placeholder="State"
                value={state}
                onChange={(event) => setState(event.target.value)}
              />
              <input
                className={inputClass}
                placeholder="ZIP"
                value={zip}
                onChange={(event) => setZip(event.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Used to measure the FMLA 75-mile test. Enter the worksite&apos;s map coordinates.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className={inputClass}
                type="number"
                placeholder="Latitude"
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
              />
              <input
                className={inputClass}
                type="number"
                placeholder="Longitude"
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
              />
            </div>
            <Button
              disabled={save.isPending}
              onClick={() =>
                void save
                  .mutateAsync({
                    companyId,
                    worksiteId: editing?.id,
                    worksiteName: name,
                    addressStreet: street,
                    addressCity: city,
                    addressState: state,
                    addressZip: zip,
                    latitude: Number(latitude),
                    longitude: Number(longitude),
                    isActive: true,
                  })
                  .then(() => setOpen(false))
              }
            >
              Save Worksite
            </Button>
          </div>
        </MhdFormModal>
      ) : null}
    </div>
  );
}
