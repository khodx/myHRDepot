import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { Json } from '@/types/database.types';
import {
  MHD_TRAINING_DEFAULT_MAX_SESSION_MINUTES,
  MHD_TRAINING_VIDEO_UPLOAD_FUNCTION_NAME,
} from './Types';
import { mhdToNumber } from './Types';
import {
  mhdTrainingContentTreeSchema,
  mhdTrainingBlockProgressSchema,
  mhdTrainingVideoUploadSchema,
} from './Schemas';
import {
  mhdPollDocumentGenerationUntilGenerated,
  mhdRenderDocumentGeneration,
} from '@/features/documents/Service';
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
  MhdRetireTrainingCourseInput,
  MhdResolveActiveSuccessorInput,
  MhdSetTrainingContentLicenseInput,
  MhdTrainingManagerTeamStatusInput,
  MhdBulkAssignTrainingInput,
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
  MhdTrainingCertificateGenerationResult,
  MhdTrainingCertificateGenerationRpcRow,
  MhdTrainingCompletionRpcRow,
  MhdTrainingCompliance,
  MhdTrainingComplianceMatrixFilters,
  MhdTrainingComplianceMatrixRow,
  MhdTrainingComplianceMatrixRpcRow,
  MhdTrainingComplianceRpcRow,
  MhdTrainingCourse,
  MhdTrainingCourseFilters,
  MhdTrainingCourseRpcRow,
  MhdTrainingManagerTeamStatusRpcRow,
  MhdTrainingManagerTeamStatusRow,
  MhdTrainingBulkAssignRpcRow,
  MhdTrainingBulkAssignResult,
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
  MhdSendTrainingDeadlineRemindersInput,
  MhdTrainingCourseModule,
  MhdTrainingLesson,
  MhdTrainingBlock,
  MhdUpdateCourseInput,
  MhdWaiveAssignmentInput,
  MhdTrainingContentTree,
  MhdTrainingBlockProgress,
  MhdTrainingBlockCompletionResult,
  MhdTrainingVideoUploadFunctionResponse,
  MhdTrainingVideoUploadResult,
  MhdTrainingVideoUploadRequest,
  MhdCreateTrainingExternalAuditorGrantInput,
  MhdSetTrainingTimeOnTaskInput,
  MhdTrainingTimeOnTaskFilters,
  MhdTrainingTimeOnTaskRpcRow,
  MhdTrainingTimeOnTaskRow,
  MhdTrainingLearnerExportBundle,
  MhdTrainingExternalAuditorGrant,
  MhdTrainingExternalAuditorGrantRpcRow,
  MhdTrainingExternalAuditorGrantRevokeInput,
  MhdTrainingExternalAuditorReportRpcRow,
  MhdTrainingExternalAuditorReportRow,
  MhdTrainingBadge,
  MhdTrainingBadgeCreateResult,
  MhdTrainingBadgeRpcRow,
  MhdCreateTrainingBadgeInput,
  MhdAwardTrainingBadgeInput,
  MhdContentFlag,
  MhdContentFlagCreateResult,
  MhdContentFlagRpcRow,
  MhdCreateContentFlagInput,
  MhdListContentFlagsInput,
  MhdResolveContentFlagInput,
  MhdTrainingPeerReview,
  MhdTrainingPeerReviewAssignmentResult,
  MhdTrainingPeerReviewRpcRow,
  MhdAssignTrainingPeerReviewInput,
  MhdSubmitTrainingPeerReviewInput,
  MhdListTrainingPeerReviewsInput,
  MhdTrainingLeaderboardRow,
  MhdTrainingLeaderboardRpcRow,
  MhdTrainingLeaderboardInput,
  MhdSetTrainingLeaderboardOptInInput,
  MhdSubmitTrainingCourseFeedbackInput,
  MhdTrainingCourseFeedbackSummary,
  MhdTrainingCourseFeedbackSummaryRpcRow,
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

function mapManagerTeamStatus(
  row: MhdTrainingManagerTeamStatusRpcRow,
): MhdTrainingManagerTeamStatusRow {
  return {
    personId: row.person_id,
    personDisplayName: row.person_display_name,
    courseId: row.course_id,
    courseTitle: row.course_title,
    status: row.status as MhdTrainingManagerTeamStatusRow['status'],
    complianceStatus: row.compliance_status as MhdTrainingManagerTeamStatusRow['complianceStatus'],
    dueDate: row.due_date,
  };
}

function mapBulkAssignResult(row: MhdTrainingBulkAssignRpcRow): MhdTrainingBulkAssignResult {
  return { personId: row.person_id, assignmentId: row.assignment_id };
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

function mapAssignProgramResult(
  row: MhdTrainingAssignProgramRpcRow,
): MhdTrainingAssignProgramResult {
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

function mapCertificateGenerationResult(
  row: MhdTrainingCertificateGenerationRpcRow,
): MhdTrainingCertificateGenerationResult {
  return { id: row.id, referenceId: row.reference_id, status: row.status };
}

function mapTimeOnTask(row: MhdTrainingTimeOnTaskRpcRow): MhdTrainingTimeOnTaskRow {
  return { personId: row.person_id, blockId: row.block_id, minutes: mhdToNumber(row.minutes) };
}

function mapExternalAuditorGrant(
  row: MhdTrainingExternalAuditorGrantRpcRow,
): MhdTrainingExternalAuditorGrant {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdTrainingExternalAuditorGrant['referenceId'],
  };
}

function mapExternalAuditorReport(
  row: MhdTrainingExternalAuditorReportRpcRow,
): MhdTrainingExternalAuditorReportRow {
  return {
    personId: row.person_id,
    personDisplayName: row.person_display_name,
    status: row.status,
    completedAt: row.completed_at,
  };
}

function mapBadge(row: MhdTrainingBadgeRpcRow): MhdTrainingBadge {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdTrainingBadge['referenceId'],
    title: row.title,
    description: row.description,
    iconKey: row.icon_key,
    isGlobal: row.is_global,
  };
}
function mapContentFlag(row: MhdContentFlagRpcRow): MhdContentFlag {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdContentFlag['referenceId'],
    entityType: row.entity_type as MhdContentFlag['entityType'],
    entityId: row.entity_id,
    reason: row.reason,
    status: row.status as MhdContentFlag['status'],
    createdAt: row.created_at,
  };
}
function mapPeerReview(row: MhdTrainingPeerReviewRpcRow): MhdTrainingPeerReview {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdTrainingPeerReview['referenceId'],
    reviewerPersonId: row.reviewer_person_id,
    rubricScore: mhdToNumber(row.rubric_score),
    feedback: row.feedback,
    status: row.status as MhdTrainingPeerReview['status'],
    submittedAt: row.submitted_at,
  };
}
function mapLeaderboardRow(row: MhdTrainingLeaderboardRpcRow): MhdTrainingLeaderboardRow {
  return {
    personId: row.person_id,
    personDisplayName: row.person_display_name,
    totalPoints: mhdToNumber(row.total_points),
    currentStreakDays: mhdToNumber(row.current_streak_days),
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const mhdTrainingService = {
  // ----- LMS v2 content layer -----

  async getCourseContentTree(courseId: string): Promise<MhdTrainingContentTree> {
    const { data, error } = await supabaseClient.rpc('mhd_training_course_content_tree', {
      p_course_id: courseId,
    });
    if (error) throw error;
    return mhdTrainingContentTreeSchema.parse(data ?? []);
  },

  async uploadVideo(request: MhdTrainingVideoUploadRequest): Promise<MhdTrainingVideoUploadResult> {
    const { blockId, file } = mhdTrainingVideoUploadSchema.parse(request);

    // 1. Ask the edge function for a short-lived presigned PUT URL.
    const { data: upload, error: uploadError } =
      await supabaseClient.functions.invoke<MhdTrainingVideoUploadFunctionResponse>(
        MHD_TRAINING_VIDEO_UPLOAD_FUNCTION_NAME,
        {
          body: {
            block_id: blockId,
            original_file_name: file.name,
            mime_type: file.type,
            file_size_bytes: file.size,
          },
        },
      );
    if (uploadError) throw new Error(uploadError.message || 'Video upload failed.');
    if (!upload?.uploadUrl || !upload.objectKey || !upload.publicUrl) {
      throw new Error('Video upload function returned an incomplete payload.');
    }

    // 2. Upload the raw bytes directly to R2 using the signed URL.
    const response = await fetch(upload.uploadUrl, { method: 'PUT', body: file });
    if (!response.ok) {
      throw new Error(`Video upload failed with HTTP ${response.status}.`);
    }

    // 3. Persist the uploaded object metadata and update the block server-side.
    const { data, error } = await supabaseClient.rpc('mhd_training_video_asset_record', {
      p_block_id: blockId,
      p_object_key: upload.objectKey,
      p_original_file_name: file.name,
      p_mime_type: file.type,
      p_file_size_bytes: file.size,
      p_public_url: upload.publicUrl,
    });
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as { id?: string } | null;
    if (!row?.id) throw new Error('Video asset record returned no id.');

    return { id: row.id, objectKey: upload.objectKey, publicUrl: upload.publicUrl };
  },

  async getBlockProgress(assignmentId: string): Promise<MhdTrainingBlockProgress[]> {
    const { data, error } = await supabaseClient.rpc('mhd_training_block_progress_get', {
      p_assignment_id: assignmentId,
    });
    if (error) throw error;
    return ((data ?? []) as unknown[]).map((value) => {
      const row = mhdTrainingBlockProgressSchema.parse(value);
      return {
        blockId: row.block_id,
        status: row.status,
        response: row.response,
        startedAt: row.started_at,
        completedAt: row.completed_at,
      };
    });
  },

  async startBlock(assignmentId: string, blockId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_block_start', {
      p_assignment_id: assignmentId,
      p_block_id: blockId,
    });
    if (error) throw error;
  },

  async completeBlock(
    assignmentId: string,
    blockId: string,
    response?: Record<string, unknown>,
  ): Promise<MhdTrainingBlockCompletionResult> {
    const { data, error } = await supabaseClient.rpc('mhd_training_block_complete', {
      p_assignment_id: assignmentId,
      p_block_id: blockId,
      p_response: (response ?? null) as Json,
    });
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as { course_completed?: boolean } | null;
    return { courseCompleted: row?.course_completed === true };
  },

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

  async retireCourse(input: MhdRetireTrainingCourseInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_course_retire', {
      p_course_id: input.courseId,
      p_successor_course_id: input.successorCourseId ?? undefined,
    });
    if (error) throw error;
  },

  async resolveActiveSuccessor(input: MhdResolveActiveSuccessorInput): Promise<string> {
    const { data, error } = await supabaseClient.rpc('mhd_training_resolve_active_successor', {
      p_course_id: input.courseId,
    });
    if (error) throw error;
    return data as string;
  },

  async setContentLicense(input: MhdSetTrainingContentLicenseInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_content_license_set', {
      p_company_id: input.companyId,
      p_course_id: input.courseId,
      p_expires_at: input.expiresAt,
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

  async bulkAssign(input: MhdBulkAssignTrainingInput): Promise<MhdTrainingBulkAssignResult[]> {
    const { data, error } = await supabaseClient.rpc('mhd_training_bulk_assign', {
      p_company_id: input.companyId,
      p_course_id: input.courseId,
      p_person_ids: input.personIds,
      p_due_date: input.dueDate ?? undefined,
    });
    if (error) throw error;
    return ((data ?? []) as MhdTrainingBulkAssignRpcRow[]).map(mapBulkAssignResult);
  },

  async managerTeamStatus(
    input: MhdTrainingManagerTeamStatusInput,
  ): Promise<MhdTrainingManagerTeamStatusRow[]> {
    const { data, error } = await supabaseClient.rpc('mhd_training_manager_team_status', {
      p_manager_person_id: input.managerPersonId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdTrainingManagerTeamStatusRpcRow[]).map(mapManagerTeamStatus);
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

  async sendDeadlineReminders(input: MhdSendTrainingDeadlineRemindersInput): Promise<number> {
    const { data, error } = await supabaseClient.rpc('mhd_training_send_deadline_reminders', {
      p_company_id: input.companyId,
      p_days_before: input.daysBefore ?? 7,
    });
    if (error) throw error;
    return mhdToNumber(data as number | string | null);
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
    return ((data ?? []) as MhdTrainingSelfEnrollmentRequestRpcRow[]).map(mapSelfEnrollmentRequest);
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

  /** Generate a PDF certificate through the shared document engine lifecycle. */
  async generateCertificate(completionId: string): Promise<MhdTrainingCertificateGenerationResult> {
    const { data, error } = await supabaseClient.rpc('mhd_training_certificate_generate', {
      p_completion_id: completionId,
    });
    if (error) throw error;

    const row = ((data ?? []) as unknown as MhdTrainingCertificateGenerationRpcRow[])[0];
    if (!row) throw new Error('Training certificate generation returned no row.');

    const requested = mapCertificateGenerationResult(row);
    await mhdRenderDocumentGeneration(requested.id, 'Training certificate render');
    const generated = await mhdPollDocumentGenerationUntilGenerated(requested.id, {
      timeoutHint: 'Retry the certificate generation once rendering finishes.',
    });

    return { ...requested, status: generated.status };
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

  // ----- Audit engine -----

  async setTimeOnTask(input: MhdSetTrainingTimeOnTaskInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_time_on_task_set', {
      p_company_id: input.companyId,
      p_max_session_minutes: input.maxSessionMinutes ?? MHD_TRAINING_DEFAULT_MAX_SESSION_MINUTES,
    });
    if (error) throw error;
  },

  async timeOnTaskReport(
    filters: MhdTrainingTimeOnTaskFilters,
  ): Promise<MhdTrainingTimeOnTaskRow[]> {
    if (!filters.companyId) return [];
    const { data, error } = await supabaseClient.rpc('mhd_training_time_on_task_report', {
      p_company_id: filters.companyId,
      p_person_id: trimmedOrUndefined(filters.personId),
      p_from: trimmedOrUndefined(filters.from),
      p_to: trimmedOrUndefined(filters.to),
    });
    if (error) throw error;
    return ((data ?? []) as MhdTrainingTimeOnTaskRpcRow[]).map(mapTimeOnTask);
  },

  async learnerExport(personId: string): Promise<MhdTrainingLearnerExportBundle> {
    const { data, error } = await supabaseClient.rpc('mhd_training_learner_export', {
      p_person_id: personId,
    });
    if (error) throw error;
    return (data ?? {
      assignments: [],
      completions: [],
      blockProgress: [],
      assessmentAttempts: [],
      auditStatements: [],
    }) as unknown as MhdTrainingLearnerExportBundle;
  },

  async createExternalAuditorGrant(
    input: MhdCreateTrainingExternalAuditorGrantInput,
  ): Promise<MhdTrainingExternalAuditorGrant> {
    const { data, error } = await supabaseClient.rpc('mhd_training_external_auditor_grant_create', {
      p_company_id: input.companyId,
      p_course_id: input.courseId,
      p_auditor_label: input.auditorLabel.trim(),
      p_valid_until: input.validUntil,
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdTrainingExternalAuditorGrantRpcRow[])[0];
    if (!row) throw new Error('External auditor grant creation returned no row.');
    return mapExternalAuditorGrant(row);
  },

  async revokeExternalAuditorGrant(
    input: MhdTrainingExternalAuditorGrantRevokeInput,
  ): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_external_auditor_grant_revoke', {
      p_grant_id: input.grantId,
    });
    if (error) throw error;
  },

  async externalAuditorReport(grantId: string): Promise<MhdTrainingExternalAuditorReportRow[]> {
    const { data, error } = await supabaseClient.rpc('mhd_training_external_auditor_report', {
      p_grant_id: grantId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdTrainingExternalAuditorReportRpcRow[]).map(mapExternalAuditorReport);
  },

  // ----- LMS v2 engagement and social features -----

  async pointsBalance(personId: string): Promise<number> {
    const { data, error } = await supabaseClient.rpc('mhd_training_points_balance', {
      p_person_id: personId,
    });
    if (error) throw error;
    return mhdToNumber(data as number | string | null);
  },
  async createBadge(input: MhdCreateTrainingBadgeInput): Promise<MhdTrainingBadgeCreateResult> {
    const { data, error } = await supabaseClient.rpc('mhd_training_badge_create', {
      p_company_id: input.companyId,
      p_title: input.title.trim(),
      p_description: trimmedOrUndefined(input.description),
      p_icon_key: input.iconKey?.trim() || 'award',
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdTrainingBadgeRpcRow[])[0];
    if (!row) throw new Error('Badge creation returned no row.');
    return {
      id: row.id,
      referenceId: row.reference_id as MhdTrainingBadgeCreateResult['referenceId'],
    };
  },
  async listBadges(companyId: string): Promise<MhdTrainingBadge[]> {
    const { data, error } = await supabaseClient.rpc('mhd_training_badge_list', {
      p_company_id: companyId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdTrainingBadgeRpcRow[]).map(mapBadge);
  },
  async awardBadge(input: MhdAwardTrainingBadgeInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_badge_award', {
      p_badge_id: input.badgeId,
      p_person_id: input.personId,
      p_reason: trimmedOrUndefined(input.reason),
    });
    if (error) throw error;
  },
  async setLeaderboardOptIn(input: MhdSetTrainingLeaderboardOptInInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_leaderboard_opt_in', {
      p_opted_in: input.optedIn,
    });
    if (error) throw error;
  },
  async leaderboard(input: MhdTrainingLeaderboardInput): Promise<MhdTrainingLeaderboardRow[]> {
    const { data, error } = await supabaseClient.rpc('mhd_training_leaderboard', {
      p_company_id: input.companyId,
      p_limit: input.limit ?? 20,
    });
    if (error) throw error;
    return ((data ?? []) as MhdTrainingLeaderboardRpcRow[]).map(mapLeaderboardRow);
  },
  async createContentFlag(input: MhdCreateContentFlagInput): Promise<MhdContentFlagCreateResult> {
    const { data, error } = await supabaseClient.rpc('mhd_content_flag_create', {
      p_entity_type: input.entityType,
      p_entity_id: input.entityId,
      p_reason: input.reason.trim(),
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdContentFlagRpcRow[])[0];
    if (!row) throw new Error('Content flag creation returned no row.');
    return {
      id: row.id,
      referenceId: row.reference_id as MhdContentFlagCreateResult['referenceId'],
    };
  },
  async listContentFlags(input: MhdListContentFlagsInput): Promise<MhdContentFlag[]> {
    const { data, error } = await supabaseClient.rpc('mhd_content_flag_list', {
      p_company_id: input.companyId,
      p_status: input.status ?? 'PENDING',
    });
    if (error) throw error;
    return ((data ?? []) as MhdContentFlagRpcRow[]).map(mapContentFlag);
  },
  async resolveContentFlag(input: MhdResolveContentFlagInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_content_flag_resolve', {
      p_flag_id: input.flagId,
      p_action: input.action,
      p_notes: trimmedOrUndefined(input.notes),
    });
    if (error) throw error;
  },
  async assignPeerReview(
    input: MhdAssignTrainingPeerReviewInput,
  ): Promise<MhdTrainingPeerReviewAssignmentResult> {
    const { data, error } = await supabaseClient.rpc('mhd_training_peer_review_assign', {
      p_block_progress_id: input.blockProgressId,
      p_reviewer_person_id: input.reviewerPersonId,
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdTrainingMutationRpcRow[])[0];
    if (!row) throw new Error('Peer review assignment returned no row.');
    return {
      id: row.id,
      referenceId: row.reference_id as MhdTrainingPeerReviewAssignmentResult['referenceId'],
    };
  },
  async submitPeerReview(input: MhdSubmitTrainingPeerReviewInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_peer_review_submit', {
      p_review_id: input.reviewId,
      p_rubric_score: input.rubricScore,
      p_feedback: input.feedback.trim(),
    });
    if (error) throw error;
  },
  async listPeerReviews(input: MhdListTrainingPeerReviewsInput): Promise<MhdTrainingPeerReview[]> {
    const { data, error } = await supabaseClient.rpc('mhd_training_peer_review_list', {
      p_block_progress_id: input.blockProgressId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdTrainingPeerReviewRpcRow[]).map(mapPeerReview);
  },
  async submitCourseFeedback(input: MhdSubmitTrainingCourseFeedbackInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_course_feedback_submit', {
      p_course_id: input.courseId,
      p_rating: input.rating,
      p_comments: trimmedOrUndefined(input.comments),
    });
    if (error) throw error;
  },
  async courseFeedbackSummary(courseId: string): Promise<MhdTrainingCourseFeedbackSummary> {
    const { data, error } = await supabaseClient.rpc('mhd_training_course_feedback_summary', {
      p_course_id: courseId,
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdTrainingCourseFeedbackSummaryRpcRow[])[0];
    if (!row) return { averageRating: 0, responseCount: 0 };
    return {
      averageRating: mhdToNumber(row.average_rating),
      responseCount: mhdToNumber(row.response_count),
    };
  },
};
