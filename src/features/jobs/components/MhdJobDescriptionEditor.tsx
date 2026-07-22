import { useState } from 'react';
import {
  useMhdPublishDescription,
  useMhdSetDescriptionFunctions,
  useMhdSetDescriptionQualifications,
  useMhdUpdateDescriptionDraft,
} from '../Hook';
import {
  MHD_QUALIFICATION_TYPES,
  mhdCanPublishDescription,
  mhdFormatQualificationType,
  type MhdJobQualification,
  type MhdQualificationType,
} from '../Types';

interface DraftFunction {
  functionText: string;
  isEssential: boolean;
}

interface Props {
  companyId: string;
  descriptionId: string;
  /** Existing draft content, when editing rather than starting blank. */
  initialSummary?: string | null;
  initialFunctions?: DraftFunction[];
  initialQualifications?: MhdJobQualification[];
  onPublished: () => void;
  onCancel: () => void;
}

/**
 * Authoring a draft description.
 *
 * The publish button explains itself rather than simply disabling: a summary and
 * at least one essential function are required, and a user who cannot see why
 * the button is dead will assume the feature is broken. The server enforces the
 * same gate independently — this only makes it legible.
 */
export function MhdJobDescriptionEditor({
  companyId,
  descriptionId,
  initialSummary,
  initialFunctions,
  initialQualifications,
  onPublished,
  onCancel,
}: Props) {
  const [summary, setSummary] = useState(initialSummary ?? '');
  const [functions, setFunctions] = useState<DraftFunction[]>(
    initialFunctions ?? [{ functionText: '', isEssential: true }],
  );
  const [qualifications, setQualifications] = useState<
    Array<{ qualificationText: string; qualificationType: MhdQualificationType; isRequired: boolean }>
  >(
    (initialQualifications ?? []).map((q) => ({
      qualificationText: q.text,
      qualificationType: q.type,
      isRequired: q.required,
    })),
  );
  const [error, setError] = useState<string | null>(null);

  const updateDraft = useMhdUpdateDescriptionDraft(companyId);
  const setFns = useMhdSetDescriptionFunctions(companyId);
  const setQuals = useMhdSetDescriptionQualifications(companyId);
  const publish = useMhdPublishDescription(companyId);

  const essentialCount = functions.filter(
    (f) => f.isEssential && f.functionText.trim().length > 0,
  ).length;
  const gate = mhdCanPublishDescription(summary, essentialCount);

  const isSaving =
    updateDraft.isPending || setFns.isPending || setQuals.isPending || publish.isPending;

  async function saveDraft() {
    await updateDraft.mutateAsync({ descriptionId, summary });
    await setFns.mutateAsync({
      descriptionId,
      functions: functions.filter((f) => f.functionText.trim().length > 0),
    });
    await setQuals.mutateAsync({
      descriptionId,
      qualifications: qualifications.filter((q) => q.qualificationText.trim().length > 0),
    });
  }

  async function saveAndPublish() {
    if (!gate.ok) {
      setError(gate.reason);
      return;
    }
    setError(null);
    await saveDraft();
    await publish.mutateAsync({ descriptionId });
    onPublished();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
        Publishing creates a <strong>new version</strong> and archives the current one. Published
        versions cannot be edited afterwards — reviews written against a version must keep meaning
        what they meant.
      </div>

      <div>
        <label htmlFor="summary" className="block text-sm font-medium text-neutral-700">
          Role summary
        </label>
        <textarea
          id="summary"
          rows={3}
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-neutral-700">Functions</legend>
        <p className="mt-0.5 text-xs text-neutral-500">
          Mark a function <strong>essential</strong> when the role fundamentally requires it.
          Essential functions are the reference point for any accommodation conversation, so the
          distinction is worth getting right.
        </p>
        <div className="mt-2 space-y-2">
          {functions.map((fn, index) => (
            <div key={`fn-${index}`} className="flex items-start gap-2">
              <textarea
                rows={2}
                value={fn.functionText}
                onChange={(event) =>
                  setFunctions((previous) =>
                    previous.map((item, i) =>
                      i === index ? { ...item, functionText: event.target.value } : item,
                    ),
                  )
                }
                className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
              <label className="mt-2 flex items-center gap-1.5 whitespace-nowrap text-sm">
                <input
                  type="checkbox"
                  checked={fn.isEssential}
                  onChange={(event) =>
                    setFunctions((previous) =>
                      previous.map((item, i) =>
                        i === index ? { ...item, isEssential: event.target.checked } : item,
                      ),
                    )
                  }
                />
                Essential
              </label>
              <button
                type="button"
                onClick={() => setFunctions((previous) => previous.filter((_, i) => i !== index))}
                className="mt-2 text-sm text-neutral-500"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setFunctions((previous) => [...previous, { functionText: '', isEssential: true }])
            }
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700"
          >
            Add function
          </button>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-neutral-700">Qualifications</legend>
        <p className="mt-0.5 text-xs text-neutral-500">
          Keep <strong>required</strong> and <strong>preferred</strong> distinct. Marking a
          preference as required narrows the candidate pool unnecessarily.
        </p>
        <div className="mt-2 space-y-2">
          {qualifications.map((qual, index) => (
            <div key={`qual-${index}`} className="flex items-start gap-2">
              <input
                value={qual.qualificationText}
                onChange={(event) =>
                  setQualifications((previous) =>
                    previous.map((item, i) =>
                      i === index ? { ...item, qualificationText: event.target.value } : item,
                    ),
                  )
                }
                className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
              <select
                value={qual.qualificationType}
                onChange={(event) =>
                  setQualifications((previous) =>
                    previous.map((item, i) =>
                      i === index
                        ? { ...item, qualificationType: event.target.value as MhdQualificationType }
                        : item,
                    ),
                  )
                }
                className="rounded-md border border-neutral-300 px-2 py-2 text-sm"
              >
                {MHD_QUALIFICATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {mhdFormatQualificationType(type)}
                  </option>
                ))}
              </select>
              <label className="mt-2 flex items-center gap-1.5 whitespace-nowrap text-sm">
                <input
                  type="checkbox"
                  checked={qual.isRequired}
                  onChange={(event) =>
                    setQualifications((previous) =>
                      previous.map((item, i) =>
                        i === index ? { ...item, isRequired: event.target.checked } : item,
                      ),
                    )
                  }
                />
                Required
              </label>
              <button
                type="button"
                onClick={() =>
                  setQualifications((previous) => previous.filter((_, i) => i !== index))
                }
                className="mt-2 text-sm text-neutral-500"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setQualifications((previous) => [
                ...previous,
                { qualificationText: '', qualificationType: 'EXPERIENCE', isRequired: true },
              ])
            }
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700"
          >
            Add qualification
          </button>
        </div>
      </fieldset>

      {!gate.ok ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {gate.reason}
        </p>
      ) : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void saveDraft()}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 disabled:opacity-50"
        >
          Save draft
        </button>
        <button
          type="button"
          disabled={isSaving || !gate.ok}
          onClick={() => void saveAndPublish()}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-50 disabled:opacity-50"
        >
          {publish.isPending ? 'Publishing…' : 'Publish version'}
        </button>
      </div>
    </div>
  );
}
