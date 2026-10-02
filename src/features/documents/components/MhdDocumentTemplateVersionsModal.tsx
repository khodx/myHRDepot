import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdModal } from '@/components/ui/MhdModal';
import { useMhdDocumentTemplateVersions } from '../OutputHook';
import type { MhdDocumentTemplateVersion } from '../Types';

interface MhdDocumentTemplateVersionsModalProps {
  templateId: string;
  templateName: string;
  canRestore: boolean;
  isRestoring: boolean;
  onRestore: (version: MhdDocumentTemplateVersion) => Promise<void>;
  onClose: () => void;
}

export function MhdDocumentTemplateVersionsModal({
  templateId,
  templateName,
  canRestore,
  isRestoring,
  onRestore,
  onClose,
}: MhdDocumentTemplateVersionsModalProps) {
  const versionsQuery = useMhdDocumentTemplateVersions(templateId);
  const versions = versionsQuery.data ?? [];
  const [selectedVersion, setSelectedVersion] = useState<MhdDocumentTemplateVersion | null>(null);
  const currentVersion = versions.reduce(
    (highest, version) => (version.version > highest.version ? version : highest),
    versions[0] ?? null,
  );

  return (
    <MhdModal title={`Version History — ${templateName}`} onClose={onClose}>
      <h2 className="text-lg font-semibold text-foreground">Version History — {templateName}</h2>
      {versionsQuery.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading version history...</p>
      ) : null}
      {versionsQuery.error ? (
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {versionsQuery.error instanceof Error
            ? versionsQuery.error.message
            : 'Unable to load version history.'}
        </p>
      ) : null}
      {!versionsQuery.isLoading && !versionsQuery.error && versions.length === 0 ? (
        <p role="alert" className="mt-4 text-sm text-muted-foreground">
          No versions found.
        </p>
      ) : null}
      {versions.length > 0 ? (
        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="space-y-2">
            {versions.map((version) => {
              const isCurrent = version.version === currentVersion?.version;
              return (
                <button
                  key={version.version}
                  type="button"
                  onClick={() => setSelectedVersion(version)}
                  className="block w-full rounded-md border border-border p-3 text-left hover:bg-muted"
                >
                  <span className="font-medium text-foreground">Version {version.version}</span>
                  {isCurrent ? (
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">Current</span>
                  ) : null}
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {version.changedByName ?? 'Unknown'} ·{' '}
                    {new Date(version.changedAt).toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
          {selectedVersion ? (
            <div>
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/20 p-3 text-xs text-foreground">
                {selectedVersion.content}
              </pre>
              {canRestore && selectedVersion.version !== currentVersion?.version ? (
                <Button
                  className="mt-3"
                  disabled={isRestoring}
                  onClick={() => void onRestore(selectedVersion).then(onClose)}
                >
                  {isRestoring ? 'Restoring...' : 'Restore This Version'}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </MhdModal>
  );
}
