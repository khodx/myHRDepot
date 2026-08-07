// Shared document-generation primitives. Before 2026-08-06 (audit finding
// M2/M6), the "invoke render-document, then poll document_generations until
// GENERATED/FAILED" sequence was independently reimplemented byte-for-byte
// in documents, conduct, case-documents, offboarding, and performance —
// five copies of the same edge-function-invoke call and the same poll loop.
// Everything genuinely identical across those five lives here; each
// feature's own ceremony (template resolution, signature-request creation,
// its onStep progress narrative) stays in that feature's Service.ts, since
// that orchestration is real feature-specific business logic, not
// duplicated plumbing.

import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { Database } from '@/types/database.types';

export const MHD_RENDER_DOCUMENT_FUNCTION_NAME = 'render-document';
export const MHD_DEFAULT_GENERATION_POLL_ATTEMPTS = 10;
export const MHD_DEFAULT_GENERATION_POLL_INTERVAL_MS = 1500;

interface MhdRenderDocumentResponse {
  success?: boolean;
  error?: string;
}

export type MhdDocumentGenerationPollRow = Pick<
  Database['public']['Tables']['document_generations']['Row'],
  'id' | 'status' | 'output_drive_file_id' | 'output_document_hash'
>;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Invokes the render-document edge function (HTML/DOCX rendering + Google
 * Drive upload — not something Postgres does) for an already-requested
 * generation. `stepLabel` lets each caller keep its own step-numbered error
 * text (e.g. "Corrective action step 2 (render document)") without
 * duplicating the invoke/error-handling itself.
 */
export async function mhdRenderDocumentGeneration(
  generationId: string,
  stepLabel = 'Render document',
): Promise<void> {
  const { data, error } = await supabaseClient.functions.invoke<MhdRenderDocumentResponse>(
    MHD_RENDER_DOCUMENT_FUNCTION_NAME,
    { body: { generation_id: generationId } },
  );

  if (error) {
    throw new Error(`${stepLabel} failed: ${error.message}`);
  }
  if (data?.success === false) {
    throw new Error(`${stepLabel} failed: ${data.error ?? 'unknown render error.'}`);
  }
}

/**
 * Polls `document_generations` by id until it reaches a terminal status
 * (GENERATED/FAILED) or the attempt budget is exhausted, returning the
 * columns callers that read `output_document_hash` need (the hash isn't
 * exposed by `mhd_get_document_generation`, hence the direct table select —
 * see documents/Service.ts's `getGeneration`/`generateAndPoll` for the RPC
 * variant used where the hash isn't needed).
 */
export async function mhdPollDocumentGenerationUntilGenerated(
  generationId: string,
  options?: {
    attempts?: number;
    intervalMs?: number;
    /** Appended to the timeout error, e.g. "Retry the issue action once rendering finishes." */
    timeoutHint?: string;
  },
): Promise<MhdDocumentGenerationPollRow> {
  const attempts = options?.attempts ?? MHD_DEFAULT_GENERATION_POLL_ATTEMPTS;
  const intervalMs = options?.intervalMs ?? MHD_DEFAULT_GENERATION_POLL_INTERVAL_MS;
  let lastStatus = 'PENDING';

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (attempt > 0 && intervalMs > 0) {
      await delay(intervalMs);
    }

    const { data, error } = await supabaseClient
      .from('document_generations')
      .select('id, status, output_drive_file_id, output_document_hash')
      .eq('id', generationId)
      .maybeSingle<MhdDocumentGenerationPollRow>();

    if (error) {
      throw new Error(`Unable to check document generation status: ${error.message}`);
    }
    if (!data) {
      throw new Error(`Document generation not found: ${generationId}`);
    }
    if (data.status === 'GENERATED') {
      return data;
    }
    if (data.status === 'FAILED') {
      throw new Error(
        'Document generation failed — see the generation record for the failure reason.',
      );
    }

    lastStatus = data.status;
  }

  throw new Error(
    `Document generation did not complete in time (last status: ${lastStatus}).` +
      (options?.timeoutHint ? ` ${options.timeoutHint}` : ''),
  );
}
