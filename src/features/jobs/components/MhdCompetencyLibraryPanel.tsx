import { useState } from 'react';
import { useMhdCompetencies, useMhdUpsertCompetency } from '../Hook';
import { MHD_INDUSTRIES, mhdFormatIndustry, type MhdIndustry } from '../Types';

interface Props {
  companyId: string;
  /** Platform Admin may edit GLOBAL rows; everyone privileged may add company rows. */
  isPlatformAdmin: boolean;
  canEdit: boolean;
  /** When set, the panel acts as a picker and reports selections back. */
  selectedIds?: string[];
  onToggleSelected?: (competencyId: string) => void;
}

/**
 * The competency library — seeded global rows plus a company's own.
 *
 * Descriptions REFERENCE these rows rather than copying them, so correcting a
 * global competency corrects it everywhere it is used. That is why global rows
 * are read-only to companies: an edit at one tenant would change what every
 * other tenant resolves against.
 *
 * The industry filter is additive, not exclusive — GENERAL competencies apply
 * everywhere and always appear alongside an industry's own.
 */
export function MhdCompetencyLibraryPanel({
  companyId,
  isPlatformAdmin,
  canEdit,
  selectedIds,
  onToggleSelected,
}: Props) {
  const [industry, setIndustry] = useState<MhdIndustry | 'ALL'>('ALL');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIndustry, setNewIndustry] = useState<MhdIndustry>('GENERAL');
  const [newRegulated, setNewRegulated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const competencies = useMhdCompetencies(companyId, industry === 'ALL' ? null : industry);
  const upsert = useMhdUpsertCompetency(companyId);

  const isPicker = Boolean(onToggleSelected);

  async function addCompetency() {
    if (!newName.trim()) {
      setError('A competency needs a name.');
      return;
    }
    setError(null);
    await upsert.mutateAsync({
      companyId,
      competencyName: newName.trim(),
      industry: newIndustry,
      isRegulated: newRegulated,
    });
    setNewName('');
    setNewRegulated(false);
    setIsAdding(false);
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">Competencies</h2>
          <p className="mt-0.5 text-sm text-neutral-600">
            Seeded libraries by industry, plus any your organisation adds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={industry}
            onChange={(event) => setIndustry(event.target.value as MhdIndustry | 'ALL')}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          >
            <option value="ALL">All industries</option>
            {MHD_INDUSTRIES.map((value) => (
              <option key={value} value={value}>
                {mhdFormatIndustry(value)}
              </option>
            ))}
          </select>
          {canEdit ? (
            <button
              type="button"
              onClick={() => setIsAdding((previous) => !previous)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700"
            >
              {isAdding ? 'Cancel' : 'Add competency'}
            </button>
          ) : null}
        </div>
      </header>

      {isAdding ? (
        <div className="space-y-3 rounded-md border border-neutral-200 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="competencyName" className="block text-sm font-medium text-neutral-700">
                Name
              </label>
              <input
                id="competencyName"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="competencyIndustry" className="block text-sm font-medium text-neutral-700">
                Industry
              </label>
              <select
                id="competencyIndustry"
                value={newIndustry}
                onChange={(event) => setNewIndustry(event.target.value as MhdIndustry)}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              >
                {MHD_INDUSTRIES.map((value) => (
                  <option key={value} value={value}>
                    {mhdFormatIndustry(value)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={newRegulated}
              onChange={(event) => setNewRegulated(event.target.checked)}
            />
            Tied to a regulatory expectation
          </label>
          {error ? <p className="text-xs text-rose-600">{error}</p> : null}
          <div className="flex justify-end">
            <button
              type="button"
              disabled={upsert.isPending}
              onClick={() => void addCompetency()}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {upsert.isPending ? 'Saving…' : 'Add'}
            </button>
          </div>
        </div>
      ) : null}

      {competencies.isLoading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : (competencies.data ?? []).length === 0 ? (
        <p className="text-sm text-neutral-500">No competencies in this filter.</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {(competencies.data ?? []).map((competency) => (
            <li key={competency.id} className="flex items-start gap-3 py-2">
              {isPicker ? (
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={(selectedIds ?? []).includes(competency.id)}
                  onChange={() => onToggleSelected?.(competency.id)}
                />
              ) : null}
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">
                  {competency.competencyName}
                  {competency.isGlobal ? (
                    <span
                      className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-normal text-neutral-600"
                      title="Seeded and maintained centrally. Editing it would change what every organisation resolves against."
                    >
                      Standard
                    </span>
                  ) : null}
                  {competency.isRegulated ? (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-normal text-amber-800">
                      Regulated
                    </span>
                  ) : null}
                </p>
                {competency.description ? (
                  <p className="mt-0.5 text-sm text-neutral-600">{competency.description}</p>
                ) : null}
                <p className="mt-0.5 text-xs text-neutral-500">
                  {mhdFormatIndustry(competency.industry)}
                  {competency.category ? ` · ${competency.category}` : ''}
                </p>
              </div>
              {canEdit && !competency.isGlobal ? (
                <span className="text-xs text-neutral-400">Yours</span>
              ) : competency.isGlobal && !isPlatformAdmin ? (
                <span className="text-xs text-neutral-400">Read-only</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {/*
        Stated plainly rather than left to be discovered when an edit is refused.
      */}
      <p className="text-xs text-neutral-500">
        Standard competencies are maintained centrally. To diverge from one, add your own instead of
        editing it.
      </p>
    </section>
  );
}
