import { supabaseClient } from '@/lib/supabase/supabaseClient';
import { mhdToNumber } from './Types';
import type {
  MhdApplicationFilters,
  MhdCreateRequisitionInput,
  MhdEeoReportFilters,
  MhdInviteApplicationInput,
  MhdMoveApplicationStageInput,
  MhdRecruitingApplication,
  MhdRecruitingApplicationDetail,
  MhdRecruitingApplicationDetailRpcRow,
  MhdRecruitingApplicationHistoryEntry,
  MhdRecruitingApplicationHistoryRpcRow,
  MhdRecruitingApplicationRpcRow,
  MhdRecruitingEeoReportRow,
  MhdRecruitingEeoReportRpcRow,
  MhdRecruitingInviteResult,
  MhdRecruitingInviteRpcRow,
  MhdRecruitingMutationResult,
  MhdRecruitingMutationRpcRow,
  MhdRecruitingReason,
  MhdRecruitingReasonRpcRow,
  MhdRecruitingRequisition,
  MhdRecruitingRequisitionRpcRow,
  MhdRecruitingStage,
  MhdRecruitingStageRpcRow,
  MhdRejectApplicationInput,
  MhdRequisitionFilters,
  MhdStageUpsertInput,
  MhdSubmitApplicationInput,
  MhdSubmitEeoInput,
  MhdTransitionRequisitionInput,
} from './Types';

// Contract-only access. Every method below calls `.rpc()` and nothing else —
// there is not a single `supabaseClient.from('recruiting_*')` select in this
// service. The whole surface is security-definer RPCs; RLS carries a
// `using(false) with check(false)` no-direct-write policy on every table (and
// the EEO partition is `using(false)` even for reads), so a direct
// insert/update/select is refused regardless of role. The two applicant paths
// (`submitApplication`, `submitEeo`) are the same RPC surface, reached
// unauthenticated through the token — see the apply page.
const recruitingRpc = supabaseClient.rpc.bind(supabaseClient);

function trimmedOrUndefined(value?: string | null): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function filterValueOrUndefined(value?: string | null): string | undefined {
  if (!value || value === 'ALL') return undefined;
  return value;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapStage(row: MhdRecruitingStageRpcRow): MhdRecruitingStage {
  return {
    id: row.id,
    companyId: row.company_id,
    stageKey: row.stage_key,
    stageName: row.stage_name,
    category: row.category as MhdRecruitingStage['category'],
    // PostgREST may serialise the integer as a string; normalise before use.
    sortOrder: mhdToNumber(row.sort_order),
    isActive: row.is_active,
    isGlobal: row.is_global,
  };
}

function mapReason(row: MhdRecruitingReasonRpcRow): MhdRecruitingReason {
  return {
    id: row.id,
    reasonKey: row.reason_key,
    reasonText: row.reason_text,
    sortOrder: mhdToNumber(row.sort_order),
    isGlobal: row.is_global,
  };
}

function mapRequisition(row: MhdRecruitingRequisitionRpcRow): MhdRecruitingRequisition {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdRecruitingRequisition['referenceId'],
    jobId: row.job_id,
    title: row.title,
    hiringManagerPersonId: row.hiring_manager_person_id,
    hiringManagerName: row.hiring_manager_name,
    department: row.department,
    location: row.location,
    employmentType: row.employment_type,
    // Integer columns PostgREST can hand back as strings; normalise.
    headcount: mhdToNumber(row.headcount),
    status: row.status as MhdRecruitingRequisition['status'],
    requiresApproval: row.requires_approval,
    openApplicationCount: mhdToNumber(row.open_application_count),
    openedAt: row.opened_at,
    createdAt: row.created_at,
  };
}

function mapApplication(row: MhdRecruitingApplicationRpcRow): MhdRecruitingApplication {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdRecruitingApplication['referenceId'],
    personId: row.person_id,
    personDisplayName: row.person_display_name,
    // Server-synced from the stage category; rendered verbatim.
    lifecycle: row.lifecycle as MhdRecruitingApplication['lifecycle'],
    currentStageId: row.current_stage_id,
    stageName: row.stage_name,
    source: row.source,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
  };
}

function mapApplicationDetail(
  row: MhdRecruitingApplicationDetailRpcRow,
): MhdRecruitingApplicationDetail {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdRecruitingApplicationDetail['referenceId'],
    requisitionId: row.requisition_id,
    requisitionTitle: row.requisition_title,
    personId: row.person_id,
    personDisplayName: row.person_display_name,
    lifecycle: row.lifecycle as MhdRecruitingApplicationDetail['lifecycle'],
    currentStageId: row.current_stage_id,
    stageName: row.stage_name,
    source: row.source,
    invitedAt: row.invited_at,
    submittedAt: row.submitted_at,
    // PostgREST may serialise the numeric as a string; normalise, but preserve
    // the semantic null (applicant left it blank) rather than collapsing to 0.
    desiredPayRate: row.desired_pay_rate == null ? null : mhdToNumber(row.desired_pay_rate),
    availabilityDate: row.availability_date,
    employmentTypeDesired: row.employment_type_desired,
    coverNote: row.cover_note,
    rejectionReasonId: row.rejection_reason_id,
    rejectionReasonText: row.rejection_reason_text,
    rejectionNote: row.rejection_note,
    createdAt: row.created_at,
  };
}

function mapApplicationHistoryEntry(
  row: MhdRecruitingApplicationHistoryRpcRow,
): MhdRecruitingApplicationHistoryEntry {
  return {
    id: row.id,
    fromStageId: row.from_stage_id,
    fromStageName: row.from_stage_name,
    toStageId: row.to_stage_id,
    toStageName: row.to_stage_name,
    note: row.note,
    movedAt: row.moved_at,
    movedBy: row.moved_by,
  };
}

function mapMutationResult(row: MhdRecruitingMutationRpcRow): MhdRecruitingMutationResult {
  return { id: row.id, referenceId: row.reference_id };
}

function mapInviteResult(row: MhdRecruitingInviteRpcRow): MhdRecruitingInviteResult {
  return { id: row.id, referenceId: row.reference_id, inviteToken: row.invite_token };
}

function mapEeoReportRow(row: MhdRecruitingEeoReportRpcRow): MhdRecruitingEeoReportRow {
  return {
    dimension: row.dimension,
    bucket: row.bucket,
    applicantCount: mhdToNumber(row.applicant_count),
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const mhdRecruitingService = {
  // ----- Config: stages + reasons -----

  /**
   * The pipeline stages for a company — global defaults plus company overrides,
   * active only, ordered by sort. `is_global` marks the platform-seeded ones.
   * Any caller with company access reads this (it gates on company access).
   */
  async listStages(companyId: string | null): Promise<MhdRecruitingStage[]> {
    if (!companyId) return [];
    const { data, error } = await recruitingRpc('mhd_recruiting_stage_list', {
      p_company_id: companyId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdRecruitingStageRpcRow[]).map(mapStage);
  },

  /** Upsert a company pipeline stage. Admin-only at the RPC. Returns the stage id. */
  async upsertStage(input: MhdStageUpsertInput): Promise<string> {
    const { data, error } = await recruitingRpc('mhd_recruiting_stage_upsert', {
      p_company_id: input.companyId,
      p_stage_key: input.stageKey.trim(),
      p_stage_name: input.stageName.trim(),
      p_category: input.category ?? 'ACTIVE',
      p_sort_order: input.sortOrder ?? undefined,
    });
    if (error) throw error;
    return data as string;
  },

  /** The configurable rejection reasons — global + company, active only. */
  async listReasons(companyId: string | null): Promise<MhdRecruitingReason[]> {
    if (!companyId) return [];
    const { data, error } = await recruitingRpc('mhd_recruiting_reason_list', {
      p_company_id: companyId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdRecruitingReasonRpcRow[]).map(mapReason);
  },

  // ----- Requisitions -----

  /**
   * Create a requisition. Admin-only at the RPC; the caller sees the minted
   * `(id, reference_id)`. Ids (`jobId`, `hiringManagerPersonId`) are passed
   * through untrimmed when set, omitted when blank.
   */
  async createRequisition(input: MhdCreateRequisitionInput): Promise<MhdRecruitingMutationResult> {
    const { data, error } = await recruitingRpc('mhd_recruiting_requisition_create', {
      p_company_id: input.companyId,
      p_title: input.title.trim(),
      p_job_id: trimmedOrUndefined(input.jobId),
      p_hiring_manager_person_id: trimmedOrUndefined(input.hiringManagerPersonId),
      p_department: trimmedOrUndefined(input.department),
      p_location: trimmedOrUndefined(input.location),
      p_employment_type: trimmedOrUndefined(input.employmentType),
      p_headcount: input.headcount ?? undefined,
      p_requires_approval: input.requiresApproval ?? false,
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdRecruitingMutationRpcRow[])[0];
    if (!row) throw new Error('Requisition creation returned no row.');
    return mapMutationResult(row);
  },

  /**
   * A company's requisitions. Privileged callers see all of the company's; a
   * hiring manager sees only their own (RLS + `can_view_requisition`). Each row
   * carries the server-computed `open_application_count`.
   */
  async listRequisitions(filters: MhdRequisitionFilters): Promise<MhdRecruitingRequisition[]> {
    if (!filters.companyId) return [];
    const { data, error } = await recruitingRpc('mhd_recruiting_requisition_list', {
      p_company_id: filters.companyId,
      p_status: filterValueOrUndefined(filters.status),
    });
    if (error) throw error;
    return ((data ?? []) as MhdRecruitingRequisitionRpcRow[]).map(mapRequisition);
  },

  /**
   * Transition a requisition to a new status. Admin-only at the RPC, which stamps
   * `opened_at` / `closed_at` and audits the move. Approval orchestration is
   * app-layer; this RPC records the move and trusts the caller's authority.
   */
  async transitionRequisition(input: MhdTransitionRequisitionInput): Promise<void> {
    const { error } = await recruitingRpc('mhd_recruiting_requisition_transition', {
      p_req_id: input.reqId,
      p_new_status: input.newStatus,
    });
    if (error) throw error;
  },

  // ----- Applications: the invited, tokenized funnel -----

  /**
   * Invite a person to apply — creates the application row + a single-use invite
   * token, returned ONCE. Admin-only at the RPC. The app layer emails the link;
   * the recruiter UI shows/copies it and never re-lists the token.
   */
  async inviteApplication(input: MhdInviteApplicationInput): Promise<MhdRecruitingInviteResult> {
    const { data, error } = await recruitingRpc('mhd_recruiting_application_invite', {
      p_requisition_id: input.requisitionId,
      p_person_id: input.personId,
      p_source: trimmedOrUndefined(input.source),
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdRecruitingInviteRpcRow[])[0];
    if (!row) throw new Error('Application invite returned no row.');
    return mapInviteResult(row);
  },

  /**
   * The APPLICANT's tokenized submission — reached UNAUTHENTICATED through the
   * apply link, the token the only credential (the e-sign /sign pattern). Moves
   * the application INVITED -> ACTIVE into the first ACTIVE stage and writes the
   * first history row. The lifecycle guard blocks a second submission; the token
   * is not burned (EEO may follow). Called directly by the public apply page.
   */
  async submitApplication(input: MhdSubmitApplicationInput): Promise<MhdRecruitingMutationResult> {
    const { data, error } = await recruitingRpc('mhd_recruiting_application_submit', {
      p_invite_token: input.inviteToken,
      p_desired_pay_rate: input.desiredPayRate ?? undefined,
      p_availability_date: trimmedOrUndefined(input.availabilityDate),
      p_employment_type_desired: trimmedOrUndefined(input.employmentTypeDesired),
      p_cover_note: trimmedOrUndefined(input.coverNote),
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdRecruitingMutationRpcRow[])[0];
    if (!row) throw new Error('Application submission returned no row.');
    return mapMutationResult(row);
  },

  /**
   * The applications on a requisition, optionally narrowed to one stage or
   * lifecycle. Visible to whoever can view the parent requisition (RLS). Each row
   * carries the SERVER-SYNCED lifecycle and current stage — render, do not
   * recompute. NOTE: no structured applicant fields or stage history are returned
   * here; package 1 exposes no `application_get` / history read RPC.
   */
  async listApplications(filters: MhdApplicationFilters): Promise<MhdRecruitingApplication[]> {
    if (!filters.requisitionId) return [];
    const { data, error } = await recruitingRpc('mhd_recruiting_application_list', {
      p_requisition_id: filters.requisitionId,
      p_stage_id: trimmedOrUndefined(filters.stageId),
      p_lifecycle: filterValueOrUndefined(filters.lifecycle),
    });
    if (error) throw error;
    return ((data ?? []) as MhdRecruitingApplicationRpcRow[]).map(mapApplication);
  },

  /**
   * The full single application, incl. the structured applicant fields captured
   * at submit and the resolved rejection reason. Single-row via `.single()`.
   * Visible to whoever can view the parent requisition (RLS). Carries NO EEO data.
   */
  async getApplication(applicationId: string): Promise<MhdRecruitingApplicationDetail> {
    const { data, error } = await recruitingRpc('mhd_recruiting_application_get', {
      p_application_id: applicationId,
    }).single();
    if (error) throw error;
    return mapApplicationDetail(data as MhdRecruitingApplicationDetailRpcRow);
  },

  /**
   * An application's append-only stage trail (submission + every move/reject),
   * newest handling left to the caller. Visible to whoever can view the parent
   * requisition (RLS).
   */
  async getApplicationHistory(
    applicationId: string,
  ): Promise<MhdRecruitingApplicationHistoryEntry[]> {
    const { data, error } = await recruitingRpc('mhd_recruiting_application_history', {
      p_application_id: applicationId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdRecruitingApplicationHistoryRpcRow[]).map(
      mapApplicationHistoryEntry,
    );
  },

  /**
   * Move an application to another stage — writes the append-only history row and
   * syncs lifecycle from the destination stage's category. Admin-only at the RPC.
   */
  async moveApplicationStage(input: MhdMoveApplicationStageInput): Promise<void> {
    const { error } = await recruitingRpc('mhd_recruiting_application_move_stage', {
      p_application_id: input.applicationId,
      p_to_stage_id: input.toStageId,
      p_note: trimmedOrUndefined(input.note),
    });
    if (error) throw error;
  },

  /**
   * Reject an application with an optional reason + note — a first-class terminal
   * outcome, independent of moving to a REJECTED stage. Admin-only at the RPC.
   */
  async rejectApplication(input: MhdRejectApplicationInput): Promise<void> {
    const { error } = await recruitingRpc('mhd_recruiting_application_reject', {
      p_application_id: input.applicationId,
      p_reason_id: trimmedOrUndefined(input.reasonId),
      p_note: trimmedOrUndefined(input.note),
    });
    if (error) throw error;
  },

  // ----- EEO — write-only partition, plus the one aggregate read -----

  /**
   * The applicant's VOLUNTARY EEO self-id — tokenized like submit, writes ONLY to
   * the hard-restricted partition. Reached UNAUTHENTICATED from the apply link;
   * never surfaced back to a recruiter. Called directly by the public apply page.
   */
  async submitEeo(input: MhdSubmitEeoInput): Promise<void> {
    const { error } = await recruitingRpc('mhd_recruiting_eeo_submit', {
      p_invite_token: input.inviteToken,
      p_race_ethnicity: trimmedOrUndefined(input.raceEthnicity),
      p_gender: trimmedOrUndefined(input.gender),
      p_veteran_status: trimmedOrUndefined(input.veteranStatus),
      p_disability_status: trimmedOrUndefined(input.disabilityStatus),
      p_declined: input.declined ?? false,
    });
    if (error) throw error;
  },

  /**
   * The EEO aggregate report — the ONLY read path into the partition,
   * Platform-Admin-gated at the RPC, aggregate COUNTS only (never individual
   * rows). Optionally scoped to one requisition.
   */
  async eeoReport(filters: MhdEeoReportFilters): Promise<MhdRecruitingEeoReportRow[]> {
    if (!filters.companyId) return [];
    const { data, error } = await recruitingRpc('mhd_recruiting_eeo_report', {
      p_company_id: filters.companyId,
      p_requisition_id: trimmedOrUndefined(filters.requisitionId),
    });
    if (error) throw error;
    return ((data ?? []) as MhdRecruitingEeoReportRpcRow[]).map(mapEeoReportRow);
  },
};
