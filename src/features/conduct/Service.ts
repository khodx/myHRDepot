import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { Database, Json } from '@/types/database.types';
import { mhdEsignatureService } from '@/features/esignature/Service';
import { mhdPersonService } from '@/features/people/Service';
import type {
  MhdConductAction,
  MhdConductActionRpcRow,
  MhdConductCase,
  MhdConductCaseFilters,
  MhdConductCaseRpcRow,
  MhdConductMutationRpcRow,
  MhdCreateConductActionInput,
  MhdCreateConductCaseInput,
  MhdIssueConductActionInput,
  MhdIssueConductActionResult,
  MhdRecordConductOutcomeInput,
  MhdTransitionConductCaseInput,
  MhdUpdateConductActionInput,
} from './Types';
import { mhdFormatConductSeverity, mhdToNumber } from './Types';

const conductRpc = supabaseClient.rpc.bind(supabaseClient);

// Edge function that performs the actual merge + Drive upload for a requested
// generation (05 - Integration & Deployment / render-document). Body contract:
// `{ generation_id: string }`; response `{ success, drive_file_id, file_name }`
// or `{ success: false, error }`. Reused wholesale from the Offboarding ceremony.
const RENDER_DOCUMENT_FUNCTION_NAME = 'render-document';

const DEFAULT_GENERATION_POLL_ATTEMPTS = 10;
const DEFAULT_GENERATION_POLL_INTERVAL_MS = 1500;

interface RenderDocumentResponse {
  success?: boolean;
  error?: string;
}

type DocumentGenerationPollRow = Pick<
  Database['public']['Tables']['document_generations']['Row'],
  'id' | 'status' | 'output_drive_file_id' | 'output_document_hash'
>;

function trimmedOrUndefined(value?: string | null): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function filterValueOrUndefined(value?: string | null): string | undefined {
  if (!value || value === 'ALL') return undefined;
  return value;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mapCaseRow(row: MhdConductCaseRpcRow): MhdConductCase {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdConductCase['referenceId'],
    personId: row.person_id,
    personDisplayName: row.person_display_name,
    category: row.category as MhdConductCase['category'],
    status: row.status as MhdConductCase['status'],
    actionCount: mhdToNumber(row.action_count),
    terminalCount: mhdToNumber(row.terminal_count),
    createdAt: row.created_at,
  };
}

function mapActionRow(row: MhdConductActionRpcRow): MhdConductAction {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdConductAction['referenceId'],
    severity: row.severity as MhdConductAction['severity'],
    status: row.status as MhdConductAction['status'],
    actionSummary: row.action_summary,
    requiresDocument: row.requires_document,
    esignatureRequestId: row.esignature_request_id,
    esignatureStatus: row.esignature_status,
    acknowledgmentType: row.acknowledgment_type as MhdConductAction['acknowledgmentType'],
    outcomeReason: row.outcome_reason,
    issuedAt: row.issued_at,
    sortOrder: mhdToNumber(row.sort_order),
  };
}

/**
 * Merge data for the seeded corrective-action document template. Keys mirror
 * the template's merge fields (subject, company, severity label, the action
 * narrative, the case reference, and the generated date). The template text
 * itself states that a signature records RECEIPT, not agreement — the receipt-
 * not-agreement rule lives in both the document and the UI.
 * TODO(build-wave): verify token names against the seeded template text in
 * Database.sql before ship.
 */
function buildCorrectiveActionMergeData(
  input: MhdIssueConductActionInput,
  subjectName: string,
): Record<string, unknown> {
  return {
    person_name: subjectName,
    company_id: input.companyId,
    severity: mhdFormatConductSeverity(input.severity),
    action_summary: input.actionSummary ?? '',
    case_reference_id: input.caseReferenceId ?? '',
    generated_date: new Date().toISOString().slice(0, 10),
  };
}

async function fetchGenerationUntilGenerated(
  generationId: string,
  attempts: number,
  intervalMs: number,
): Promise<DocumentGenerationPollRow> {
  let lastStatus = 'PENDING';

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (attempt > 0 && intervalMs > 0) {
      await delay(intervalMs);
    }

    const { data, error } = await supabaseClient
      .from('document_generations')
      .select('id, status, output_drive_file_id, output_document_hash')
      .eq('id', generationId)
      .maybeSingle<DocumentGenerationPollRow>();

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
      throw new Error('Document generation failed — see the generation record for the failure reason.');
    }

    lastStatus = data.status;
  }

  throw new Error(
    `Document generation did not complete in time (last status: ${lastStatus}). Retry the issue action once rendering finishes.`,
  );
}

export const mhdConductService = {
  // -------------------------------------------------------------------------
  // Conduct cases
  // -------------------------------------------------------------------------

  async listCases(filters: MhdConductCaseFilters): Promise<MhdConductCase[]> {
    const { data, error } = await conductRpc('mhd_conduct_list_cases', {
      p_company_id: filters.companyId,
      ...(filterValueOrUndefined(filters.personId) ? { p_person_id: filterValueOrUndefined(filters.personId) } : {}),
      ...(filters.status !== 'ALL' ? { p_status: filters.status } : {}),
      ...(filters.category !== 'ALL' ? { p_category: filters.category } : {}),
    }).returns<MhdConductCaseRpcRow[]>();

    if (error) {
      throw new Error(`Unable to load conduct cases: ${error.message}`);
    }

    const searchTerm = trimmedOrUndefined(filters.searchTerm)?.toLowerCase();
    const rows = ((data ?? []) as unknown as MhdConductCaseRpcRow[]).map(mapCaseRow);

    // There is no server-side search parameter on the list RPC; the board's free-text
    // filter is applied client-side over the person name and reference id.
    if (!searchTerm) return rows;
    return rows.filter(
      (row) =>
        row.personDisplayName.toLowerCase().includes(searchTerm) ||
        row.referenceId.toLowerCase().includes(searchTerm),
    );
  },

  /**
   * Get a single case. The migration exposes no dedicated get RPC — the case
   * header is read from `mhd_conduct_list_cases` and narrowed by id. The company
   * is required because the list RPC is company-scoped (its RLS/visibility gate
   * runs per row regardless).
   */
  async getCase(companyId: string, caseId: string): Promise<MhdConductCase> {
    const cases = await mhdConductService.listCases({
      companyId,
      personId: 'ALL',
      category: 'ALL',
      status: 'ALL',
      searchTerm: '',
    });

    const found = cases.find((conductCase) => conductCase.id === caseId);
    if (!found) {
      throw new Error(`Conduct case not found: ${caseId}`);
    }

    return found;
  },

  async createCase(input: MhdCreateConductCaseInput): Promise<MhdConductMutationRpcRow> {
    const { data, error } = await conductRpc('mhd_conduct_create_case', {
      p_company_id: input.companyId,
      p_person_id: input.personId,
      p_category: input.category,
      ...(trimmedOrUndefined(input.concernSummary) ? { p_concern_summary: trimmedOrUndefined(input.concernSummary) } : {}),
    }).returns<MhdConductMutationRpcRow[]>();

    if (error) {
      throw new Error(`Unable to open conduct case: ${error.message}`);
    }

    const row = (data as unknown as MhdConductMutationRpcRow[] | null)?.[0];
    if (!row) {
      throw new Error('Unable to open conduct case: no record returned.');
    }

    return row;
  },

  async transitionCase(caseId: string, input: MhdTransitionConductCaseInput): Promise<void> {
    const { error } = await conductRpc('mhd_conduct_transition_case', {
      p_case_id: caseId,
      p_new_status: input.newStatus,
      ...(trimmedOrUndefined(input.rescindReason) ? { p_rescind_reason: trimmedOrUndefined(input.rescindReason) } : {}),
    });

    if (error) {
      throw new Error(`Unable to transition conduct case: ${error.message}`);
    }
  },

  /**
   * Open a case from a T&A threshold crossing (rule 6). The reciprocal write to
   * `attendance_threshold_events.linked_conduct_case_id` happens inside the RPC
   * through T&A's own contract — never a direct table write from here.
   */
  async openFromThreshold(thresholdEventId: string): Promise<MhdConductMutationRpcRow> {
    const { data, error } = await conductRpc('mhd_conduct_open_from_threshold', {
      p_threshold_event_id: thresholdEventId,
    }).returns<MhdConductMutationRpcRow[]>();

    if (error) {
      throw new Error(`Unable to open conduct case from threshold event: ${error.message}`);
    }

    const row = (data as unknown as MhdConductMutationRpcRow[] | null)?.[0];
    if (!row) {
      throw new Error('Unable to open conduct case from threshold event: no record returned.');
    }

    return row;
  },

  // -------------------------------------------------------------------------
  // Corrective actions
  // -------------------------------------------------------------------------

  async listActions(caseId: string): Promise<MhdConductAction[]> {
    const { data, error } = await conductRpc('mhd_conduct_list_actions', {
      p_case_id: caseId,
    }).returns<MhdConductActionRpcRow[]>();

    if (error) {
      throw new Error(`Unable to load conduct actions: ${error.message}`);
    }

    return ((data ?? []) as unknown as MhdConductActionRpcRow[]).map(mapActionRow);
  },

  async createAction(input: MhdCreateConductActionInput): Promise<MhdConductMutationRpcRow> {
    const { data, error } = await conductRpc('mhd_conduct_create_action', {
      p_case_id: input.caseId,
      p_severity: input.severity,
      ...(trimmedOrUndefined(input.actionSummary) ? { p_action_summary: trimmedOrUndefined(input.actionSummary) } : {}),
      ...(input.requiresDocument !== undefined ? { p_requires_document: input.requiresDocument } : {}),
    }).returns<MhdConductMutationRpcRow[]>();

    if (error) {
      throw new Error(`Unable to create conduct action: ${error.message}`);
    }

    const row = (data as unknown as MhdConductMutationRpcRow[] | null)?.[0];
    if (!row) {
      throw new Error('Unable to create conduct action: no record returned.');
    }

    return row;
  },

  async updateAction(actionId: string, input: MhdUpdateConductActionInput): Promise<void> {
    const { error } = await conductRpc('mhd_conduct_update_action', {
      p_action_id: actionId,
      ...(input.severity ? { p_severity: input.severity } : {}),
      ...(trimmedOrUndefined(input.actionSummary) ? { p_action_summary: trimmedOrUndefined(input.actionSummary) } : {}),
    });

    if (error) {
      throw new Error(`Unable to update conduct action: ${error.message}`);
    }
  },

  /**
   * Record the terminal outcome of an ISSUED action. ACKNOWLEDGED means
   * acknowledged as RECEIVED — the RPC stamps `acknowledgment_type='RECEIPT'`
   * and gates it on the linked signature request completing. REFUSED and WAIVED
   * each require a reason (REFUSED also accepts a witness) — refusal is a
   * first-class, complete record, not a stuck ISSUED state.
   */
  async recordOutcome(actionId: string, input: MhdRecordConductOutcomeInput): Promise<void> {
    const { error } = await conductRpc('mhd_conduct_record_outcome', {
      p_action_id: actionId,
      p_outcome: input.outcome,
      ...(trimmedOrUndefined(input.reason) ? { p_reason: trimmedOrUndefined(input.reason) } : {}),
      ...(input.witnessUserId ? { p_witness_user_id: input.witnessUserId } : {}),
    });

    if (error) {
      throw new Error(`Unable to record conduct outcome: ${error.message}`);
    }
  },

  async deleteAction(actionId: string): Promise<void> {
    const { error } = await conductRpc('mhd_conduct_delete_action', {
      p_action_id: actionId,
    });

    if (error) {
      throw new Error(`Unable to delete conduct action: ${error.message}`);
    }
  },

  // -------------------------------------------------------------------------
  // Corrective-action document ceremony (the issue-action flow)
  //
  // Reused not reinvented (rule 4): resolve-template-by-key -> request-
  // generation -> render -> poll -> verify hash -> create-signature-request ->
  // issue_action. Exactly the Offboarding exit-document shape, with the subject
  // as the sole EXTERNAL signer. The document is routed for the employee's
  // *acknowledgment of receipt* — never their agreement.
  //
  // NOTE on the template resolver: `mhd_get_corrective_action_template_id` is a
  // security-definer server function (severity -> key -> template). It is
  // consumed only as an internal step of this ceremony and is deliberately NOT
  // exposed as a standalone service method.
  // -------------------------------------------------------------------------

  async issueActionWithCeremony(
    input: MhdIssueConductActionInput,
  ): Promise<MhdIssueConductActionResult> {
    // The bare (no-document) path: nothing to render or sign, so issue directly.
    // An action still transitions DRAFT -> ISSUED and the subject is notified.
    if (!input.requiresDocument) {
      input.onStep?.(0);
      const { error } = await conductRpc('mhd_conduct_issue_action', {
        p_action_id: input.actionId,
      });
      if (error) {
        throw new Error(`Issue action (no document) failed: ${error.message}`);
      }
      return {
        actionId: input.actionId,
        documentGenerationId: null,
        esignatureRequestId: null,
        documentHash: null,
        invitationErrors: [],
      };
    }

    // The subject is the external signer; the document routes to their primary
    // email. Read the person through the People contract (the conduct RPCs do
    // not surface the email).
    const subject = await mhdPersonService.getPersonById(input.personId);
    const externalEmail = trimmedOrUndefined(subject.primaryEmail);
    if (!externalEmail) {
      throw new Error(
        'Corrective action step 0 (subject email): the subject employee has no primary email on record; the acknowledgment cannot be routed for signature.',
      );
    }

    input.onStep?.(0);
    // Step 0 — resolve the seeded corrective-action template by severity (server
    // key resolver) unless the caller pinned a template.
    let templateId = input.templateId;
    if (!templateId) {
      const { data: templateData, error: templateError } = await supabaseClient.rpc(
        'mhd_get_corrective_action_template_id',
        { p_severity: input.severity },
      );
      if (templateError) {
        throw new Error(`Corrective action step 0 (resolve template): ${templateError.message}`);
      }
      templateId = (templateData as string | null) ?? undefined;
      if (!templateId) {
        throw new Error(
          `Corrective action step 0 (resolve template): no seeded template resolved for severity ${input.severity}.`,
        );
      }
    }

    input.onStep?.(1);
    // Step 1 — request the document generation (entity_type 'CONDUCT_ACTION').
    const { data: generationData, error: generationError } = await supabaseClient
      .rpc('mhd_request_document_generation', {
        p_company_id: input.companyId,
        p_template_id: templateId,
        p_entity_type: 'CONDUCT_ACTION',
        p_entity_id: input.actionId,
        p_merge_data: buildCorrectiveActionMergeData(input, subject.displayName) as Json,
        ...(input.actorUserId ? { p_actor_user_id: input.actorUserId } : {}),
      })
      .returns<Array<{ id: string; reference_id: string; status: string }>>();

    if (generationError) {
      throw new Error(`Corrective action step 1 (request document generation) failed: ${generationError.message}`);
    }

    const generationId = generationData?.[0]?.id;
    if (!generationId) {
      throw new Error('Corrective action step 1 (request document generation) failed: no generation id returned.');
    }

    input.onStep?.(2);
    // Step 2 — render the document via the edge function.
    const { data: renderData, error: renderError } =
      await supabaseClient.functions.invoke<RenderDocumentResponse>(RENDER_DOCUMENT_FUNCTION_NAME, {
        body: { generation_id: generationId },
      });

    if (renderError) {
      throw new Error(`Corrective action step 2 (render document) failed: ${renderError.message}`);
    }
    if (renderData?.success === false) {
      throw new Error(`Corrective action step 2 (render document) failed: ${renderData.error ?? 'unknown render error.'}`);
    }

    input.onStep?.(3);
    // Step 3 — wait for the generation row to reach GENERATED.
    const generation = await fetchGenerationUntilGenerated(
      generationId,
      input.pollAttempts ?? DEFAULT_GENERATION_POLL_ATTEMPTS,
      input.pollIntervalMs ?? DEFAULT_GENERATION_POLL_INTERVAL_MS,
    );

    input.onStep?.(4);
    // Step 4 — resolve the document hash (04.8 auto-stamp, manual fallback).
    const documentHash =
      trimmedOrUndefined(generation.output_document_hash) ?? trimmedOrUndefined(input.manualDocumentHash);

    if (!documentHash) {
      throw new Error(
        'Corrective action step 4 (document hash) failed: the generation has no auto-stamped hash and no manual hash was provided.',
      );
    }

    input.onStep?.(5);
    // Step 5 — create the signature request with the subject as external signer.
    let esignatureRequestId: string;
    let invitationErrors: string[];
    try {
      const result = await mhdEsignatureService.createRequestFromGeneratedDocument({
        companyId: input.companyId,
        generationId,
        documentHash,
        signers: [
          {
            kind: 'external',
            externalEmail,
            externalName: subject.displayName,
          },
        ],
        signingOrder: 'SEQUENTIAL',
        ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
      });
      esignatureRequestId = result.request.id;
      invitationErrors = result.invitationErrors;
    } catch (cause) {
      throw new Error(
        `Corrective action step 5 (create signature request) failed: ${cause instanceof Error ? cause.message : String(cause)}`, { cause },
      );
    }

    input.onStep?.(6);
    // Step 6 — issue the action with the soft links. This is the RPC that moves
    // DRAFT -> ISSUED, stamps the document + signature request, and notifies the
    // subject to acknowledge receipt. ACKNOWLEDGED stays gated on the request
    // completing (recordOutcome enforces it).
    const { error: issueError } = await conductRpc('mhd_conduct_issue_action', {
      p_action_id: input.actionId,
      p_document_generation_id: generationId,
      p_esignature_request_id: esignatureRequestId,
    });
    if (issueError) {
      throw new Error(`Corrective action step 6 (issue action) failed: ${issueError.message}`);
    }

    return {
      actionId: input.actionId,
      documentGenerationId: generationId,
      esignatureRequestId,
      documentHash,
      invitationErrors,
    };
  },
};
