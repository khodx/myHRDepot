import { useState } from 'react';
import { mhdFormService } from '../Service';

interface MhdFormDraftSaveProps {
  submissionId: string;
  values: Record<string, unknown>;
  onSaved?: (savedAt: string) => void;
}

export function MhdFormDraftSave({ submissionId, values, onSaved }: MhdFormDraftSaveProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const submission = await mhdFormService.saveDraft(submissionId, values);
      const savedAt = submission.updatedAt ?? new Date().toISOString();
      setLastSavedAt(savedAt);
      onSaved?.(savedAt);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="rounded-md border border-border px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save Draft'}
      </button>
      {lastSavedAt ? (
        <span className="text-xs text-muted-foreground">
          Saved at {new Date(lastSavedAt).toLocaleTimeString()}
        </span>
      ) : null}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}

interface MhdFormResumeDraftsProps {
  drafts: Array<{ id: string; referenceId: string; formId: string; updatedAt?: string | null }>;
  onResume: (submissionId: string) => void;
}

export function MhdFormResumeDrafts({ drafts, onResume }: MhdFormResumeDraftsProps) {
  if (drafts.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Resume Saved Draft
      </h4>
      <ul className="mt-3 space-y-2">
        {drafts.map((draft) => (
          <li
            key={draft.id}
            className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-2 text-sm"
          >
            <div>
              <p className="font-medium text-foreground">{draft.referenceId}</p>
              {draft.updatedAt ? (
                <p className="text-xs text-muted-foreground">
                  Updated {new Date(draft.updatedAt).toLocaleString()}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => onResume(draft.id)}
              className="text-sm font-semibold text-accent hover:text-accent-hover"
            >
              Resume
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
