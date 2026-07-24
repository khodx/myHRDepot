import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { Database, Json } from '@/types/database.types';
import { mhdActivityService } from '@/features/activities/Service';
import { mhdEsignatureService } from '@/features/esignature/Service';
import type { MhdActivity, MhdUpdateActivityInput } from '@/features/activities/Types';
import type { MhdEsignatureSignerInput } from '@/features/esignature/Types';
import type {
  MhdCoachingPlan,
  MhdCoachingPlanFilters,
  MhdCoachingPlanItem,
  MhdCoachingPlanItemRpcRow,
  MhdCoachingPlanRpcRow,
  MhdCreateCoachingPlanInput,
  MhdCreateCoachingPlanItemInput,
  MhdCreatePerformanceReviewInput,
  MhdFinalizeReviewForSignatureInput,
  MhdFinalizeReviewForSignatureResult,
  MhdLinkReviewDocumentsInput,
  MhdPerformanceMutationRpcRow,
  MhdPerformanceReview,
  MhdPerformanceReviewFilters,
  MhdPerformanceReviewRpcRow,
  MhdReviewSignerInput,
  MhdTransitionCoachingPlanInput,
  MhdTransitionPerformanceReviewInput,
  MhdUpdateCoachingPlanInput,
  MhdUpdateCoachingPlanItemInput,
  MhdUpdatePerformanceReviewInput,
} from './Types';
import { mhdFormatPerformanceReviewType } from './Types';

const performanceRpc = supabaseClient.rpc.bind(supabaseClient);

// Edge function that performs the actual merge + Drive upload for a requested
// generation (05 - Integration & Deployment / render-document). Body contract:
// `{ generation_id: string }`; response `{ success, drive_file_id, file_name }`
// or `{ success: false, error }`.
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

function mapSignerInput(signer: MhdReviewSignerInput): MhdEsignatureSignerInput {
  return signer.kind === 'internal'
    ? { kind: 'internal', userId: signer.userId }
    : { kind: 'external', externalEmail: signer.externalEmail, externalName: signer.externalName };
}

function mapReviewRow(row: MhdPerformanceReviewRpcRow): MhdPerformanceReview {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdPerformanceReview['referenceId'],
    companyId: row.company_id,
    companyName: row.company_name,
    personId: row.person_id,
    personDisplayName: row.person_display_name,
    reviewerUserId: row.reviewer_user_id,
    reviewerDisplayName: row.reviewer_display_name,
    reviewType: row.review_type as MhdPerformanceReview['reviewType'],
    status: row.status as MhdPerformanceReview['status'],
    reviewPeriodStart: row.review_period_start,
    reviewPeriodEnd: row.review_period_end,
    dueDate: row.due_date,
    overallRating: row.overall_rating,
    strengthsSummary: row.strengths_summary,
    improvementSummary: row.improvement_summary,
    goalsSummary: row.goals_summary,
    reviewerComments: row.reviewer_comments,
    employeeComments: row.employee_comments,
    reviewActivityId: row.review_activity_id,
    reviewActivityTitle: row.review_activity_id,
    documentGenerationId: row.document_generation_id,
    documentGenerationReferenceId: row.document_generation_reference_id,
    documentGenerationStatus: row.document_generation_status,
    esignatureRequestId: row.esignature_request_id,
    esignatureRequestReferenceId: row.esignature_request_reference_id,
    esignatureRequestStatus: row.esignature_request_status,
    signatureStatus: row.esignature_request_status,
    acknowledgedAt: row.acknowledged_at,
    waiverReason: row.waiver_reason,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

function mapCoachingPlanRow(row: MhdCoachingPlanRpcRow): MhdCoachingPlan {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdCoachingPlan['referenceId'],
    companyId: row.company_id,
    companyName: row.company_name,
    personId: row.person_id,
    personDisplayName: row.person_display_name,
    coachUserId: row.coach_user_id,
    coachDisplayName: row.coach_display_name,
    title: row.title,
    objective: row.objective,
    startDate: row.start_date,
    targetDate: row.target_date,
    status: row.status as MhdCoachingPlan['status'],
    outcomeSummary: row.outcome_summary,
    sourceReviewId: row.source_review_id,
    sourceReviewReferenceId: row.source_review_reference_id,
    itemTotalCount: Number(row.item_total_count),
    itemDoneCount: Number(row.item_done_count),
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

function mapCoachingPlanItemRow(row: MhdCoachingPlanItemRpcRow): MhdCoachingPlanItem {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdCoachingPlanItem['referenceId'],
    planId: row.plan_id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    status: row.status as MhdCoachingPlanItem['status'],
    activityId: row.activity_id,
    activityReferenceId: row.activity_reference_id,
    activityStatus: row.activity_status,
    activityTitle: row.activity_reference_id,
    sortOrder: Number(row.sort_order),
    completedAt: row.completed_at,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

/**
 * Merge data for the seeded "Performance Review" document template.
 * Keys mirror the template's merge fields exactly (Database.sql seeded
 * content: person_name, company_name, review_type, review_reference_id,
 * reviewer_name, review_period_start/end, overall_rating, the five content
 * sections, generated_date).
 */
function buildReviewMergeData(review: MhdPerformanceReview): Record<string, unknown> {
  return {
    person_name: review.personDisplayName,
    company_name: review.companyName,
    review_type: mhdFormatPerformanceReviewType(review.reviewType),
    review_reference_id: review.referenceId,
    reviewer_name: review.reviewerDisplayName,
    review_period_start: review.reviewPeriodStart,
    review_period_end: review.reviewPeriodEnd,
    overall_rating: review.overallRating ?? '',
    strengths_summary: review.strengthsSummary ?? '',
    improvement_summary: review.improvementSummary ?? '',
    goals_summary: review.goalsSummary ?? '',
    reviewer_comments: review.reviewerComments ?? '',
    employee_comments: review.employeeComments ?? '',
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
      throw new Error(
        'Document generation failed — see the generation record for the failure reason.',
      );
    }

    lastStatus = data.status;
  }

  throw new Error(
    `Document generation did not complete in time (last status: ${lastStatus}). Retry the finalize action once rendering finishes.`,
  );
}

export const mhdPerformanceService = {
  // -------------------------------------------------------------------------
  // Performance reviews
  // -------------------------------------------------------------------------

  async listReviews(filters: MhdPerformanceReviewFilters): Promise<MhdPerformanceReview[]> {
    const { data, error } = await performanceRpc('mhd_list_performance_reviews', {
      p_company_id: filters.companyId,
      ...(filterValueOrUndefined(filters.personId)
        ? { p_person_id: filterValueOrUndefined(filters.personId) }
        : {}),
      ...(filterValueOrUndefined(filters.reviewerUserId)
        ? { p_reviewer_user_id: filterValueOrUndefined(filters.reviewerUserId) }
        : {}),
      ...(filters.reviewType !== 'ALL' ? { p_review_type: filters.reviewType } : {}),
      ...(filters.status !== 'ALL' ? { p_status: filters.status } : {}),
      ...(trimmedOrUndefined(filters.searchTerm)
        ? { p_search_term: trimmedOrUndefined(filters.searchTerm) }
        : {}),
      ...(trimmedOrUndefined(filters.dueFrom)
        ? { p_due_from: trimmedOrUndefined(filters.dueFrom) }
        : {}),
      ...(trimmedOrUndefined(filters.dueTo) ? { p_due_to: trimmedOrUndefined(filters.dueTo) } : {}),
    }).returns<MhdPerformanceReviewRpcRow[]>();

    if (error) {
      throw new Error(`Unable to load performance reviews: ${error.message}`);
    }

    return ((data ?? []) as unknown as MhdPerformanceReviewRpcRow[]).map(mapReviewRow);
  },

  async getReviewById(reviewId: string): Promise<MhdPerformanceReview> {
    const { data, error } = await performanceRpc('mhd_get_performance_review', {
      p_review_id: reviewId,
    }).returns<MhdPerformanceReviewRpcRow[]>();

    if (error) {
      throw new Error(`Unable to load performance review: ${error.message}`);
    }

    const row = (data as unknown as MhdPerformanceReviewRpcRow[] | null)?.[0];
    if (!row) {
      throw new Error(`Performance review not found: ${reviewId}`);
    }

    return mapReviewRow(row);
  },

  async createReview(input: MhdCreatePerformanceReviewInput): Promise<MhdPerformanceReview> {
    const { data, error } = await performanceRpc('mhd_create_performance_review', {
      p_company_id: input.companyId,
      p_person_id: input.personId,
      p_reviewer_user_id: input.reviewerUserId,
      p_review_type: input.reviewType,
      p_review_period_start: input.reviewPeriodStart,
      p_review_period_end: input.reviewPeriodEnd,
      ...(trimmedOrUndefined(input.dueDate)
        ? { p_due_date: trimmedOrUndefined(input.dueDate) }
        : {}),
      ...(input.reviewActivityId ? { p_review_activity_id: input.reviewActivityId } : {}),
    }).returns<MhdPerformanceMutationRpcRow[]>();

    if (error) {
      throw new Error(`Unable to create performance review: ${error.message}`);
    }

    const row = (data as unknown as MhdPerformanceMutationRpcRow[] | null)?.[0];
    if (!row) {
      throw new Error('Unable to create performance review: no record returned.');
    }

    return mhdPerformanceService.getReviewById(row.id);
  },

  async updateReview(reviewId: string, input: MhdUpdatePerformanceReviewInput): Promise<void> {
    const { error } = await performanceRpc('mhd_update_performance_review', {
      p_review_id: reviewId,
      ...(input.reviewType ? { p_review_type: input.reviewType } : {}),
      ...(input.reviewerUserId ? { p_reviewer_user_id: input.reviewerUserId } : {}),
      ...(trimmedOrUndefined(input.reviewPeriodStart)
        ? { p_review_period_start: trimmedOrUndefined(input.reviewPeriodStart) }
        : {}),
      ...(trimmedOrUndefined(input.reviewPeriodEnd)
        ? { p_review_period_end: trimmedOrUndefined(input.reviewPeriodEnd) }
        : {}),
      ...(trimmedOrUndefined(input.dueDate)
        ? { p_due_date: trimmedOrUndefined(input.dueDate) }
        : {}),
      ...(input.overallRating != null ? { p_overall_rating: input.overallRating } : {}),
      ...(trimmedOrUndefined(input.strengthsSummary)
        ? { p_strengths_summary: trimmedOrUndefined(input.strengthsSummary) }
        : {}),
      ...(trimmedOrUndefined(input.improvementSummary)
        ? { p_improvement_summary: trimmedOrUndefined(input.improvementSummary) }
        : {}),
      ...(trimmedOrUndefined(input.goalsSummary)
        ? { p_goals_summary: trimmedOrUndefined(input.goalsSummary) }
        : {}),
      ...(trimmedOrUndefined(input.reviewerComments)
        ? { p_reviewer_comments: trimmedOrUndefined(input.reviewerComments) }
        : {}),
      ...(trimmedOrUndefined(input.employeeComments)
        ? { p_employee_comments: trimmedOrUndefined(input.employeeComments) }
        : {}),
      ...(input.reviewActivityId ? { p_review_activity_id: input.reviewActivityId } : {}),
    });

    if (error) {
      throw new Error(`Unable to update performance review: ${error.message}`);
    }
  },

  async transitionReview(
    reviewId: string,
    input: MhdTransitionPerformanceReviewInput,
  ): Promise<void> {
    const { error } = await performanceRpc('mhd_transition_performance_review', {
      p_review_id: reviewId,
      p_new_status: input.newStatus,
      ...(trimmedOrUndefined(input.waiverReason)
        ? { p_waiver_reason: trimmedOrUndefined(input.waiverReason) }
        : {}),
    });

    if (error) {
      throw new Error(`Unable to transition performance review: ${error.message}`);
    }
  },

  async linkReviewDocuments(reviewId: string, input: MhdLinkReviewDocumentsInput): Promise<void> {
    const { error } = await performanceRpc('mhd_link_review_documents', {
      p_review_id: reviewId,
      ...(input.documentGenerationId
        ? { p_document_generation_id: input.documentGenerationId }
        : {}),
      ...(input.esignatureRequestId ? { p_esignature_request_id: input.esignatureRequestId } : {}),
    });

    if (error) {
      throw new Error(`Unable to link review documents: ${error.message}`);
    }
  },

  async deleteReview(reviewId: string): Promise<void> {
    const { error } = await performanceRpc('mhd_delete_performance_review', {
      p_review_id: reviewId,
    });

    if (error) {
      throw new Error(`Unable to delete performance review: ${error.message}`);
    }
  },

  /**
   * Finalize-and-send: the review acknowledgment ceremony (Specification rule 5,
   * "TypeScript Service" section). All steps go through published contracts:
   *
   *   1. `mhd_request_document_generation` — entity_type 'PERFORMANCE_REVIEW',
   *      entity_id = review id, merge data built from the review row against
   *      the seeded "Performance Review" template.
   *   2. Invoke the `render-document` edge function
   *      (`{ generation_id }` body) — it merges the template, uploads to
   *      Drive, and completes/fails the generation row.
   *   3. Poll the generation row until GENERATED (FAILED throws; a timeout
   *      throws a retryable message — the RPC-side state stays consistent
   *      because nothing on the review has changed yet).
   *   4. Read `output_document_hash` (04.8 auto-hash stamp — approved); fall
   *      back to the caller-supplied manual hash when the stamp is absent.
   *   5. `mhdEsignatureService.createRequestFromGeneratedDocument` with the
   *      review subject as sole signer (internal user or external email —
   *      the input decides), sequential order.
   *   6. `mhd_link_review_documents` — store both soft links on the review.
   *   7. `mhd_transition_performance_review('PENDING_SIGNATURE')` — locks
   *      content and notifies the subject (server-side `mhd_notify`).
   *
   * Steps are sequential and each failure surfaces a step-specific message so
   * the operator knows exactly where the ceremony stopped.
   */
  async finalizeReviewForSignature(
    input: MhdFinalizeReviewForSignatureInput,
  ): Promise<MhdFinalizeReviewForSignatureResult> {
    const review = await mhdPerformanceService.getReviewById(input.reviewId);

    if (review.status !== 'IN_REVIEW') {
      throw new Error(
        `Finalize is only available from IN_REVIEW (current status: ${review.status}).`,
      );
    }

    input.onStep?.(0);
    // Step 0 — resolve the seeded global template when the caller did not pin one
    // (published lookup RPC — never a direct select on the Doc-Gen service's table).
    let templateId = input.templateId;
    if (!templateId) {
      const { data: templateData, error: templateError } = await supabaseClient.rpc(
        'mhd_get_performance_review_template_id',
      );
      if (templateError) {
        throw new Error(`Finalize step 0 (resolve template): ${templateError.message}`);
      }
      templateId = (templateData as string | null) ?? undefined;
      if (!templateId) {
        throw new Error(
          'Finalize step 0 (resolve template): the seeded "Performance Review" template was not found.',
        );
      }
    }

    input.onStep?.(1);
    // Step 1 — request the document generation.
    const { data: generationData, error: generationError } = await supabaseClient
      .rpc('mhd_request_document_generation', {
        p_company_id: review.companyId,
        p_template_id: templateId,
        p_entity_type: 'PERFORMANCE_REVIEW',
        p_entity_id: review.id,
        p_merge_data: buildReviewMergeData(review) as Json,
        ...(input.actorUserId ? { p_actor_user_id: input.actorUserId } : {}),
      })
      .returns<Array<{ id: string; reference_id: string; status: string }>>();

    if (generationError) {
      throw new Error(
        `Finalize step 1 (request document generation) failed: ${generationError.message}`,
      );
    }

    const generationId = generationData?.[0]?.id;
    if (!generationId) {
      throw new Error(
        'Finalize step 1 (request document generation) failed: no generation id returned.',
      );
    }

    input.onStep?.(2);
    // Step 2 — render the document via the edge function.
    const { data: renderData, error: renderError } =
      await supabaseClient.functions.invoke<RenderDocumentResponse>(RENDER_DOCUMENT_FUNCTION_NAME, {
        body: { generation_id: generationId },
      });

    if (renderError) {
      throw new Error(`Finalize step 2 (render document) failed: ${renderError.message}`);
    }
    if (renderData?.success === false) {
      throw new Error(
        `Finalize step 2 (render document) failed: ${renderData.error ?? 'unknown render error.'}`,
      );
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
      trimmedOrUndefined(generation.output_document_hash) ??
      trimmedOrUndefined(input.manualDocumentHash);

    if (!documentHash) {
      throw new Error(
        'Finalize step 4 (document hash) failed: the generation has no auto-stamped hash and no manual hash was provided.',
      );
    }

    input.onStep?.(5);
    // Step 5 — create the signature request from the generated document.
    let esignatureRequestId: string;
    let invitationErrors: string[];
    try {
      const result = await mhdEsignatureService.createRequestFromGeneratedDocument({
        companyId: review.companyId,
        generationId,
        documentHash,
        signers: [mapSignerInput(input.signer)],
        signingOrder: 'SEQUENTIAL',
        ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
      });
      esignatureRequestId = result.request.id;
      invitationErrors = result.invitationErrors;
    } catch (cause) {
      throw new Error(
        `Finalize step 5 (create signature request) failed: ${cause instanceof Error ? cause.message : String(cause)}`,
        { cause },
      );
    }

    input.onStep?.(6);
    // Step 6 — store the soft links on the review.
    try {
      await mhdPerformanceService.linkReviewDocuments(review.id, {
        documentGenerationId: generationId,
        esignatureRequestId,
      });
    } catch (cause) {
      throw new Error(
        `Finalize step 6 (link review documents) failed: ${cause instanceof Error ? cause.message : String(cause)}`,
        { cause },
      );
    }

    input.onStep?.(7);
    // Step 7 — lock content and enter PENDING_SIGNATURE.
    try {
      await mhdPerformanceService.transitionReview(review.id, { newStatus: 'PENDING_SIGNATURE' });
    } catch (cause) {
      throw new Error(
        `Finalize step 7 (transition to PENDING_SIGNATURE) failed: ${cause instanceof Error ? cause.message : String(cause)}`,
        { cause },
      );
    }

    return {
      review: await mhdPerformanceService.getReviewById(review.id),
      documentGenerationId: generationId,
      esignatureRequestId,
      documentHash,
      invitationErrors,
    };
  },

  // -------------------------------------------------------------------------
  // Coaching plans
  // -------------------------------------------------------------------------

  async listCoachingPlans(filters: MhdCoachingPlanFilters): Promise<MhdCoachingPlan[]> {
    const { data, error } = await performanceRpc('mhd_list_coaching_plans', {
      p_company_id: filters.companyId,
      ...(filterValueOrUndefined(filters.personId)
        ? { p_person_id: filterValueOrUndefined(filters.personId) }
        : {}),
      ...(filterValueOrUndefined(filters.coachUserId)
        ? { p_coach_user_id: filterValueOrUndefined(filters.coachUserId) }
        : {}),
      ...(filters.status !== 'ALL' ? { p_status: filters.status } : {}),
      ...(trimmedOrUndefined(filters.searchTerm)
        ? { p_search_term: trimmedOrUndefined(filters.searchTerm) }
        : {}),
    }).returns<MhdCoachingPlanRpcRow[]>();

    if (error) {
      throw new Error(`Unable to load coaching plans: ${error.message}`);
    }

    return ((data ?? []) as unknown as MhdCoachingPlanRpcRow[]).map(mapCoachingPlanRow);
  },

  async getCoachingPlanById(planId: string): Promise<MhdCoachingPlan> {
    const { data, error } = await performanceRpc('mhd_get_coaching_plan', {
      p_plan_id: planId,
    }).returns<MhdCoachingPlanRpcRow[]>();

    if (error) {
      throw new Error(`Unable to load coaching plan: ${error.message}`);
    }

    const row = (data as unknown as MhdCoachingPlanRpcRow[] | null)?.[0];
    if (!row) {
      throw new Error(`Coaching plan not found: ${planId}`);
    }

    return mapCoachingPlanRow(row);
  },

  async createCoachingPlan(input: MhdCreateCoachingPlanInput): Promise<MhdCoachingPlan> {
    const { data, error } = await performanceRpc('mhd_create_coaching_plan', {
      p_company_id: input.companyId,
      p_person_id: input.personId,
      p_coach_user_id: input.coachUserId,
      p_title: input.title.trim(),
      ...(trimmedOrUndefined(input.objective)
        ? { p_objective: trimmedOrUndefined(input.objective) }
        : {}),
      ...(trimmedOrUndefined(input.startDate)
        ? { p_start_date: trimmedOrUndefined(input.startDate) }
        : {}),
      ...(trimmedOrUndefined(input.targetDate)
        ? { p_target_date: trimmedOrUndefined(input.targetDate) }
        : {}),
      ...(input.sourceReviewId ? { p_source_review_id: input.sourceReviewId } : {}),
    }).returns<MhdPerformanceMutationRpcRow[]>();

    if (error) {
      throw new Error(`Unable to create coaching plan: ${error.message}`);
    }

    const row = (data as unknown as MhdPerformanceMutationRpcRow[] | null)?.[0];
    if (!row) {
      throw new Error('Unable to create coaching plan: no record returned.');
    }

    return mhdPerformanceService.getCoachingPlanById(row.id);
  },

  async updateCoachingPlan(planId: string, input: MhdUpdateCoachingPlanInput): Promise<void> {
    const { error } = await performanceRpc('mhd_update_coaching_plan', {
      p_plan_id: planId,
      ...(trimmedOrUndefined(input.title) ? { p_title: trimmedOrUndefined(input.title) } : {}),
      ...(trimmedOrUndefined(input.objective)
        ? { p_objective: trimmedOrUndefined(input.objective) }
        : {}),
      ...(trimmedOrUndefined(input.startDate)
        ? { p_start_date: trimmedOrUndefined(input.startDate) }
        : {}),
      ...(trimmedOrUndefined(input.targetDate)
        ? { p_target_date: trimmedOrUndefined(input.targetDate) }
        : {}),
      ...(trimmedOrUndefined(input.outcomeSummary)
        ? { p_outcome_summary: trimmedOrUndefined(input.outcomeSummary) }
        : {}),
      ...(input.coachUserId ? { p_coach_user_id: input.coachUserId } : {}),
    });

    if (error) {
      throw new Error(`Unable to update coaching plan: ${error.message}`);
    }
  },

  async transitionCoachingPlan(
    planId: string,
    input: MhdTransitionCoachingPlanInput,
  ): Promise<void> {
    const { error } = await performanceRpc('mhd_transition_coaching_plan', {
      p_plan_id: planId,
      p_new_status: input.newStatus,
      ...(trimmedOrUndefined(input.outcomeSummary)
        ? { p_outcome_summary: trimmedOrUndefined(input.outcomeSummary) }
        : {}),
    });

    if (error) {
      throw new Error(`Unable to transition coaching plan: ${error.message}`);
    }
  },

  async deleteCoachingPlan(planId: string): Promise<void> {
    const { error } = await performanceRpc('mhd_delete_coaching_plan', {
      p_plan_id: planId,
    });

    if (error) {
      throw new Error(`Unable to delete coaching plan: ${error.message}`);
    }
  },

  async listCoachingPlanItems(planId: string): Promise<MhdCoachingPlanItem[]> {
    const { data, error } = await performanceRpc('mhd_list_coaching_plan_items', {
      p_plan_id: planId,
    }).returns<MhdCoachingPlanItemRpcRow[]>();

    if (error) {
      throw new Error(`Unable to load coaching plan items: ${error.message}`);
    }

    return ((data ?? []) as unknown as MhdCoachingPlanItemRpcRow[]).map(mapCoachingPlanItemRow);
  },

  async createCoachingPlanItem(input: MhdCreateCoachingPlanItemInput): Promise<void> {
    const { error } = await performanceRpc('mhd_create_coaching_plan_item', {
      p_plan_id: input.planId,
      p_title: input.title.trim(),
      ...(trimmedOrUndefined(input.description)
        ? { p_description: trimmedOrUndefined(input.description) }
        : {}),
      ...(trimmedOrUndefined(input.dueDate)
        ? { p_due_date: trimmedOrUndefined(input.dueDate) }
        : {}),
      ...(input.activityId ? { p_activity_id: input.activityId } : {}),
      ...(input.sortOrder !== undefined ? { p_sort_order: input.sortOrder } : {}),
    });

    if (error) {
      throw new Error(`Unable to create coaching plan item: ${error.message}`);
    }
  },

  async updateCoachingPlanItem(
    itemId: string,
    input: MhdUpdateCoachingPlanItemInput,
  ): Promise<void> {
    const { error } = await performanceRpc('mhd_update_coaching_plan_item', {
      p_item_id: itemId,
      ...(trimmedOrUndefined(input.title) ? { p_title: trimmedOrUndefined(input.title) } : {}),
      ...(trimmedOrUndefined(input.description)
        ? { p_description: trimmedOrUndefined(input.description) }
        : {}),
      ...(trimmedOrUndefined(input.dueDate)
        ? { p_due_date: trimmedOrUndefined(input.dueDate) }
        : {}),
      ...(input.status ? { p_status: input.status } : {}),
      ...(input.activityId ? { p_activity_id: input.activityId } : {}),
      ...(input.sortOrder !== undefined ? { p_sort_order: input.sortOrder } : {}),
    });

    if (error) {
      throw new Error(`Unable to update coaching plan item: ${error.message}`);
    }
  },

  async deleteCoachingPlanItem(itemId: string): Promise<void> {
    const { error } = await performanceRpc('mhd_delete_coaching_plan_item', {
      p_item_id: itemId,
    });

    if (error) {
      throw new Error(`Unable to delete coaching plan item: ${error.message}`);
    }
  },

  // -------------------------------------------------------------------------
  // Activities surfaces (rule 8: one-on-ones and coaching sessions ARE
  // Activities — consumed via the published Activities contract, zero schema)
  // -------------------------------------------------------------------------

  async listPersonActivities(
    companyId: string,
    personId: string,
    activityType: 'ONE_ON_ONE' | 'COACHING_SESSION',
  ): Promise<MhdActivity[]> {
    return mhdActivityService.listActivities({
      companyId,
      personId,
      taskId: 'ALL',
      activityType,
      status: 'ALL',
      searchTerm: '',
      from: '',
      to: '',
    });
  },

  async createPersonActivity(input: MhdUpdateActivityInput): Promise<MhdActivity> {
    if (input.activityType !== 'ONE_ON_ONE' && input.activityType !== 'COACHING_SESSION') {
      throw new Error(
        'The Performance module only creates ONE_ON_ONE or COACHING_SESSION activities.',
      );
    }

    return mhdActivityService.createActivity(input);
  },
};
