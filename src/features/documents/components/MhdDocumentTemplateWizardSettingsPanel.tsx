import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { mhdDocumentNarrativeSlotsSchema } from '../Schemas';
import {
  MHD_DOCUMENT_EMPLOYEE_FILE_CATEGORIES,
  MHD_DOCUMENT_EMPLOYEE_FILE_CATEGORY_LABELS,
  type MhdDocumentEmployeeFileCategory,
  type MhdDocumentNarrativeSlot,
  type MhdDocumentTemplateWizardSettings,
} from '../Types';
import {
  useMhdDocumentTemplateWizardSettings,
  useMhdSetDocumentTemplateWizardSettings,
} from '../OutputHook';

interface MhdDocumentTemplateWizardSettingsPanelProps {
  templateId: string;
  canEdit: boolean;
}

const emptySlot = (): MhdDocumentNarrativeSlot => ({ key: '', label: '', help: '' });

function settingsSnapshot(
  employeeFileCategory: MhdDocumentEmployeeFileCategory | '',
  narrativeSlots: MhdDocumentNarrativeSlot[],
) {
  return JSON.stringify({ employeeFileCategory, narrativeSlots });
}

interface SettingsFormProps {
  templateId: string;
  settings: MhdDocumentTemplateWizardSettings;
  canEdit: boolean;
}

/**
 * The form proper. The panel mounts it once the settings have loaded, so its state starts from
 * the loaded values rather than being copied from them in an effect.
 */
function SettingsForm({ templateId, settings, canEdit }: SettingsFormProps) {
  const saveSettings = useMhdSetDocumentTemplateWizardSettings(templateId);
  const [employeeFileCategory, setEmployeeFileCategory] = useState<
    MhdDocumentEmployeeFileCategory | ''
  >(settings.employeeFileCategory ?? '');
  const [narrativeSlots, setNarrativeSlots] = useState<MhdDocumentNarrativeSlot[]>(
    settings.narrativeSlots,
  );
  const [initialValue, setInitialValue] = useState(() =>
    settingsSnapshot(settings.employeeFileCategory ?? '', settings.narrativeSlots),
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const currentValue = settingsSnapshot(employeeFileCategory, narrativeSlots);
  const dirty = currentValue !== initialValue;

  function updateSlot(index: number, changes: Partial<MhdDocumentNarrativeSlot>) {
    setNarrativeSlots((current) =>
      current.map((slot, slotIndex) => (slotIndex === index ? { ...slot, ...changes } : slot)),
    );
    setSaved(false);
  }

  function handleSave() {
    const parsed = mhdDocumentNarrativeSlotsSchema.safeParse(narrativeSlots);
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? 'Review the narrative sections.');
      return;
    }
    setValidationError(null);
    // mutate (not mutateAsync): a refusal is shown through saveSettings.error, not thrown.
    saveSettings.mutate(
      { employeeFileCategory: employeeFileCategory || null, narrativeSlots: parsed.data },
      {
        onSuccess: () => {
          setInitialValue(currentValue);
          setSaved(true);
        },
      },
    );
  }

  return (
    <>
      {saveSettings.error ? (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {saveSettings.error instanceof Error
            ? saveSettings.error.message
            : 'Unable to save wizard settings.'}
        </p>
      ) : null}
      {validationError ? (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {validationError}
        </p>
      ) : null}
      {saved ? (
        <p role="status" className="mt-3 text-sm text-green-700">
          Settings saved.
        </p>
      ) : null}
      <label className="mt-3 block text-sm font-medium text-foreground">
        File Documents In
        <select
          disabled={!canEdit}
          className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
          value={employeeFileCategory}
          onChange={(event) => {
            setEmployeeFileCategory(event.target.value as MhdDocumentEmployeeFileCategory | '');
            setSaved(false);
          }}
        >
          <option value="">Not Filed In An Employee File</option>
          {MHD_DOCUMENT_EMPLOYEE_FILE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {MHD_DOCUMENT_EMPLOYEE_FILE_CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-4">
        <h4 className="text-sm font-medium text-foreground">Editable Narrative Sections</h4>
        <p className="mt-1 text-xs text-muted-foreground">
          People can add text to these sections before a document is issued. Use them in the
          template as {'{{#if narrative.<key>}}{{narrative.<key>}}{{/if}}'}.
        </p>
        <div className="mt-3 space-y-3">
          {narrativeSlots.map((slot, index) => (
            <div
              key={`${index}-${slot.key}`}
              className="space-y-2 rounded-md border border-border p-3"
            >
              <input
                disabled={!canEdit}
                aria-label="Section key"
                className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
                placeholder="key"
                value={slot.key}
                onChange={(event) => updateSlot(index, { key: event.target.value })}
              />
              <input
                disabled={!canEdit}
                aria-label="Section label"
                className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
                placeholder="label"
                value={slot.label}
                onChange={(event) => updateSlot(index, { label: event.target.value })}
              />
              <input
                disabled={!canEdit}
                aria-label="Section help"
                className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
                placeholder="help (optional)"
                value={slot.help ?? ''}
                onChange={(event) => updateSlot(index, { help: event.target.value })}
              />
              <button
                type="button"
                disabled={!canEdit}
                className="text-xs font-medium text-red-600 hover:underline"
                onClick={() => {
                  setNarrativeSlots((current) =>
                    current.filter((_, slotIndex) => slotIndex !== index),
                  );
                  setSaved(false);
                }}
              >
                Remove Section
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          disabled={!canEdit}
          className="mt-3 text-sm font-medium text-accent-hover hover:underline"
          onClick={() => {
            setNarrativeSlots((current) => [...current, emptySlot()]);
            setSaved(false);
          }}
        >
          Add Section
        </button>
      </div>
      {canEdit ? (
        <Button className="mt-4" disabled={!dirty || saveSettings.isPending} onClick={handleSave}>
          {saveSettings.isPending ? 'Saving Settings...' : 'Save Settings'}
        </Button>
      ) : null}
    </>
  );
}

export function MhdDocumentTemplateWizardSettingsPanel({
  templateId,
  canEdit,
}: MhdDocumentTemplateWizardSettingsPanelProps) {
  const settingsQuery = useMhdDocumentTemplateWizardSettings(templateId);

  return (
    <MhdCard className="mt-4">
      <h3 className="text-[15px] font-semibold text-foreground">Wizard Output Settings</h3>
      {settingsQuery.isLoading ? (
        <p className="mt-3 text-sm text-muted-foreground">Loading wizard output settings...</p>
      ) : null}
      {settingsQuery.error ? (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {settingsQuery.error instanceof Error
            ? settingsQuery.error.message
            : 'Unable to load wizard settings.'}
        </p>
      ) : null}
      {settingsQuery.data ? (
        <SettingsForm
          key={templateId}
          templateId={templateId}
          settings={settingsQuery.data}
          canEdit={canEdit}
        />
      ) : null}
    </MhdCard>
  );
}
