import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { mhdDocumentService } from '@/features/documents/Service';
import type {
  MhdDocumentMergeBatch,
  MhdDocumentOutputFormat,
  MhdDocumentTemplate,
} from '@/features/documents/Types';

interface MhdDocumentMergeBatchLauncherProps {
  companyId: string;
  personIds: string[];
  onClose: () => void;
}

/**
 * Rendered only while open (callers conditionally mount it, e.g.
 * `{launcherOpen && <MhdDocumentMergeBatchLauncher ... />}`) so every open is
 * a fresh mount — state naturally starts clean without an effect having to
 * reset it, which avoids a synchronous setState-in-effect on every reopen.
 */
export function MhdDocumentMergeBatchLauncher({
  companyId,
  personIds,
  onClose,
}: MhdDocumentMergeBatchLauncherProps) {
  const [templates, setTemplates] = useState<MhdDocumentTemplate[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [outputFormat, setOutputFormat] = useState<MhdDocumentOutputFormat>('HTML');
  const [batch, setBatch] = useState<MhdDocumentMergeBatch | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void mhdDocumentService
      .listTemplates(companyId)
      .then((loaded) => {
        if (cancelled) return;
        setTemplates(loaded);
        setTemplateId(loaded[0]?.id ?? '');
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load templates.');
      })
      .finally(() => {
        if (!cancelled) setLoadingTemplates(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  useEffect(() => {
    if (!batch || batch.status === 'COMPLETED' || batch.status === 'FAILED') return;
    const interval = window.setInterval(() => {
      void mhdDocumentService.getMergeBatch(batch.id).then(setBatch).catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to check batch status.');
      });
    }, 2000);
    return () => window.clearInterval(interval);
  }, [batch]);

  async function handleLaunch() {
    setError(null);
    setLaunching(true);
    try {
      const requested = await mhdDocumentService.requestMergeBatch({
        companyId,
        templateId,
        outputFormat,
        personIds,
      });
      await mhdDocumentService.runMergeBatch(requested.id);
      setBatch(await mhdDocumentService.getMergeBatch(requested.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to launch document generation.');
    } finally {
      setLaunching(false);
    }
  }

  const complete = batch?.status === 'COMPLETED' || batch?.status === 'FAILED';
  const failedItems = batch?.items.filter((item) => item.status === 'FAILED') ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-base font-semibold text-foreground">Generate documents</h2>
          <Button variant="ghost" className="h-8 w-8 p-0" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        <div className="space-y-4 p-4">
          {!batch ? (
            <>
              <label className="text-sm font-medium text-foreground">
                Template
                <select
                  value={templateId}
                  onChange={(event) => setTemplateId(event.target.value)}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                  disabled={loadingTemplates || launching}
                >
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-foreground">
                Output format
                <select
                  value={outputFormat}
                  onChange={(event) => setOutputFormat(event.target.value as MhdDocumentOutputFormat)}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                  disabled={launching}
                >
                  <option value="HTML">HTML</option>
                  <option value="PDF">PDF</option>
                  <option value="DOCX">DOCX</option>
                </select>
              </label>
              <p className="rounded-md border border-border bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
                This will generate{' '}
                {personIds.length === 1 ? '1 document' : `${personIds.length} documents`} for{' '}
                {personIds.length} selected people.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {complete
                ? 'Generation complete.'
                : `${batch.succeededCount + batch.failedCount} of ${batch.totalCount} processed, ${batch.failedCount} failed`}
            </p>
          )}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {complete ? (
            <>
              <p className="text-sm text-foreground">
                Succeeded: {batch?.succeededCount ?? 0}. Failed: {batch?.failedCount ?? 0}.
              </p>
              {failedItems.length ? (
                <ul className="list-disc space-y-1 pl-5 text-sm text-red-700">
                  {failedItems.map((item) => (
                    <li key={item.id}>
                      {item.personId}: {item.errorMessage ?? 'Generation failed.'}
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : null}
          <div className="flex justify-end gap-2">
            {complete ? (
              <Button onClick={onClose}>Close</Button>
            ) : (
              <>
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={() => void handleLaunch()}
                  disabled={launching || !templateId || !personIds.length}
                >
                  {launching ? 'Launching…' : 'Launch'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
