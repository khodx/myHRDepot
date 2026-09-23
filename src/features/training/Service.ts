import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { Json } from '@/types/database.types';
import { mhdToNumber } from './Types';
import type {
  MhdAssignTrainingInput,
  MhdApplyTrainingComplianceRuleInput,
  MhdAssignTrainingProgramInput,
  MhdCompleteTrainingInput,
  MhdCreateCourseInput,
  MhdCreateCurriculumInput,
  MhdCreateProgramInput,
  MhdCreateCourseModuleInput,
  MhdCreateLessonInput,
  MhdCreateBlockInput,
  MhdSetCourseContentModeInput,
  MhdForkCourseInput,
  MhdApproveContentInput,
  MhdSubmitContentForReviewInput,
  MhdPublishContentInput,
  MhdPrerequisiteInput,
  MhdMutationResult,
  MhdTrainingMutationRpcRow,
  MhdRecordAdminCompletionInput,
  MhdSetCourseActiveInput,
  MhdTrainingAssignment,
  MhdTrainingAssignmentFilters,
  MhdTrainingAssignmentRpcRow,
  MhdTrainingAssignProgramRpcRow,
  MhdTrainingAssignProgramResult,
  MhdTrainingComplianceRuleApplyResult,
  MhdTrainingComplianceRuleApplyRpcRow,
  MhdTrainingComplianceRule,
  MhdTrainingComplianceRuleRpcRow,
  MhdCreateTrainingComplianceRuleInput,
  MhdTrainingCompletion,
  MhdTrainingCompletionResult,
  MhdTrainingCompletionResultRpcRow,
  MhdTrainingCompletionRpcRow,
  MhdTrainingCompliance,
  MhdTrainingComplianceMatrixFilters,
  MhdTrainingComplianceMatrixRow,
  MhdTrainingComplianceMatrixRpcRow,
  MhdTrainingComplianceRpcRow,
  MhdTrainingCourse,
  MhdTrainingCourseFilters,
  MhdTrainingCourseRpcRow,
  MhdTrainingCurriculum,
  MhdTrainingCurriculumRpcRow,
  MhdTrainingProgram,
  MhdTrainingProgramRpcRow,
  MhdTrainingProgramFilters,
  MhdTrainingSelfEnrollmentRequest,
  MhdTrainingSelfEnrollmentRequestRpcRow,
  MhdSelfEnrollTrainingInput,
  MhdListTrainingSelfEnrollmentsInput,
  MhdDecideTrainingSelfEnrollmentInput,
  MhdTrainingSelfEnrollmentDecisionResult,
  MhdTrainingSelfEnrollmentDecisionRpcRow,
  MhdTrainingCourseModule,
  MhdTrainingLesson,
  MhdTrainingBlock,
  MhdUpdateCourseInput,
  MhdWaiveAssignmentInput,
} from './Types';

// Contract-only access. Every method below calls `.rpc()` and nothing else —
// there is not a single `supabaseClient.from('training_*')` select in this
// service. The whole surface is security-definer RPCs; RLS carries a
// `using(false) with check(false)` no-direct-write policy on every table, so a
// direct insert/update is refused even for an admin.
// supabaseClient.rpc is called directly rather than bound to a local alias.
// Binding instantiates the whole generated rpc overload set at once, which now
// exceeds the TypeScript instantiation depth limit (TS2589) at this schema size.
// A direct call instantiates only the matching overload, so argument and return
// types remain fully checked.

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

function mapCourse(row: MhdTrainingCourseRpcRow): MhdTrainingCourse {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdTrainingCourse['referenceId'],
    companyId: row.company_id,
    courseKey: row.course_key,
    title: row.title,
    description: row.description,
    category: row.category as MhdTrainingCourse['category'],
    deliveryMode: row.delivery_mode as MhdTrainingCourse['deliveryMode'],
    // PostgREST may serialise these integer columns as strings; normalise, but
    // preserve the semantic null (one-time course / unset duration) rather than
    // collapsing it to 0.
    durationMinutes: row.duration_minutes == null ? null : mhdToNumber(row.duration_minutes),
    recurrenceMonths: row.recurrence_months == null ? null : mhdToNumber(row.recurrence_months),
    requiresEvidence: row.requires_evidence,
    externalUrl: row.external_url,
    isActive: row.is_active,
    isGlobal: row.is_global,
    contentMode: row.content_mode as MhdTrainingCourse['contentMode'],
    programId: row.program_id,
    templateId: row.template_id as MhdTrainingCourse['templateId'],
    sourceCourseId: row.source_course_id,
    forkState: row.fork_state as MhdTrainingCourse['forkState'],
    contentVersion: mhdToNumber(row.content_version),
    approvalStatus: row.approval_status as MhdTrainingCourse['approvalStatus'],
  };
}

function mapCurriculum(row: MhdTrainingCurriculumRpcRow): MhdTrainingCurriculum {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdTrainingCurriculum['referenceId'],
    companyId: row.company_id,
    title: row.title,
    description: row.description,
    isActive: row.is_active,
    isGlobal: row.is_global,
  };
}

function mapProgram(row: MhdTrainingProgramRpcRow): MhdTrainingProgram {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdTrainingProgram['referenceId'],
    companyId: row.company_id,
    curriculumId: row.curriculum_id,
    title: row.title,
    description: row.description,
    sortOrder: mhdToNumber(row.sort_order),
    isGlobal: row.is_global,
  };
}

function mapCourseModule(row: MhdTrainingMutationRpcRow): MhdTrainingCourseModule {
  return { id: row.id, referenceId: row.reference_id as MhdTrainingCourseModule['referenceId'] };
}

function mapLesson(row: MhdTrainingMutationRpcRow): MhdTrainingLesson {
  return { id: row.id, referenceId: row.reference_id as MhdTrainingLesson['referenceId'] };
}

function mapBlock(row: MhdTrainingMutationRpcRow): MhdTrainingBlock {
  return { id: row.id, referenceId: row.reference_id as MhdTrainingBlock['referenceId'] };
}

function mapAssignment(row: MhdTrainingAssignmentRpcRow): MhdTrainingAssignment {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdTrainingAssignment['referenceId'],
    courseId: row.course_id,
    courseTitle: row.course_title,
    category: row.category as MhdTrainingAssignment['category'],
    personId: row.person_id,
    personDisplayName: row.person_display_name,
    assignedBy: row.assigned_by,
    dueDate: row.due_date,
    status: row.status as MhdTrainingAssignment['status'],
    // Server-derived; copied through verbatim. Nothing downstream recomputes it.
    complianceStatus: row.compliance_status as MhdTrainingAssignment['complianceStatus'],
    sourceType: row.source_type as MhdTrainingAssignment['sourceType'],
    sourceId: row.source_id,
    isEmergencyPriority: row.is_emergency_priority,
    createdAt: row.created_at,
  };
}

function mapComplianceRule(row: MhdTrainingComplianceRuleRpcRow): MhdTrainingComplianceRule {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdTrainingComplianceRule['referenceId'],
    companyId: row.company_id,
    title: row.title,
    targetType: row.target_type as MhdTrainingComplianceRule['targetType'],
    targetDepartment: row.target_department,
    targetJobId: row.target_job_id,
    targetJurisdiction: row.target_jurisdiction,
    courseId: row.course_id,
    courseTitle: row.course_title,
    dueOffsetDays: row.due_offset_days == null ? null : mhdToNumber(row.due_offset_days),
    isActive: row.is_active,
  };
}

function mapSelfEnrollmentRequest(
  row: MhdTrainingSelfEnrollmentRequestRpcRow,
): MhdTrainingSelfEnrollmentRequest {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdTrainingSelfEnrollmentRequest['referenceId'],
    courseId: row.course_id,
    courseTitle: row.course_title,
    personId: row.person_id,
    personDisplayName: row.person_display_name,
    status: row.status as MhdTrainingSelfEnrollmentRequest['status'],
    requestedAt: row.requested_at,
    decidedAt: row.decided_at,
    decisionNotes: row.decision_notes,
  };
}

function mapAssignProgramResult(row: MhdTrainingAssignProgramRpcRow): MhdTrainingAssignProgramResult {
  return { courseId: row.course_id, assignmentId: row.assignment_id };
}

function mapComplianceRuleApplyResult(
  row: MhdTrainingComplianceRuleApplyRpcRow,
): MhdTrainingComplianceRuleApplyResult {
  return { assignedPersonId: row.assigned_person_id, assignmentId: row.assignment_id };
}

function mapSelfEnrollmentDecisionResult(
  row: MhdTrainingSelfEnrollmentDecisionRpcRow,
): MhdTrainingSelfEnrollmentDecisionResult {
  return { assignmentId: row.assignment_id };
}

function mapCompletion(row: MhdTrainingCompletionRpcRow): MhdTrainingCompletion {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdTrainingCompletion['referenceId'],
    courseId: row.course_id,
    courseTitle: row.course_title,
    completedAt: row.completed_at,
    completionMethod: row.completion_method as MhdTrainingCompletion['completionMethod'],
    expiresAt: row.expires_at,
    attachmentId: row.attachment_id,
    // Server-derived expiry flag; render verbatim, never re-derive from expiresAt.
    isExpired: row.is_expired,
  };
}

function mapCompliance(row: MhdTrainingComplianceRpcRow): MhdTrainingCompliance {
  return {
    courseId: row.course_id,
    courseTitle: row.course_title,
    category: row.category as MhdTrainingCompliance['category'],
    status: row.status as MhdTrainingCompliance['status'],
    lastCompletedAt: row.last_completed_at,
    expiresAt: row.expires_at,
  };
}

function mapComplianceMatrixRow(
  row: MhdTrainingComplianceMatrixRpcRow,
): MhdTrainingComplianceMatrixRow {
  return {
    personId: row.person_id,
    personDisplayName: row.person_display_name,
    courseId: row.course_id,
    courseTitle: row.course_title,
    category: row.category as MhdTrainingComplianceMatrixRow['category'],
    status: row.status as MhdTrainingComplianceMatrixRow['status'],
    expiresAt: row.expires_at,
  };
}

function mapMutationResult(row: MhdTrainingMutationRpcRow): MhdMutationResult {
  return { id: row.id, referenceId: row.reference_id };
}

function mapCompletionResult(row: MhdTrainingCompletionResultRpcRow): MhdTrainingCompletionResult {
  return { id: row.id, referenceId: row.reference_id, expiresAt: row.expires_at };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const mhdTrainingService = {
  // ----- LMS v2 content layer -----

  async listCurriculums(companyId: string): Promise<MhdTrainingCurriculum[]> {
    const { data, error } = await supabaseClient.rpc('mhd_training_curriculum_list', {
      p_company_id: companyId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdTrainingCurriculumRpcRow[]).map(mapCurriculum);
  },

  async createCurriculum(input: MhdCreateCurriculumInput): Promise<MhdMutationResult> {
    const { data, error } = await supabaseClient.rpc('mhd_training_curriculum_create', {
      p_company_id: input.companyId,
      p_title: input.title.trim(),
      p_description: trimmedOrUndefined(input.description),
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdTrainingMutationRpcRow[])[0];
    if (!row) throw new Error('Curriculum creation returned no row.');
    return mapMutationResult(row);
  },

  async listPrograms(filters: MhdTrainingProgramFilters): Promise<MhdTrainingProgram[]> {
    if (!filters.companyId) return [];
    const { data, error } = await supabaseClient.rpc('mhd_training_program_list', {
      p_company_id: filters.companyId,
      p_curriculum_id: trimmedOrUndefined(filters.curriculumId),
    });
    if (error) throw error;
    return ((data ?? []) as MhdTrainingProgramRpcRow[]).map(mapProgram);
  },

  async createProgram(input: MhdCreateProgramInput): Promise<MhdMutationResult> {
    const { data, error } = await supabaseClient.rpc('mhd_training_program_create', {
      p_company_id: input.companyId,
      p_title: input.title.trim(),
      p_curriculum_id: trimmedOrUndefined(input.curriculumId),
      p_description: trimmedOrUndefined(input.description),
      p_sort_order: input.sortOrder ?? 0,
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdTrainingMutationRpcRow[])[0];
    if (!row) throw new Error('Program creation returned no row.');
    return mapMutationResult(row);
  },

  async setCourseContentMode(input: MhdSetCourseContentModeInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_course_set_content_mode', {
      p_course_id: input.courseId,
      p_content_mode: input.contentMode,
    });
    if (error) throw error;
  },

  async createCourseModule(input: MhdCreateCourseModuleInput): Promise<MhdTrainingCourseModule> {
    const { data, error } = await supabaseClient.rpc('mhd_training_module_create', {
      p_course_id: input.courseId,
      p_title: input.title.trim(),
      p_description: trimmedOrUndefined(input.description),
      p_sort_order: input.sortOrder ?? 0,
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdTrainingMutationRpcRow[])[0];
    if (!row) throw new Error('Course module creation returned no row.');
    return mapCourseModule(row);
  },

  async createLesson(input: MhdCreateLessonInput): Promise<MhdTrainingLesson> {
    const { data, error } = await supabaseClient.rpc('mhd_training_lesson_create', {
      p_module_id: input.moduleId,
      p_title: input.title.trim(),
      p_description: trimmedOrUndefined(input.description),
      p_sort_order: input.sortOrder ?? 0,
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdTrainingMutationRpcRow[])[0];
    if (!row) throw new Error('Lesson creation returned no row.');
    return mapLesson(row);
  },

  async createBlock(input: MhdCreateBlockInput): Promise<MhdTrainingBlock> {
    const { data, error } = await supabaseClient.rpc('mhd_training_block_create', {
      p_lesson_id: input.lessonId,
      p_block_type: input.blockType,
      p_content: (input.content ?? {}) as Json,
      p_title: trimmedOrUndefined(input.title),
      p_sort_order: input.sortOrder ?? 0,
      p_alt_text: trimmedOrUndefined(input.altText),
      p_transcript: trimmedOrUndefined(input.transcript),
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdTrainingMutationRpcRow[])[0];
    if (!row) throw new Error('Block creation returned no row.');
    return mapBlock(row);
  },

  async forkCourse(input: MhdForkCourseInput): Promise<MhdMutationResult> {
    const { data, error } = await supabaseClient.rpc('mhd_training_course_fork', {
      p_course_id: input.courseId,
      p_company_id: input.companyId,
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdTrainingMutationRpcRow[])[0];
    if (!row) throw new Error('Course fork returned no row.');
    return mapMutationResult(row);
  },

  async submitContentForReview(input: MhdSubmitContentForReviewInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_content_submit_for_review', {
      p_course_id: input.courseId,
    });
    if (error) throw error;
  },
  async approveContent(input: MhdApproveContentInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_content_approve', {
      p_course_id: input.courseId,
      p_review_notes: trimmedOrUndefined(input.reviewNotes),
    });
    if (error) throw error;
  },
  async publishContent(input: MhdPublishContentInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_content_publish', {
      p_course_id: input.courseId,
    });
    if (error) throw error;
  },
  async addPrerequisite(input: MhdPrerequisiteInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_prerequisite_add', {
      p_course_id: input.courseId,
      p_prerequisite_course_id: input.prerequisiteCourseId,
    });
    if (error) throw error;
  },
  async removePrerequisite(input: MhdPrerequisiteInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_prerequisite_remove', {
      p_course_id: input.courseId,
      p_prerequisite_course_id: input.prerequisiteCourseId,
    });
    if (error) throw error;
  },

  // ----- Catalog -----

  /**
   * Company + global courses. `is_global` marks the platform-seeded ones that a
   * tenant admin may read but not edit or retire. `includeInactive` surfaces
   * retired courses (kept for history, dropped off assignment lists by default).
   */
  async listCourses(filters: MhdTrainingCourseFilters): Promise<MhdTrainingCourse[]> {
    if (!filters.companyId) return [];
    const { data, error } = await supabaseClient.rpc('mhd_training_course_list', {
      p_company_id: filters.companyId,
      p_include_inactive: filters.includeInactive ?? false,
    });
    if (error) throw error;
    return ((data ?? []) as MhdTrainingCourseRpcRow[]).map(mapCourse);
  },

  async createCourse(input: MhdCreateCourseInput): Promise<MhdMutationResult> {
    const { data, error } = await supabaseClient.rpc('mhd_training_course_create', {
      p_company_id: input.companyId,
      p_course_key: input.courseKey.trim(),
      p_title: input.title.trim(),
      p_description: trimmedOrUndefined(input.description),
      p_category: input.category ?? 'OTHER',
      p_delivery_mode: input.deliveryMode ?? 'DOCUMENT',
      p_duration_minutes: input.durationMinutes ?? undefined,
      p_recurrence_months: input.recurrenceMonths ?? undefined,
      p_requires_evidence: input.requiresEvidence ?? false,
      p_external_url: trimmedOrUndefined(input.externalUrl),
      p_program_id: input.programId ?? undefined,
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdTrainingMutationRpcRow[])[0];
    if (!row) throw new Error('Course creation returned no row.');
    return mapMutationResult(row);
  },

  /**
   * Update a company course. A global course is refused at the RPC — the UI hides
   * the edit affordance for `isGlobal` rows; this method is the same contract if
   * one slips through. Every param is nullable; the RPC `coalesce`s unset fields.
   */
  async updateCourse(input: MhdUpdateCourseInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_course_update', {
      p_course_id: input.courseId,
      p_title: trimmedOrUndefined(input.title),
      p_description: input.description ?? undefined,
      p_category: input.category ?? undefined,
      p_delivery_mode: input.deliveryMode ?? undefined,
      p_duration_minutes: input.durationMinutes ?? undefined,
      p_recurrence_months: input.recurrenceMonths ?? undefined,
      p_requires_evidence: input.requiresEvidence ?? undefined,
      p_external_url: input.externalUrl ?? undefined,
    });
    if (error) throw error;
  },

  /** Retire or reactivate a company course. Refused for a global course at the RPC. */
  async setCourseActive(input: MhdSetCourseActiveInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_course_set_active', {
      p_course_id: input.courseId,
      p_is_active: input.isActive,
    });
    if (error) throw error;
  },

  // ----- Assignments -----

  /**
   * Assign a course to a person. Fans out to Tasks + Notifications server-side
   * (only when the person has a user account); the caller sees just the minted
   * `(id, reference_id)`.
   */
  async assign(input: MhdAssignTrainingInput): Promise<MhdMutationResult> {
    const { data, error } = await supabaseClient.rpc('mhd_training_assign', {
      p_company_id: input.companyId,
      p_course_id: input.courseId,
      p_person_id: input.personId,
      p_due_date: trimmedOrUndefined(input.dueDate),
      p_source_type: input.sourceType ?? 'MANUAL',
      p_source_id: input.sourceId ?? undefined,
      p_is_emergency_priority: input.isEmergencyPriority ?? false,
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdTrainingMutationRpcRow[])[0];
    if (!row) throw new Error('Training assignment returned no row.');
    return mapMutationResult(row);
  },

  /**
   * List assignments. Admin passes a company (optionally a person / status);
   * the employee surface passes their own company and RLS narrows to their rows.
   * Each row carries a SERVER-DERIVED `compliance_status` — render it, do not
   * recompute compliance client-side.
   */
  async listAssignments(filters: MhdTrainingAssignmentFilters): Promise<MhdTrainingAssignment[]> {
    if (!filters.companyId) return [];
    const { data, error } = await supabaseClient.rpc('mhd_training_list_assignments', {
      p_company_id: filters.companyId,
      p_person_id: trimmedOrUndefined(filters.personId),
      p_status: filterValueOrUndefined(filters.status),
    });
    if (error) throw error;
    return ((data ?? []) as MhdTrainingAssignmentRpcRow[]).map(mapAssignment);
  },

  async listComplianceRules(companyId: string): Promise<MhdTrainingComplianceRule[]> {
    const { data, error } = await supabaseClient.rpc('mhd_training_compliance_rule_list', {
      p_company_id: companyId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdTrainingComplianceRuleRpcRow[]).map(mapComplianceRule);
  },

  async createComplianceRule(
    input: MhdCreateTrainingComplianceRuleInput,
  ): Promise<MhdMutationResult> {
    const { data, error } = await supabaseClient.rpc('mhd_training_compliance_rule_create', {
      p_company_id: input.companyId,
      p_title: input.title.trim(),
      p_target_type: input.targetType,
      p_course_id: input.courseId,
      p_target_department: trimmedOrUndefined(input.targetDepartment),
      p_target_job_id: input.targetJobId ?? undefined,
      p_target_jurisdiction: trimmedOrUndefined(input.targetJurisdiction),
      p_due_offset_days: input.dueOffsetDays ?? undefined,
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdTrainingMutationRpcRow[])[0];
    if (!row) throw new Error('Compliance rule creation returned no row.');
    return mapMutationResult(row);
  },

  async applyComplianceRule(
    input: MhdApplyTrainingComplianceRuleInput,
  ): Promise<MhdTrainingComplianceRuleApplyResult[]> {
    const { data, error } = await supabaseClient.rpc('mhd_training_compliance_rule_apply', {
      p_rule_id: input.ruleId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdTrainingComplianceRuleApplyRpcRow[]).map(
      mapComplianceRuleApplyResult,
    );
  },

  async assignProgram(
    input: MhdAssignTrainingProgramInput,
  ): Promise<MhdTrainingAssignProgramResult[]> {
    const { data, error } = await supabaseClient.rpc('mhd_training_assign_program', {
      p_company_id: input.companyId,
      p_program_id: input.programId,
      p_person_id: input.personId,
      p_due_date: trimmedOrUndefined(input.dueDate),
    });
    if (error) throw error;
    return ((data ?? []) as MhdTrainingAssignProgramRpcRow[]).map(mapAssignProgramResult);
  },

  async requestSelfEnrollment(input: MhdSelfEnrollTrainingInput): Promise<MhdMutationResult> {
    const { data, error } = await supabaseClient.rpc('mhd_training_self_enroll_request', {
      p_company_id: input.companyId,
      p_course_id: input.courseId,
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdTrainingMutationRpcRow[])[0];
    if (!row) throw new Error('Self-enrollment request returned no row.');
    return mapMutationResult(row);
  },

  async listSelfEnrollments(
    input: MhdListTrainingSelfEnrollmentsInput,
  ): Promise<MhdTrainingSelfEnrollmentRequest[]> {
    const { data, error } = await supabaseClient.rpc('mhd_training_self_enroll_list', {
      p_company_id: input.companyId,
      p_status: input.status ?? undefined,
    });
    if (error) throw error;
    return ((data ?? []) as MhdTrainingSelfEnrollmentRequestRpcRow[]).map(
      mapSelfEnrollmentRequest,
    );
  },

  async decideSelfEnrollment(
    input: MhdDecideTrainingSelfEnrollmentInput,
  ): Promise<MhdTrainingSelfEnrollmentDecisionResult> {
    const { data, error } = await supabaseClient.rpc('mhd_training_self_enroll_decide', {
      p_request_id: input.requestId,
      p_approve: input.approve,
      p_notes: trimmedOrUndefined(input.notes),
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdTrainingSelfEnrollmentDecisionRpcRow[])[0];
    return mapSelfEnrollmentDecisionResult(row ?? { assignment_id: null });
  },

  async cancelAssignment(assignmentId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_cancel_assignment', {
      p_assignment_id: assignmentId,
    });
    if (error) throw error;
  },

  /** Waive an assignment. A reason is required at the RPC. */
  async waiveAssignment(input: MhdWaiveAssignmentInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_waive_assignment', {
      p_assignment_id: input.assignmentId,
      p_reason: input.reason.trim(),
    });
    if (error) throw error;
  },

  // ----- Completions -----

  /**
   * Complete an assignment — the frozen-expiry evidence write. Flips the
   * assignment to COMPLETED in the same call. A `requires_evidence` course
   * refuses a bare `ATTESTED` with no attachment; that enforcement is the
   * server's — surface its error, do not pre-empt it. When a certificate is
   * attached the method should be `CERTIFICATE`.
   */
  async complete(input: MhdCompleteTrainingInput): Promise<MhdTrainingCompletionResult> {
    const { data, error } = await supabaseClient.rpc('mhd_training_complete', {
      p_assignment_id: input.assignmentId,
      p_completion_method: input.completionMethod ?? 'ATTESTED',
      p_attachment_id: trimmedOrUndefined(input.attachmentId),
      p_completed_at: trimmedOrUndefined(input.completedAt),
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdTrainingCompletionResultRpcRow[])[0];
    if (!row) throw new Error('Training completion returned no row.');
    return mapCompletionResult(row);
  },

  /**
   * Admin records a past completion for a person with no standing assignment
   * (e.g. training taken before onboarding). Creates a closed assignment + the
   * frozen completion. Admin-only at the RPC.
   */
  async recordAdminCompletion(
    input: MhdRecordAdminCompletionInput,
  ): Promise<MhdTrainingCompletionResult> {
    const { data, error } = await supabaseClient.rpc('mhd_training_record_admin_completion', {
      p_company_id: input.companyId,
      p_course_id: input.courseId,
      p_person_id: input.personId,
      p_completed_at: input.completedAt,
      p_attachment_id: trimmedOrUndefined(input.attachmentId),
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdTrainingCompletionResultRpcRow[])[0];
    if (!row) throw new Error('Admin completion returned no row.');
    return mapCompletionResult(row);
  },

  /**
   * A person's completion history. Each row carries a SERVER-DERIVED `is_expired`
   * — render it, do not re-derive expiry from `expires_at` on the client.
   */
  async listCompletions(
    personId: string,
    courseId?: string | null,
  ): Promise<MhdTrainingCompletion[]> {
    const { data, error } = await supabaseClient.rpc('mhd_training_list_completions', {
      p_person_id: personId,
      p_course_id: trimmedOrUndefined(courseId),
    });
    if (error) throw error;
    return ((data ?? []) as MhdTrainingCompletionRpcRow[]).map(mapCompletion);
  },

  // ----- Compliance (derived, never stored) -----

  /**
   * The consumer contract — one row per course for a person with the derived
   * status and governing dates. This is what Conduct and Safety read; the status
   * is computed server-side and rendered verbatim.
   */
  async compliance(personId: string, courseId?: string | null): Promise<MhdTrainingCompliance[]> {
    const { data, error } = await supabaseClient.rpc('mhd_training_compliance', {
      p_person_id: personId,
      p_course_id: trimmedOrUndefined(courseId),
    });
    if (error) throw error;
    return ((data ?? []) as MhdTrainingComplianceRpcRow[]).map(mapCompliance);
  },

  /**
   * The admin compliance board — company-wide, one row per assignment with its
   * derived status. Admin-only at the RPC.
   */
  async complianceMatrix(
    filters: MhdTrainingComplianceMatrixFilters,
  ): Promise<MhdTrainingComplianceMatrixRow[]> {
    if (!filters.companyId) return [];
    const { data, error } = await supabaseClient.rpc('mhd_training_compliance_matrix', {
      p_company_id: filters.companyId,
      p_category: filterValueOrUndefined(filters.category),
    });
    if (error) throw error;
    return ((data ?? []) as MhdTrainingComplianceMatrixRpcRow[]).map(mapComplianceMatrixRow);
  },
};
