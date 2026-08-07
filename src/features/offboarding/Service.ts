import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { Json } from '@/types/database.types';
import { mhdActivityService } from '@/features/activities/Service';
import { mhdEsignatureService } from '@/features/esignature/Service';
import { mhdPropertyService } from '@/features/property/Service';
import type { MhdActivity, MhdUpdateActivityInput } from '@/features/activities/Types';
import type { MhdPropertyAssignment } from '@/features/property/Types';
import {
  mhdPollDocumentGenerationUntilGenerated,
  mhdRenderDocumentGeneration,
} from '@/features/documents/Service';
import type {
  MhdCreateOffboardingCaseInput,
  MhdCreateOffboardingItemInput,
  MhdGenerateExitDocumentInput,
  MhdGenerateExitDocumentResult,
  MhdOffboardingCase,
  MhdOffboardingCaseFilters,
  MhdOffboardingCaseRpcRow,
  MhdOffboardingChecklistItem,
  MhdOffboardingItemRpcRow,
  MhdOffboardingMutationRpcRow,
  MhdTransitionOffboardingCaseInput,
  MhdUpdateOffboardingCaseInput,
  MhdUpdateOffboardingItemInput,
} from './Types';
import { mhdFormatSeparationType } from './Types';

// supabaseClient.rpc is called directly rather than bound to a local alias.
// Binding instantiates the whole generated rpc overload set at once, which now
// exceeds the TypeScript instantiation depth limit (TS2589) at this schema size.
// A direct call instantiates only the matching overload, so argument and return
// types remain fully checked.

const DEFAULT_GENERATION_POLL_ATTEMPTS = 10;
const DEFAULT_GENERATION_POLL_INTERVAL_MS = 1500;

function trimmedOrUndefined(value?: string | null): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function filterValueOrUndefined(value?: string | null): string | undefined {
  if (!value || value === 'ALL') return undefined;
  return value;
}

function mapCaseRow(row: MhdOffboardingCaseRpcRow): MhdOffboardingCase {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdOffboardingCase['referenceId'],
    companyId: row.company_id,
    companyName: row.company_name,
    personId: row.person_id,
    personDisplayName: row.person_display_name,
    personPrimaryEmail: row.person_primary_email,
    initiatedByUserId: row.initiated_by_user_id,
    initiatorDisplayName: row.initiator_display_name,
    separationType: row.separation_type as MhdOffboardingCase['separationType'],
    status: row.status as MhdOffboardingCase['status'],
    separationDate: row.separation_date,
    lastWorkingDay: row.last_working_day,
    reasonSummary: row.reason_summary,
    eligibleForRehire: row.eligible_for_rehire,
    exitInterviewActivityId: row.exit_interview_activity_id,
    cancelReason: row.cancel_reason,
    completedAt: row.completed_at,
    requiredDoneCount: Number(row.required_done_count),
    requiredTotalCount: Number(row.required_total_count),
    outstandingPropertyCount: Number(row.outstanding_property_count),
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

function mapItemRow(row: MhdOffboardingItemRpcRow): MhdOffboardingChecklistItem {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdOffboardingChecklistItem['referenceId'],
    caseId: row.case_id,
    itemKey: row.item_key as MhdOffboardingChecklistItem['itemKey'],
    title: row.title,
    description: row.description,
    isRequired: row.is_required,
    status: row.status as MhdOffboardingChecklistItem['status'],
    statusReason: row.status_reason,
    assignedUserId: row.assigned_user_id,
    assigneeDisplayName: row.assignee_display_name,
    dueDate: row.due_date,
    linkedEntityType: row.linked_entity_type as MhdOffboardingChecklistItem['linkedEntityType'],
    linkedEntityId: row.linked_entity_id,
    linkedEsignatureStatus: row.linked_esignature_status,
    linkedDriveFileId: row.linked_drive_file_id,
    sortOrder: Number(row.sort_order),
    completedAt: row.completed_at,
    completedBy: row.completed_by,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

/**
 * Merge data for the seeded "Exit Acknowledgment" document template.
 * Keys mirror the template's merge fields (Field Inventory "Seeded Content":
 * person, company, separation type/dates, generated date) plus the case
 * reference id. These seven keys match the seeded 0030 template contract.
 */
function buildExitAcknowledgmentMergeData(
  offboardingCase: MhdOffboardingCase,
): Record<string, unknown> {
  return {
    person_name: offboardingCase.personDisplayName,
    company_name: offboardingCase.companyName,
    separation_type: mhdFormatSeparationType(offboardingCase.separationType),
    separation_date: offboardingCase.separationDate,
    last_working_day: offboardingCase.lastWorkingDay ?? '',
    case_reference_id: offboardingCase.referenceId,
    generated_date: new Date().toISOString().slice(0, 10),
  };
}

export const mhdOffboardingService = {
  // -------------------------------------------------------------------------
  // Offboarding cases
  // -------------------------------------------------------------------------

  async listCases(filters: MhdOffboardingCaseFilters): Promise<MhdOffboardingCase[]> {
    const { data, error } = await supabaseClient.rpc('mhd_list_offboarding_cases', {
      ...(filterValueOrUndefined(filters.companyId)
        ? { p_company_id: filterValueOrUndefined(filters.companyId) }
        : {}),
      ...(filterValueOrUndefined(filters.personId)
        ? { p_person_id: filterValueOrUndefined(filters.personId) }
        : {}),
      ...(filters.separationType !== 'ALL' ? { p_separation_type: filters.separationType } : {}),
      ...(filters.status !== 'ALL' ? { p_status: filters.status } : {}),
      ...(trimmedOrUndefined(filters.searchTerm)
        ? { p_search: trimmedOrUndefined(filters.searchTerm) }
        : {}),
      ...(trimmedOrUndefined(filters.from) ? { p_from: trimmedOrUndefined(filters.from) } : {}),
      ...(trimmedOrUndefined(filters.to) ? { p_to: trimmedOrUndefined(filters.to) } : {}),
    }).returns<MhdOffboardingCaseRpcRow[]>();

    if (error) {
      throw new Error(`Unable to load offboarding cases: ${error.message}`);
    }

    return ((data ?? []) as unknown as MhdOffboardingCaseRpcRow[]).map(mapCaseRow);
  },

  async getCaseById(caseId: string): Promise<MhdOffboardingCase> {
    const { data, error } = await supabaseClient.rpc('mhd_get_offboarding_case', {
      p_case_id: caseId,
    }).returns<MhdOffboardingCaseRpcRow[]>();

    if (error) {
      throw new Error(`Unable to load offboarding case: ${error.message}`);
    }

    const row = (data as unknown as MhdOffboardingCaseRpcRow[] | null)?.[0];
    if (!row) {
      throw new Error(`Offboarding case not found: ${caseId}`);
    }

    return mapCaseRow(row);
  },

  async createCase(input: MhdCreateOffboardingCaseInput): Promise<MhdOffboardingCase> {
    const { data, error } = await supabaseClient.rpc('mhd_create_offboarding_case', {
      p_company_id: input.companyId,
      p_person_id: input.personId,
      p_separation_type: input.separationType,
      p_separation_date: input.separationDate,
      ...(trimmedOrUndefined(input.lastWorkingDay)
        ? { p_last_working_day: trimmedOrUndefined(input.lastWorkingDay) }
        : {}),
      ...(trimmedOrUndefined(input.reasonSummary)
        ? { p_reason_summary: trimmedOrUndefined(input.reasonSummary) }
        : {}),
      ...(input.actorUserId ? { p_actor_user_id: input.actorUserId } : {}),
    }).returns<MhdOffboardingMutationRpcRow[]>();

    if (error) {
      throw new Error(`Unable to create offboarding case: ${error.message}`);
    }

    const row = (data as unknown as MhdOffboardingMutationRpcRow[] | null)?.[0];
    if (!row) {
      throw new Error('Unable to create offboarding case: no record returned.');
    }

    return mhdOffboardingService.getCaseById(row.id);
  },

  async updateCase(caseId: string, input: MhdUpdateOffboardingCaseInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_update_offboarding_case', {
      p_case_id: caseId,
      ...(input.separationType ? { p_separation_type: input.separationType } : {}),
      ...(trimmedOrUndefined(input.separationDate)
        ? { p_separation_date: trimmedOrUndefined(input.separationDate) }
        : {}),
      ...(trimmedOrUndefined(input.lastWorkingDay)
        ? { p_last_working_day: trimmedOrUndefined(input.lastWorkingDay) }
        : {}),
      ...(trimmedOrUndefined(input.reasonSummary)
        ? { p_reason_summary: trimmedOrUndefined(input.reasonSummary) }
        : {}),
      ...(input.eligibleForRehire !== undefined
        ? { p_eligible_for_rehire: input.eligibleForRehire }
        : {}),
      ...(input.exitInterviewActivityId
        ? { p_exit_interview_activity_id: input.exitInterviewActivityId }
        : {}),
      // gen:types omits null from p_eligible_for_rehire even though the RPC
      // accepts it at runtime to mean "explicitly cleared to unknown."
    } as never);

    if (error) {
      throw new Error(`Unable to update offboarding case: ${error.message}`);
    }
  },

  async transitionCase(caseId: string, input: MhdTransitionOffboardingCaseInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_transition_offboarding_case', {
      p_case_id: caseId,
      p_new_status: input.newStatus,
      ...(trimmedOrUndefined(input.cancelReason)
        ? { p_cancel_reason: trimmedOrUndefined(input.cancelReason) }
        : {}),
    });

    if (error) {
      throw new Error(`Unable to transition offboarding case: ${error.message}`);
    }
  },

  async deleteCase(caseId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_delete_offboarding_case', {
      p_case_id: caseId,
    });

    if (error) {
      throw new Error(`Unable to delete offboarding case: ${error.message}`);
    }
  },

  // -------------------------------------------------------------------------
  // Checklist items
  // -------------------------------------------------------------------------

  async listItems(caseId: string): Promise<MhdOffboardingChecklistItem[]> {
    const { data, error } = await supabaseClient.rpc('mhd_list_offboarding_items', {
      p_case_id: caseId,
    }).returns<MhdOffboardingItemRpcRow[]>();

    if (error) {
      throw new Error(`Unable to load offboarding checklist items: ${error.message}`);
    }

    return ((data ?? []) as unknown as MhdOffboardingItemRpcRow[]).map(mapItemRow);
  },

  async createItem(input: MhdCreateOffboardingItemInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_create_offboarding_item', {
      p_case_id: input.caseId,
      p_title: input.title.trim(),
      ...(trimmedOrUndefined(input.description)
        ? { p_description: trimmedOrUndefined(input.description) }
        : {}),
      ...(input.isRequired !== undefined ? { p_is_required: input.isRequired } : {}),
      ...(trimmedOrUndefined(input.dueDate)
        ? { p_due_date: trimmedOrUndefined(input.dueDate) }
        : {}),
      ...(input.assignedUserId ? { p_assigned_user_id: input.assignedUserId } : {}),
      ...(input.sortOrder !== undefined ? { p_sort_order: input.sortOrder } : {}),
    });

    if (error) {
      throw new Error(`Unable to create offboarding checklist item: ${error.message}`);
    }
  },

  async updateItem(itemId: string, input: MhdUpdateOffboardingItemInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_update_offboarding_item', {
      p_item_id: itemId,
      ...(trimmedOrUndefined(input.title) ? { p_title: trimmedOrUndefined(input.title) } : {}),
      ...(trimmedOrUndefined(input.description)
        ? { p_description: trimmedOrUndefined(input.description) }
        : {}),
      ...(input.isRequired !== undefined ? { p_is_required: input.isRequired } : {}),
      ...(trimmedOrUndefined(input.dueDate)
        ? { p_due_date: trimmedOrUndefined(input.dueDate) }
        : {}),
      ...(input.assignedUserId ? { p_assigned_user_id: input.assignedUserId } : {}),
      ...(input.sortOrder !== undefined ? { p_sort_order: input.sortOrder } : {}),
      ...(input.status ? { p_status: input.status } : {}),
      ...(trimmedOrUndefined(input.reason) ? { p_reason: trimmedOrUndefined(input.reason) } : {}),
      ...(input.linkedEntityType && input.linkedEntityId
        ? { p_linked_entity_type: input.linkedEntityType, p_linked_entity_id: input.linkedEntityId }
        : {}),
    });

    if (error) {
      throw new Error(`Unable to update offboarding checklist item: ${error.message}`);
    }
  },

  async deleteItem(itemId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_delete_offboarding_item', {
      p_item_id: itemId,
    });

    if (error) {
      throw new Error(`Unable to delete offboarding checklist item: ${error.message}`);
    }
  },

  // -------------------------------------------------------------------------
  // Outstanding property surface (rule 6 — sanctioned cross-service READ via
  // the published Property contract; the RPC-side gate re-checks server-side)
  // -------------------------------------------------------------------------

  async listOutstandingProperty(personId: string): Promise<MhdPropertyAssignment[]> {
    const assignments = await mhdPropertyService.listAssignments({ personId });
    return assignments.filter((assignment) => assignment.status === 'ISSUED');
  },

  // -------------------------------------------------------------------------
  // Exit interview surfaces (rule 8 — the exit interview IS an Activity,
  // consumed via the published Activities contract, zero schema)
  // -------------------------------------------------------------------------

  async listExitInterviewActivities(companyId: string, personId: string): Promise<MhdActivity[]> {
    return mhdActivityService.listActivities({
      companyId,
      personId,
      taskId: 'ALL',
      activityType: 'EXIT_INTERVIEW',
      status: 'ALL',
      searchTerm: '',
      from: '',
      to: '',
    });
  },

  async createExitInterviewActivity(
    input: Omit<MhdUpdateActivityInput, 'activityType'> & {
      activityType: 'EXIT_INTERVIEW' | 'MEETING';
    },
  ): Promise<MhdActivity> {
    if (input.activityType !== 'EXIT_INTERVIEW' && input.activityType !== 'MEETING') {
      throw new Error('The Offboarding module only creates EXIT_INTERVIEW or MEETING activities.');
    }

    return mhdActivityService.createActivity({
      ...input,
      activityType: input.activityType,
    });
  },

  async createAndLinkExitInterview(input: {
    caseId: string;
    title: string;
    activityDate: string;
  }): Promise<MhdActivity> {
    const offboardingCase = await mhdOffboardingService.getCaseById(input.caseId);
    const activity = await mhdOffboardingService.createExitInterviewActivity({
      companyId: offboardingCase.companyId,
      personId: offboardingCase.personId,
      activityType: 'EXIT_INTERVIEW',
      title: input.title,
      scheduledAt: `${input.activityDate}T12:00:00.000Z`,
      isConfidential: true,
    });
    await mhdOffboardingService.updateCase(input.caseId, {
      exitInterviewActivityId: activity.id,
    });
    return activity;
  },

  // -------------------------------------------------------------------------
  // Exit acknowledgment ceremony
  // -------------------------------------------------------------------------

  /**
   * Generate-and-send: the exit acknowledgment ceremony (Specification rule 7,
   * "TypeScript Service" section — the Performance finalize shape reused).
   * All steps go through published contracts:
   *
   *   0. Resolve the seeded global "Exit Acknowledgment" template via
   *      `mhd_get_exit_acknowledgment_template_id` when the caller did not
   *      pin one (published lookup RPC — never a direct table select).
   *   1. `mhd_request_document_generation` — entity_type 'OFFBOARDING_CASE',
   *      entity_id = case id, merge data built from the case row.
   *   2. Invoke the `render-document` edge function (`{ generation_id }`
   *      body) — it merges the template, uploads to Drive, and
   *      completes/fails the generation row.
   *   3. Poll the generation row until GENERATED (FAILED throws; a timeout
   *      throws a retryable message — nothing on the case has changed yet).
   *   4. Read `output_document_hash` (04.8 auto-hash stamp — approved); fall
   *      back to the caller-supplied manual hash when the stamp is absent.
   *   5. `mhdEsignatureService.createRequestFromGeneratedDocument` with the
   *      separation subject as the sole EXTERNAL signer (person primary
   *      email + display name from the case row), sequential order.
   *   6. Link the request as evidence on the seeded `exit_acknowledgment`
   *      item (`mhd_update_offboarding_item`, linked_entity_type
   *      'ESIGNATURE_REQUEST'). Item COMPLETED remains RPC-gated on the
   *      request reaching COMPLETED (rule 7) — this step only links.
   *
   * Steps are sequential and each failure surfaces a step-specific message so
   * the operator knows exactly where the ceremony stopped.
   */
  async generateExitDocumentForCase(
    input: MhdGenerateExitDocumentInput,
  ): Promise<MhdGenerateExitDocumentResult> {
    const offboardingCase = await mhdOffboardingService.getCaseById(input.caseId);

    if (offboardingCase.status !== 'ACTIVE') {
      throw new Error(
        `Exit documents can only be generated for ACTIVE cases (current status: ${offboardingCase.status}).`,
      );
    }

    input.onStep?.(0);
    // Step 0 — resolve the seeded global template when the caller did not pin one.
    let templateId = input.templateId;
    if (!templateId) {
      const { data: templateData, error: templateError } = await supabaseClient.rpc(
        'mhd_get_exit_acknowledgment_template_id',
      );
      if (templateError) {
        throw new Error(`Exit document step 0 (resolve template): ${templateError.message}`);
      }
      templateId = (templateData as string | null) ?? undefined;
      if (!templateId) {
        throw new Error(
          'Exit document step 0 (resolve template): the seeded "Exit Acknowledgment" template was not found.',
        );
      }
    }

    input.onStep?.(1);
    // Step 1 — request the document generation.
    const { data: generationData, error: generationError } = await supabaseClient
      .rpc('mhd_request_document_generation', {
        p_company_id: offboardingCase.companyId,
        p_template_id: templateId,
        p_entity_type: 'OFFBOARDING_CASE',
        p_entity_id: offboardingCase.id,
        p_merge_data: buildExitAcknowledgmentMergeData(offboardingCase) as Json,
        ...(input.actorUserId ? { p_actor_user_id: input.actorUserId } : {}),
      })
      .returns<Array<{ id: string; reference_id: string; status: string }>>();

    if (generationError) {
      throw new Error(
        `Exit document step 1 (request document generation) failed: ${generationError.message}`,
      );
    }

    const generationId = generationData?.[0]?.id;
    if (!generationId) {
      throw new Error(
        'Exit document step 1 (request document generation) failed: no generation id returned.',
      );
    }

    input.onStep?.(2);
    // Step 2 — render the document via the edge function.
    await mhdRenderDocumentGeneration(generationId, 'Exit document step 2 (render document)');

    input.onStep?.(3);
    // Step 3 — wait for the generation row to reach GENERATED.
    const generation = await mhdPollDocumentGenerationUntilGenerated(generationId, {
      attempts: input.pollAttempts ?? DEFAULT_GENERATION_POLL_ATTEMPTS,
      intervalMs: input.pollIntervalMs ?? DEFAULT_GENERATION_POLL_INTERVAL_MS,
      timeoutHint: 'Retry the generate action once rendering finishes.',
    });

    input.onStep?.(4);
    // Step 4 — resolve the document hash (04.8 auto-stamp, manual fallback).
    const documentHash =
      trimmedOrUndefined(generation.output_document_hash) ??
      trimmedOrUndefined(input.manualDocumentHash);

    if (!documentHash) {
      throw new Error(
        'Exit document step 4 (document hash) failed: the generation has no auto-stamped hash and no manual hash was provided.',
      );
    }

    input.onStep?.(5);
    // Step 5 — create the signature request with the subject as external signer.
    const externalEmail = trimmedOrUndefined(offboardingCase.personPrimaryEmail);
    if (!externalEmail) {
      throw new Error(
        'Exit document step 5 (create signature request) failed: the separating employee has no primary email on record.',
      );
    }

    let esignatureRequestId: string;
    let invitationErrors: string[];
    try {
      const result = await mhdEsignatureService.createRequestFromGeneratedDocument({
        companyId: offboardingCase.companyId,
        generationId,
        documentHash,
        signers: [
          {
            kind: 'external',
            externalEmail,
            externalName: offboardingCase.personDisplayName,
          },
        ],
        signingOrder: 'SEQUENTIAL',
        ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
      });
      esignatureRequestId = result.request.id;
      invitationErrors = result.invitationErrors;
    } catch (cause) {
      throw new Error(
        `Exit document step 5 (create signature request) failed: ${cause instanceof Error ? cause.message : String(cause)}`,
        { cause },
      );
    }

    input.onStep?.(6);
    // Step 6 — link the request as evidence on the seeded exit_acknowledgment item.
    try {
      const items = await mhdOffboardingService.listItems(offboardingCase.id);
      const exitAcknowledgmentItem = items.find((item) => item.itemKey === 'exit_acknowledgment');
      if (!exitAcknowledgmentItem) {
        throw new Error('the seeded exit_acknowledgment checklist item was not found on the case.');
      }

      await mhdOffboardingService.updateItem(exitAcknowledgmentItem.id, {
        linkedEntityType: 'ESIGNATURE_REQUEST',
        linkedEntityId: esignatureRequestId,
      });
    } catch (cause) {
      throw new Error(
        `Exit document step 6 (link checklist evidence) failed: ${cause instanceof Error ? cause.message : String(cause)}`,
        { cause },
      );
    }

    return {
      case: await mhdOffboardingService.getCaseById(offboardingCase.id),
      documentGenerationId: generationId,
      esignatureRequestId,
      documentHash,
      invitationErrors,
    };
  },
};
