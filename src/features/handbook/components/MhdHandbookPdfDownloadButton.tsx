import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdDocumentGenerationActions,
  useMhdDocumentTemplateIdByKey,
} from '@/features/documents/Hook';
import { MHD_HANDBOOK_EXPORT_ENTITY_TYPE, MHD_HANDBOOK_EXPORT_TEMPLATE_KEY } from '../Types';

interface Props {
  /** The published version to render. */
  versionId: string;
}

/**
 * Lets an employee keep a PDF copy of a handbook version assigned to them. Word is
 * deliberately not offered here, and the server would refuse it anyway: only handbook
 * administrators may request the Word format, and only an administrator or an employee
 * assigned this exact version may request a PDF
 * (`mhd_request_document_generation` / `mhd_handbook_assert_export_allowed`).
 *
 * The file opens through the platform's usual Drive link; whether a given person can
 * open it is governed by the company's Drive sharing, as for every other generated
 * document in the app.
 */
export function MhdHandbookPdfDownloadButton({ versionId }: Props) {
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? null;
  const template = useMhdDocumentTemplateIdByKey(MHD_HANDBOOK_EXPORT_TEMPLATE_KEY, companyId);
  const actor = useMemo(
    () => (profile?.userId ? { actorUserId: profile.userId } : null),
    [profile],
  );
  const { generate } = useMhdDocumentGenerationActions(
    MHD_HANDBOOK_EXPORT_ENTITY_TYPE,
    versionId,
    actor,
  );
  const [fileId, setFileId] = useState<string | null>(null);
  const [stillPreparing, setStillPreparing] = useState(false);

  async function handleGenerate() {
    if (!template.data || !companyId) return;
    setStillPreparing(false);
    const generation = await generate.mutateAsync({
      templateId: template.data,
      companyId,
      entityType: MHD_HANDBOOK_EXPORT_ENTITY_TYPE,
      entityId: versionId,
      mergeData: {},
      outputFormat: 'PDF',
    });
    if (generation.output_drive_file_id) {
      setFileId(generation.output_drive_file_id);
    } else {
      // The long poll budget ran out before the file finished; say so rather than
      // pretending it failed or succeeded.
      setStillPreparing(true);
    }
  }

  if (template.isSuccess && !template.data) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {fileId ? (
        <a
          href={`https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view`}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-accent hover:text-accent-hover"
        >
          Open PDF
        </a>
      ) : (
        <Button
          variant="secondary"
          disabled={!template.data || generate.isPending}
          onClick={() => void handleGenerate()}
        >
          {generate.isPending ? 'Preparing PDF…' : 'Download PDF'}
        </Button>
      )}
      {stillPreparing ? (
        <p className="text-xs text-muted-foreground">
          The PDF is still being prepared. Try again in a moment.
        </p>
      ) : null}
      {generate.isError ? (
        <p className="text-xs text-rose-600" role="alert">
          {generate.error instanceof Error ? generate.error.message : 'Could not prepare the PDF.'}
        </p>
      ) : null}
    </div>
  );
}
