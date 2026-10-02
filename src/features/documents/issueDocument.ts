// The shared "generate and issue a document" ceremony.
//
// Conduct (corrective actions), Offboarding (exit acknowledgments) and Performance
// (review finalization) each carried their own copy of the same five steps:
//
//   1. request the generation          4. read the integrity hash
//   2. render it (edge function)       5. create the signature request
//   3. wait for it to be GENERATED
//
// Everything identical lives here. What is genuinely each module's own business stays in
// that module: resolving which template to use BEFORE this runs (step 0), and linking the
// result onto its own record AFTER it (step 6 and beyond). The caller reports those steps
// itself; this function reports 1-5 through `onStep` so a progress narrative still works.
//
// The signature request is created through an injected function rather than by importing
// the e-signature service: documents -> esignature -> tasks -> documents would be an
// import cycle, and a document that needs no signature should not depend on it at all.

import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { Json } from '@/types/database.types';
import {
  MHD_DEFAULT_GENERATION_POLL_ATTEMPTS,
  MHD_DEFAULT_GENERATION_POLL_INTERVAL_MS,
  mhdPollDocumentGenerationUntilGenerated,
  mhdRenderDocumentGeneration,
} from './generationEngine';

export interface MhdIssueDocumentSignatureResult {
  requestId: string;
  invitationErrors: string[];
}

export interface MhdIssueDocumentInput {
  /** Prefix for step-specific error text, e.g. "Corrective action" -> "Corrective action step 2 (render document) failed". */
  label: string;
  /** Appended to the timeout error, e.g. "Retry the issue action once rendering finishes." */
  retryHint: string;
  companyId: string;
  templateId: string;
  entityType: string;
  entityId: string;
  mergeData: Json;
  actorUserId?: string | null;
  /** Used only when the generation carries no auto-stamped hash. */
  manualDocumentHash?: string | null;
  pollAttempts?: number;
  pollIntervalMs?: number;
  /** Called as steps 1-5 begin. The caller reports its own step 0 and any step after 5. */
  onStep?: (step: number) => void;
  /**
   * Present when the document must be signed. It receives the generated document and its
   * hash and returns the created request. Omit for a document that is only generated.
   */
  signing?: {
    createRequest: (generated: {
      generationId: string;
      documentHash: string;
    }) => Promise<MhdIssueDocumentSignatureResult>;
  } | null;
}

export interface MhdIssueDocumentResult {
  generationId: string;
  /** Null only for an unsigned document whose generation carries no hash. */
  documentHash: string | null;
  esignatureRequestId: string | null;
  invitationErrors: string[];
}

/** The result of a ceremony that included a signature request: the hash and request always exist. */
export type MhdIssueSignedDocumentResult = MhdIssueDocumentResult & {
  documentHash: string;
  esignatureRequestId: string;
};

function trimmedOrUndefined(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export async function mhdIssueGeneratedDocument(
  input: MhdIssueDocumentInput & { signing: NonNullable<MhdIssueDocumentInput['signing']> },
): Promise<MhdIssueSignedDocumentResult>;
export async function mhdIssueGeneratedDocument(
  input: MhdIssueDocumentInput,
): Promise<MhdIssueDocumentResult>;
export async function mhdIssueGeneratedDocument(
  input: MhdIssueDocumentInput,
): Promise<MhdIssueDocumentResult> {
  const { label } = input;

  input.onStep?.(1);
  const { data: generationData, error: generationError } = await supabaseClient
    .rpc('mhd_request_document_generation', {
      p_company_id: input.companyId,
      p_template_id: input.templateId,
      p_entity_type: input.entityType,
      p_entity_id: input.entityId,
      p_merge_data: input.mergeData,
      ...(input.actorUserId ? { p_actor_user_id: input.actorUserId } : {}),
    })
    .returns<Array<{ id: string; reference_id: string; status: string }>>();

  if (generationError) {
    throw new Error(`${label} step 1 (request document generation) failed: ${generationError.message}`);
  }

  const generationId = generationData?.[0]?.id;
  if (!generationId) {
    throw new Error(`${label} step 1 (request document generation) failed: no generation id returned.`);
  }

  input.onStep?.(2);
  await mhdRenderDocumentGeneration(generationId, `${label} step 2 (render document)`);

  input.onStep?.(3);
  const generation = await mhdPollDocumentGenerationUntilGenerated(generationId, {
    attempts: input.pollAttempts ?? MHD_DEFAULT_GENERATION_POLL_ATTEMPTS,
    intervalMs: input.pollIntervalMs ?? MHD_DEFAULT_GENERATION_POLL_INTERVAL_MS,
    timeoutHint: input.retryHint,
  });

  const stampedHash = trimmedOrUndefined(generation.output_document_hash);

  if (!input.signing) {
    return {
      generationId,
      documentHash: stampedHash ?? null,
      esignatureRequestId: null,
      invitationErrors: [],
    };
  }

  input.onStep?.(4);
  const documentHash = stampedHash ?? trimmedOrUndefined(input.manualDocumentHash);
  if (!documentHash) {
    throw new Error(
      `${label} step 4 (document hash) failed: the generation has no auto-stamped hash and no manual hash was provided.`,
    );
  }

  input.onStep?.(5);
  try {
    const result = await input.signing.createRequest({ generationId, documentHash });
    return {
      generationId,
      documentHash,
      esignatureRequestId: result.requestId,
      invitationErrors: result.invitationErrors,
    };
  } catch (cause) {
    throw new Error(
      `${label} step 5 (create signature request) failed: ${cause instanceof Error ? cause.message : String(cause)}`,
      { cause },
    );
  }
}
