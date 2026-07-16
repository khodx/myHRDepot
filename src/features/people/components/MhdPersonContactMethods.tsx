import { useCallback, useEffect, useState } from 'react';
import type { MhdContactMethod, MhdContactType } from '@/features/people/Types';
import { mhdPersonService } from '@/features/people/Service';

interface MhdPersonContactMethodsProps {
  personId: string;
}

const CONTACT_TYPES: MhdContactType[] = ['EMAIL', 'PHONE', 'MOBILE'];

// The primary email/phone/mobile shown in MhdPersonDetailsPanel is only a
// projection — this component is the management surface for the full
// contact_methods list (multiple emails, promoting a non-primary to
// primary, deleting a stray number, etc.). Kept intentionally minimal; a
// fuller inline-edit UX is a future enhancement.
export function MhdPersonContactMethods({ personId }: MhdPersonContactMethodsProps) {
  const [methods, setMethods] = useState<MhdContactMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newType, setNewType] = useState<MhdContactType>('EMAIL');
  const [newValue, setNewValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await mhdPersonService.listContactMethodsForPerson(personId);
      setMethods(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load contact methods.');
    } finally {
      setIsLoading(false);
    }
  }, [personId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- package pattern: fetch-on-mount with loading state
    void reload();
  }, [reload]);

  async function handleAdd() {
    if (newValue.trim().length === 0) return;
    setIsSaving(true);
    try {
      await mhdPersonService.addContactMethod({ personId, contactType: newType, contactValue: newValue, isPrimary: false });
      setNewValue('');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add contact method.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleMakePrimary(contactMethodId: string) {
    setIsSaving(true);
    try {
      await mhdPersonService.updateContactMethod({ contactMethodId, isPrimary: true });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update contact method.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(contactMethodId: string) {
    setIsSaving(true);
    try {
      await mhdPersonService.deleteContactMethod(contactMethodId);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete contact method.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-5 border-t border-slate-200 pt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact methods</p>

      {isLoading ? (
        <p className="mt-2 text-sm text-slate-500">Loading contact methods...</p>
      ) : methods.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No contact methods yet.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {methods.map((method) => (
            <li key={method.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm">
              <div>
                <span className="font-medium text-slate-900">{method.contactType}</span>{' '}
                <span className="text-slate-700">{method.contactValue}</span>{' '}
                {method.isPrimary ? <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">Primary</span> : null}
              </div>
              <div className="flex gap-2">
                {!method.isPrimary ? (
                  <button type="button" className="text-xs font-medium text-blue-700 hover:underline" disabled={isSaving} onClick={() => handleMakePrimary(method.id)}>
                    Make primary
                  </button>
                ) : null}
                <button type="button" className="text-xs font-medium text-red-700 hover:underline" disabled={isSaving} onClick={() => handleDelete(method.id)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}

      <div className="mt-3 flex items-center gap-2">
        <select className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" value={newType} onChange={(event) => setNewType(event.target.value as MhdContactType)}>
          {CONTACT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input
          className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          placeholder="New contact value"
          value={newValue}
          onChange={(event) => setNewValue(event.target.value)}
        />
        <button type="button" className="rounded-md bg-blue-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-800" disabled={isSaving} onClick={handleAdd}>
          Add
        </button>
      </div>
    </div>
  );
}
