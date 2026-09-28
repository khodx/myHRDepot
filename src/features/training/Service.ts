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
  mhdTrainingScenarioGraphSchema,
  mhdTrainingScenarioAiResponseSchema,
  mhdTrainingScenarioAiTranscriptSchema,
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
  MhdUpdateCurriculumInput,
  MhdCreateProgramInput,
  MhdUpdateProgramInput,
  MhdCreateCourseModuleInput,
  MhdUpdateCourseModuleInput,
  MhdCreateLessonInput,
  MhdUpdateLessonInput,
  MhdCreateBlockInput,
  MhdUpdateBlockInput,
  MhdTrainingBlockTranslationRpcRow,
  MhdTrainingBlockTranslation,
  MhdUpsertBlockTranslationInput,
  MhdDeleteBlockTranslationInput,
  MhdUpdateScenarioNodeInput,
  MhdUpdateScenarioChoiceInput,
  MhdSetCourseContentModeInput,
  MhdForkCourseInput,
  MhdApproveContentInput,
  MhdSubmitContentForReviewInput,
  MhdPublishContentInput,
  MhdPrerequisiteInput,
  MhdTrainingPrerequisite,
  MhdTrainingPrerequisiteRpcRow,
  MhdTrainingContentApproval,
  MhdTrainingContentApprovalRpcRow,
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
  MhdTrainingScenarioGraph,
  MhdTrainingScenarioAiResponse,
  MhdTrainingScenarioAiTurn,
  MhdCreateTrainingScenarioNodeInput,
  MhdCreateTrainingScenarioChoiceInput,
  MhdRecordTrainingScenarioVisitInput,
  MhdRespondToTrainingScenarioAiInput,
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
  MhdListTrainingExternalAuditorGrantsInput,
  MhdTrainingExternalAuditorGrantListRpcRow,
  MhdTrainingExternalAuditorGrantListRow,
  MhdTrainingExternalAuditorGrantId,
  MhdTrainingExternalAuditorGrantReferenceId,
  MhdListTrainingContentLicensesInput,
  MhdTrainingContentLicenseRpcRow,
  MhdTrainingContentLicenseRow,
  MhdGetTrainingTimeOnTaskInput,
  MhdTrainingTimeOnTaskSettingsRpcRow,
  MhdTrainingTimeOnTaskSettings,
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
  MhdTrainingPeerReviewCandidateRpcRow,
  MhdTrainingPeerReviewCandidate,
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
  MhdCreateTrainingIltSessionInput,
  MhdTrainingIltSession,
  MhdTrainingIltSessionCreateRpcRow,
  MhdTrainingIltSessionRpcRow,
  MhdTrainingIltSessionByCompanyRpcRow,
  MhdTrainingIltSessionSummary,
  MhdTrainingIltRosterRpcRow,
  MhdTrainingIltRosterEntry,
  MhdEnrollTrainingIltInput,
  MhdTrainingIltEnrollmentResult,
  MhdTrainingIltEnrollmentRpcRow,
  MhdCancelTrainingIltEnrollmentInput,
  MhdTrainingIltAttendanceInput,
  MhdTrainingIltAttendanceOverrideInput,
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
    retiredAt: row.retired_at,
    successorCourseId: row.successor_course_id,
    successorCourseTitle: row.successor_course_title,
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
    isActive: row.is_active,
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
  return {
    id: row.id,
    referenceId: row.reference_id,
    status: row.status,
    certificateId: row.certificate_id,
    verificationCode: row.verification_code,
    outputDriveFileId: null,
  };
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

function mapIltSession(row: MhdTrainingIltSessionRpcRow): MhdTrainingIltSession {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdTrainingIltSession['referenceId'],
    sessionDate: row.session_date,
    startTime: row.start_time,
    endTime: row.end_time,
    instructorName: row.instructor_name,
    roomOrResourceLabel: row.room_or_resource_label,
    capacity: row.capacity == null ? null : mhdToNumber(row.capacity),
    meetingProvider: row.meeting_provider as MhdTrainingIltSession['meetingProvider'],
    isCancelled: row.is_cancelled,
    enrolledCount: mhdToNumber(row.enrolled_count),
    waitlistedCount: mhdToNumber(row.waitlisted_count),
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

  async createIltSession(input: MhdCreateTrainingIltSessionInput): Promise<MhdMutationResult> {
    const { data, error } = await supabaseClient.rpc('mhd_training_ilt_session_create', {
      p_company_id: input.companyId,
      p_course_id: input.courseId,
      p_session_date: input.sessionDate,
      p_start_time: input.startTime,
      p_end_time: input.endTime,
      p_instructor_name: input.instructorName.trim(),
      p_instructor_person_id: input.instructorPersonId ?? undefined,
      p_room_or_resource_label: trimmedOrUndefined(input.roomOrResourceLabel),
      p_capacity: input.capacity ?? undefined,
      p_meeting_provider: input.meetingProvider ?? 'NONE',
      p_meeting_join_url: trimmedOrUndefined(input.meetingJoinUrl),
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdTrainingIltSessionCreateRpcRow[])[0];
    if (!row) throw new Error('ILT session creation returned no row.');
    return mapMutationResult(row);
  },

  async listIltSessions(courseId: string): Promise<MhdTrainingIltSession[]> {
    const { data, error } = await supabaseClient.rpc('mhd_training_ilt_session_list', {
      p_course_id: courseId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdTrainingIltSessionRpcRow[]).map(mapIltSession);
  },

  async listIltSessionsByCompany(
    companyId: string,
    includeCancelled = false,
  ): Promise<MhdTrainingIltSessionSummary[]> {
    const { data, error } = await supabaseClient.rpc('mhd_training_ilt_session_list_by_company', {
      p_company_id: companyId,
      p_include_cancelled: includeCancelled,
    });
    if (error) throw error;
    return ((data ?? []) as MhdTrainingIltSessionByCompanyRpcRow[]).map((row) => ({
      ...mapIltSession(row),
      courseId: row.course_id,
      courseTitle: row.course_title,
    }));
  },

  async listIltRoster(sessionId: string): Promise<MhdTrainingIltRosterEntry[]> {
    const { data, error } = await supabaseClient.rpc('mhd_training_ilt_roster_list', {
      p_session_id: sessionId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdTrainingIltRosterRpcRow[]).map((row) => ({
      enrollmentId: row.enrollment_id as MhdTrainingIltRosterEntry['enrollmentId'],
      personId: row.person_id,
      personDisplayName: row.person_display_name,
      status: row.status,
      enrolledAt: row.enrolled_at,
      checkInAt: row.check_in_at,
      checkOutAt: row.check_out_at,
      attendanceSource: row.attendance_source as MhdTrainingIltRosterEntry['attendanceSource'],
      overrideReason: row.override_reason,
    }));
  },

  // The enroll RPC chooses ENROLLED vs WAITLISTED server-side and also creates
  // the learner's existing calendar_events entry; this layer does not invent a
  // separate training calendar concept.
  async enrollIlt(input: MhdEnrollTrainingIltInput): Promise<MhdTrainingIltEnrollmentResult> {
    const { data, error } = await supabaseClient.rpc('mhd_training_ilt_enroll', {
      p_session_id: input.sessionId,
      p_person_id: input.personId,
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdTrainingIltEnrollmentRpcRow[])[0];
    if (!row) throw new Error('ILT enrollment returned no row.');
    return { id: row.id, status: row.status as MhdTrainingIltEnrollmentResult['status'] };
  },

  async cancelIltEnrollment(input: MhdCancelTrainingIltEnrollmentInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_ilt_cancel_enrollment', {
      p_enrollment_id: input.enrollmentId,
    });
    if (error) throw error;
  },

  async checkInIlt(input: MhdTrainingIltAttendanceInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_ilt_check_in', {
      p_session_id: input.sessionId,
      p_person_id: input.personId,
    });
    if (error) throw error;
  },

  async checkOutIlt(input: MhdTrainingIltAttendanceInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_ilt_check_out', {
      p_session_id: input.sessionId,
      p_person_id: input.personId,
    });
    if (error) throw error;
  },

  // Attendance overrides are intentionally separate from ordinary check-in/out
  // and always carry a required reason. No provider attendance sync exists yet.
  async overrideIltAttendance(input: MhdTrainingIltAttendanceOverrideInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_ilt_attendance_override', {
      p_session_id: input.sessionId,
      p_person_id: input.personId,
      p_check_in_at: input.checkInAt,
      p_check_out_at: input.checkOutAt,
      p_reason: input.reason.trim(),
    });
    if (error) throw error;
  },

  async getCourseContentTree(courseId: string): Promise<MhdTrainingContentTree> {
    const { data, error } = await supabaseClient.rpc('mhd_training_course_content_tree', {
      p_course_id: courseId,
    });
    if (error) throw error;
    return mhdTrainingContentTreeSchema.parse(data ?? []);
  },

  async getScenarioGraph(blockId: string): Promise<MhdTrainingScenarioGraph> {
    const { data, error } = await supabaseClient.rpc('mhd_training_scenario_graph', {
      p_block_id: blockId,
    });
    if (error) throw error;
    return mhdTrainingScenarioGraphSchema.parse(data ?? []);
  },

  async recordScenarioVisit(input: MhdRecordTrainingScenarioVisitInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_scenario_record_visit', {
      p_block_progress_id: input.blockProgressId,
      p_node_id: input.nodeId,
      p_choice_id: input.choiceId ?? undefined,
    });
    if (error) throw error;
  },

  async respondToAiConversation(input: MhdRespondToTrainingScenarioAiInput): Promise<MhdTrainingScenarioAiResponse> {
    const { data, error } = await supabaseClient.rpc('mhd_training_scenario_ai_respond', {
      p_block_progress_id: input.blockProgressId,
      p_node_id: input.nodeId,
      p_learner_message: input.learnerMessage,
    });
    if (error) throw error;
    const row = mhdTrainingScenarioAiResponseSchema.parse(Array.isArray(data) ? data[0] : data);
    return {
      learnerTurnRecorded: row.learner_turn_recorded,
      aiAvailable: row.ai_available,
      message: row.message,
    };
  },

  async getAiTranscript(blockProgressId: string): Promise<MhdTrainingScenarioAiTurn[]> {
    const { data, error } = await supabaseClient.rpc('mhd_training_scenario_ai_transcript', {
      p_block_progress_id: blockProgressId,
    });
    if (error) throw error;
    return ((data ?? []) as unknown[]).map((value) => {
      const row = mhdTrainingScenarioAiTranscriptSchema.parse(value);
      return { turnNumber: row.turn_number, role: row.role, message: row.message, createdAt: row.created_at };
    });
  },

  async createScenarioNode(input: MhdCreateTrainingScenarioNodeInput): Promise<string> {
    const { data, error } = await supabaseClient.rpc('mhd_training_scenario_node_create', {
      p_block_id: input.blockId,
      p_node_key: input.nodeKey,
      p_content: (input.content ?? {}) as Json,
      p_is_start: input.isStart ?? false,
      p_is_terminal: input.isTerminal ?? false,
      p_node_type: input.nodeType ?? 'AUTHORED',
      p_scenario_contract: (input.scenarioContract ?? null) as Json,
    });
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as { id?: string } | null;
    if (!row?.id) throw new Error('Scenario node create returned no id.');
    return row.id;
  },

  async createScenarioChoice(input: MhdCreateTrainingScenarioChoiceInput): Promise<string> {
    const { data, error } = await supabaseClient.rpc('mhd_training_scenario_choice_create', {
      p_node_id: input.nodeId,
      p_label: input.label,
      p_next_node_id: input.nextNodeId ?? undefined,
      p_feedback_text: input.feedbackText ?? undefined,
      p_score_delta: input.scoreDelta ?? undefined,
      p_sort_order: input.sortOrder ?? 0,
    });
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as { id?: string } | null;
    if (!row?.id) throw new Error('Scenario choice create returned no id.');
    return row.id;
  },

  async updateScenarioNode(input: MhdUpdateScenarioNodeInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_scenario_node_update', {
      p_node_id: input.nodeId,
      p_node_key: input.nodeKey ?? undefined,
      p_content: (input.content ?? undefined) as Json | undefined,
      p_is_start: input.isStart ?? undefined,
      p_is_terminal: input.isTerminal ?? undefined,
      p_scenario_contract: (input.scenarioContract ?? undefined) as Json | undefined,
    });
    if (error) throw error;
  },

  async deleteScenarioNode(nodeId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_scenario_node_delete', {
      p_node_id: nodeId,
    });
    if (error) throw error;
  },

  async updateScenarioChoice(input: MhdUpdateScenarioChoiceInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_scenario_choice_update', {
      p_choice_id: input.choiceId,
      p_label: input.label ?? undefined,
      p_next_node_id: input.nextNodeId ?? undefined,
      p_feedback_text: input.feedbackText ?? undefined,
      p_score_delta: input.scoreDelta ?? undefined,
      p_sort_order: input.sortOrder ?? undefined,
    });
    if (error) throw error;
  },

  async deleteScenarioChoice(choiceId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_scenario_choice_delete', {
      p_choice_id: choiceId,
    });
    if (error) throw error;
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
        id: row.id,
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

  async listCurriculums(companyId: string, includeInactive = false): Promise<MhdTrainingCurriculum[]> {
    const { data, error } = await supabaseClient.rpc('mhd_training_curriculum_list', {
      p_company_id: companyId,
      p_include_inactive: includeInactive,
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

  async updateCurriculum(input: MhdUpdateCurriculumInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_curriculum_update', {
      p_curriculum_id: input.curriculumId,
      p_title: trimmedOrUndefined(input.title),
      p_description: input.description ?? undefined,
      p_is_active: input.isActive ?? undefined,
    });
    if (error) throw error;
  },

  async deleteCurriculum(curriculumId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_curriculum_delete', {
      p_curriculum_id: curriculumId,
    });
    if (error) throw error;
  },

  async listPrograms(filters: MhdTrainingProgramFilters): Promise<MhdTrainingProgram[]> {
    if (!filters.companyId) return [];
    const { data, error } = await supabaseClient.rpc('mhd_training_program_list', {
      p_company_id: filters.companyId,
      p_curriculum_id: trimmedOrUndefined(filters.curriculumId),
      p_include_inactive: filters.includeInactive ?? false,
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

  async updateProgram(input: MhdUpdateProgramInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_program_update', {
      p_program_id: input.programId,
      p_title: trimmedOrUndefined(input.title),
      p_description: input.description ?? undefined,
      p_curriculum_id: input.curriculumId ?? undefined,
      p_sort_order: input.sortOrder ?? undefined,
      p_is_active: input.isActive ?? undefined,
      p_clear_curriculum_id: input.clearCurriculumId ?? false,
    });
    if (error) throw error;
  },

  async deleteProgram(programId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_program_delete', {
      p_program_id: programId,
    });
    if (error) throw error;
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

  async updateCourseModule(input: MhdUpdateCourseModuleInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_module_update', {
      p_module_id: input.moduleId,
      p_title: trimmedOrUndefined(input.title),
      p_description: input.description ?? undefined,
      p_sort_order: input.sortOrder ?? undefined,
    });
    if (error) throw error;
  },

  async deleteCourseModule(moduleId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_module_delete', {
      p_module_id: moduleId,
    });
    if (error) throw error;
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

  async updateLesson(input: MhdUpdateLessonInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_lesson_update', {
      p_lesson_id: input.lessonId,
      p_title: trimmedOrUndefined(input.title),
      p_description: input.description ?? undefined,
      p_sort_order: input.sortOrder ?? undefined,
    });
    if (error) throw error;
  },

  async deleteLesson(lessonId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_lesson_delete', {
      p_lesson_id: lessonId,
    });
    if (error) throw error;
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

  async updateBlock(input: MhdUpdateBlockInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_block_update', {
      p_block_id: input.blockId,
      p_title: input.title ?? undefined,
      p_content: (input.content ?? undefined) as Json | undefined,
      p_alt_text: input.altText ?? undefined,
      p_transcript: input.transcript ?? undefined,
      p_sort_order: input.sortOrder ?? undefined,
    });
    if (error) throw error;
  },

  async deleteBlock(blockId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_block_delete', {
      p_block_id: blockId,
    });
    if (error) throw error;
  },

  async listBlockTranslations(blockId: string): Promise<MhdTrainingBlockTranslation[]> {
    const { data, error } = await supabaseClient.rpc('mhd_training_block_translation_list', {
      p_block_id: blockId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdTrainingBlockTranslationRpcRow[]).map((row) => ({
      id: row.id,
      locale: row.locale,
      content: row.content,
      altText: row.alt_text,
      transcript: row.transcript,
      updatedAt: row.updated_at,
    }));
  },

  async upsertBlockTranslation(input: MhdUpsertBlockTranslationInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_block_translation_upsert', {
      p_block_id: input.blockId,
      p_locale: input.locale.trim(),
      p_content: (input.content ?? {}) as Json,
      // The generated RPC arg type omits `null` even though both SQL parameters are
      // genuinely nullable (default null) -- same documented `as never` compatibility
      // cast used elsewhere in this file for a generated type stricter than the real
      // SQL contract.
      p_alt_text: (input.altText ?? null) as never,
      p_transcript: (input.transcript ?? null) as never,
    });
    if (error) throw error;
  },

  async deleteBlockTranslation(input: MhdDeleteBlockTranslationInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_block_translation_delete', {
      p_translation_id: input.translationId,
    });
    if (error) throw error;
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

  async listPrerequisites(courseId: string): Promise<MhdTrainingPrerequisite[]> {
    const { data, error } = await supabaseClient.rpc('mhd_training_prerequisite_list', {
      p_course_id: courseId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdTrainingPrerequisiteRpcRow[]).map((row) => ({
      prerequisiteCourseId: row.prerequisite_course_id,
      prerequisiteTitle: row.prerequisite_title,
      prerequisiteCourseKey: row.prerequisite_course_key,
      createdAt: row.created_at,
    }));
  },

  async listContentApprovals(courseId: string): Promise<MhdTrainingContentApproval[]> {
    const { data, error } = await supabaseClient.rpc('mhd_training_content_approval_list', {
      p_course_id: courseId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdTrainingContentApprovalRpcRow[]).map((row) => ({
      id: row.id,
      fromStatus: row.from_status,
      toStatus: row.to_status,
      contentVersion: row.content_version,
      reviewNotes: row.review_notes,
      reviewedByName: row.reviewed_by_name,
      createdAt: row.created_at,
    }));
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
      p_program_id: input.programId ?? undefined,
      p_clear_program_id: input.clearProgramId ?? false,
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

  async listContentLicenses(
    input: MhdListTrainingContentLicensesInput,
  ): Promise<MhdTrainingContentLicenseRow[]> {
    const { data, error } = await supabaseClient.rpc('mhd_training_content_license_list', {
      p_company_id: input.companyId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdTrainingContentLicenseRpcRow[]).map((row) => ({
      courseId: row.course_id,
      courseTitle: row.course_title,
      isActive: row.is_active,
      expiresAt: row.expires_at,
      updatedAt: row.updated_at,
    }));
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

    return {
      ...requested,
      status: generated.status,
      outputDriveFileId: generated.output_drive_file_id,
    };
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

  async getTimeOnTask(
    input: MhdGetTrainingTimeOnTaskInput,
  ): Promise<MhdTrainingTimeOnTaskSettings> {
    const { data, error } = await supabaseClient.rpc('mhd_training_time_on_task_get', {
      p_company_id: input.companyId,
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdTrainingTimeOnTaskSettingsRpcRow[])[0];
    return {
      maxSessionMinutes: row?.max_session_minutes ?? MHD_TRAINING_DEFAULT_MAX_SESSION_MINUTES,
      updatedAt: row?.updated_at ?? null,
    };
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

  async listExternalAuditorGrants(
    input: MhdListTrainingExternalAuditorGrantsInput,
  ): Promise<MhdTrainingExternalAuditorGrantListRow[]> {
    const { data, error } = await supabaseClient.rpc('mhd_training_external_auditor_grant_list', {
      p_company_id: input.companyId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdTrainingExternalAuditorGrantListRpcRow[]).map((row) => ({
      id: row.id as MhdTrainingExternalAuditorGrantId,
      referenceId: row.reference_id as MhdTrainingExternalAuditorGrantReferenceId,
      courseId: row.course_id,
      courseTitle: row.course_title,
      auditorLabel: row.auditor_label,
      validFrom: row.valid_from,
      validUntil: row.valid_until,
      revokedAt: row.revoked_at,
      createdAt: row.created_at,
    }));
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
      // undefined ("not specified") defaults to the RPC's own PENDING default;
      // explicit null must pass through unchanged to actually mean "every status" --
      // coalescing null to 'PENDING' here would make "show all" impossible to
      // request at all, which is exactly the bug this comment exists to prevent.
      // The generated RPC arg type omits `null` even though the SQL parameter is
      // genuinely nullable (default 'PENDING', but `p_status is null` is checked
      // in the WHERE clause) -- same documented `as never` compatibility cast used
      // elsewhere in this codebase for a generated type that's stricter than the
      // real, supported SQL contract.
      p_status: (input.status === undefined ? 'PENDING' : input.status) as never,
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
  async listPeerReviewCandidates(companyId: string): Promise<MhdTrainingPeerReviewCandidate[]> {
    const { data, error } = await supabaseClient.rpc('mhd_training_peer_review_candidates_list', {
      p_company_id: companyId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdTrainingPeerReviewCandidateRpcRow[]).map((row) => ({
      blockProgressId: row.block_progress_id,
      personId: row.person_id,
      personDisplayName: row.person_display_name,
      courseTitle: row.course_title,
      blockTitle: row.block_title,
      blockType: row.block_type,
      response: row.response,
      completedAt: row.completed_at,
      existingReviewCount: mhdToNumber(row.existing_review_count),
    }));
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
