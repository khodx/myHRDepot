import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdPersonService } from '@/features/people/Service';
import type {
  MhdAssignTrainingInput,
  MhdSendTrainingDeadlineRemindersInput,
  MhdAssignTrainingProgramInput,
  MhdCreateTrainingComplianceRuleInput,
  MhdDecideTrainingSelfEnrollmentInput,
  MhdListTrainingSelfEnrollmentsInput,
  MhdSelfEnrollTrainingInput,
  MhdCompleteTrainingInput,
  MhdCreateCourseInput,
  MhdCreateCurriculumInput,
  MhdUpdateCurriculumInput,
  MhdCreateProgramInput,
  MhdUpdateProgramInput,
  MhdCreateTrainingTemplateInput,
  MhdUpdateTrainingTemplateInput,
  MhdCreateTrainingTemplateSlotInput,
  MhdUpdateTrainingTemplateSlotInput,
  MhdCreateTrainingCourseFromTemplateInput,
  MhdCreateCourseModuleInput,
  MhdUpdateCourseModuleInput,
  MhdCreateLessonInput,
  MhdUpdateLessonInput,
  MhdCreateBlockInput,
  MhdUpdateBlockInput,
  MhdUpdateScenarioNodeInput,
  MhdUpdateScenarioChoiceInput,
  MhdSetCourseContentModeInput,
  MhdForkCourseInput,
  MhdApproveContentInput,
  MhdSubmitContentForReviewInput,
  MhdPublishContentInput,
  MhdPrerequisiteInput,
  MhdRecordAdminCompletionInput,
  MhdSetCourseActiveInput,
  MhdRetireTrainingCourseInput,
  MhdSetTrainingContentLicenseInput,
  MhdBulkAssignTrainingInput,
  MhdTrainingManagerTeamStatusInput,
  MhdTrainingAssignmentFilters,
  MhdTrainingComplianceMatrixFilters,
  MhdTrainingCourseFilters,
  MhdTrainingProgramFilters,
  MhdUpdateCourseInput,
  MhdWaiveAssignmentInput,
  MhdSetTrainingTimeOnTaskInput,
  MhdTrainingTimeOnTaskFilters,
  MhdGetTrainingTimeOnTaskInput,
  MhdCreateTrainingExternalAuditorGrantInput,
  MhdTrainingExternalAuditorGrantRevokeInput,
  MhdListTrainingExternalAuditorGrantsInput,
  MhdListTrainingContentLicensesInput,
  MhdUpsertBlockTranslationInput,
  MhdDeleteBlockTranslationInput,
  MhdCreateTrainingBadgeInput,
  MhdAwardTrainingBadgeInput,
  MhdSetTrainingLeaderboardOptInInput,
  MhdTrainingLeaderboardInput,
  MhdCreateContentFlagInput,
  MhdListContentFlagsInput,
  MhdResolveContentFlagInput,
  MhdAssignTrainingPeerReviewInput,
  MhdSubmitTrainingPeerReviewInput,
  MhdListTrainingPeerReviewsInput,
  MhdSubmitTrainingCourseFeedbackInput,
  MhdTrainingVideoUploadRequest,
  MhdCreateTrainingIltSessionInput,
  MhdEnrollTrainingIltInput,
  MhdCancelTrainingIltEnrollmentInput,
  MhdTrainingIltAttendanceInput,
  MhdTrainingIltAttendanceOverrideInput,
  MhdCreateTrainingScenarioNodeInput,
  MhdCreateTrainingScenarioChoiceInput,
  MhdRecordTrainingScenarioVisitInput,
  MhdRespondToTrainingScenarioAiInput,
} from './Types';
import { mhdTrainingService } from './Service';

export const mhdTrainingQueryKeys = {
  curriculums: (companyId: string | null) =>
    ['mhd-training', 'curriculums', companyId ?? 'ALL'] as const,
  programs: (filters: MhdTrainingProgramFilters) => ['mhd-training', 'programs', filters] as const,
  templates: (companyId: string | null, includeInactive = false) =>
    ['mhd-training', 'templates', companyId ?? 'ALL', includeInactive] as const,
  templateSlots: (templateId: string) => ['mhd-training', 'template-slots', templateId] as const,
  courses: (filters: MhdTrainingCourseFilters) => ['mhd-training', 'courses', filters] as const,
  assignments: (filters: MhdTrainingAssignmentFilters) =>
    ['mhd-training', 'assignments', filters] as const,
  completions: (personId: string | null, courseId: string | null) =>
    ['mhd-training', 'completions', personId ?? '', courseId ?? 'ALL'] as const,
  compliance: (personId: string | null, courseId: string | null) =>
    ['mhd-training', 'compliance', personId ?? '', courseId ?? 'ALL'] as const,
  complianceMatrix: (filters: MhdTrainingComplianceMatrixFilters) =>
    ['mhd-training', 'compliance-matrix', filters] as const,
  people: (companyId: string | null) => ['mhd-training', 'people', companyId ?? 'ALL'] as const,
  complianceRules: (companyId: string | null) =>
    ['mhd-training', 'compliance-rules', companyId ?? 'ALL'] as const,
  selfEnrollments: (input: MhdListTrainingSelfEnrollmentsInput) =>
    ['mhd-training', 'self-enrollments', input] as const,
  courseContentTree: (courseId: string) => ['mhd-training', 'content-tree', courseId] as const,
  blockTranslations: (blockId: string) => ['mhd-training', 'block-translations', blockId] as const,
  prerequisites: (courseId: string) => ['mhd-training', 'prerequisites', courseId] as const,
  contentApprovals: (courseId: string) => ['mhd-training', 'content-approvals', courseId] as const,
  blockProgress: (assignmentId: string) =>
    ['mhd-training', 'block-progress', assignmentId] as const,
  timeOnTask: (filters: MhdTrainingTimeOnTaskFilters) =>
    ['mhd-training', 'time-on-task', filters] as const,
  timeOnTaskSettings: (companyId: string) =>
    ['mhd-training', 'time-on-task-settings', companyId] as const,
  learnerExport: (personId: string) => ['mhd-training', 'learner-export', personId] as const,
  externalAuditorReport: (grantId: string) =>
    ['mhd-training', 'external-auditor-report', grantId] as const,
  externalAuditorGrants: (companyId: string) =>
    ['mhd-training', 'external-auditor-grants', companyId] as const,
  contentLicenses: (companyId: string) =>
    ['mhd-training', 'content-licenses', companyId] as const,
  pointsBalance: (personId: string) => ['mhd-training', 'points-balance', personId] as const,
  badges: (companyId: string | null) => ['mhd-training', 'badges', companyId ?? 'ALL'] as const,
  leaderboard: (input: MhdTrainingLeaderboardInput) =>
    ['mhd-training', 'leaderboard', input] as const,
  contentFlags: (input: MhdListContentFlagsInput) =>
    ['mhd-training', 'content-flags', input] as const,
  peerReviews: (input: MhdListTrainingPeerReviewsInput) =>
    ['mhd-training', 'peer-reviews', input] as const,
  peerReviewCandidates: (companyId: string) =>
    ['mhd-training', 'peer-review-candidates', companyId] as const,
  feedbackSummary: (courseId: string) => ['mhd-training', 'feedback-summary', courseId] as const,
  activeSuccessor: (courseId: string) => ['mhd-training', 'active-successor', courseId] as const,
  managerTeamStatus: (input: MhdTrainingManagerTeamStatusInput) =>
    ['mhd-training', 'manager-team-status', input] as const,
  iltSessions: (courseId: string) => ['mhd-training', 'ilt-sessions', courseId] as const,
  iltSessionsByCompany: (companyId: string, includeCancelled?: boolean) =>
    ['mhd-training', 'ilt-sessions-by-company', companyId, Boolean(includeCancelled)] as const,
  iltRoster: (sessionId: string) => ['mhd-training', 'ilt-roster', sessionId] as const,
  scenarioGraph: (blockId: string) => ['mhd-training', 'scenario-graph', blockId] as const,
  aiTranscript: (blockProgressId: string) => ['mhd-training', 'ai-transcript', blockProgressId] as const,
};

export function useMhdTrainingScenarioGraph(blockId: string | null) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.scenarioGraph(blockId ?? ''),
    queryFn: () => mhdTrainingService.getScenarioGraph(blockId!),
    enabled: Boolean(blockId),
  });
}

export function useMhdRecordTrainingScenarioVisit() {
  return useMutation({
    mutationFn: (input: MhdRecordTrainingScenarioVisitInput) =>
      mhdTrainingService.recordScenarioVisit(input),
  });
}

export function useMhdTrainingAiTranscript(blockProgressId: string | null) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.aiTranscript(blockProgressId ?? ''),
    queryFn: () => mhdTrainingService.getAiTranscript(blockProgressId!),
    enabled: Boolean(blockProgressId),
  });
}

export function useMhdRespondToTrainingScenarioAi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdRespondToTrainingScenarioAiInput) =>
      mhdTrainingService.respondToAiConversation(input),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({
        queryKey: mhdTrainingQueryKeys.aiTranscript(input.blockProgressId),
      });
    },
  });
}

// The scenario graph is queried under its own key
// (['mhd-training', 'scenario-graph', blockId]) — every authoring mutation on a node
// or choice must invalidate it, or the graph editor never sees its own edits.
function useMhdTrainingScenarioMutation<T>(mutationFn: (input: T) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'scenario-graph'] });
    },
  });
}

export function useMhdCreateTrainingScenarioNode() {
  return useMhdTrainingScenarioMutation<MhdCreateTrainingScenarioNodeInput>((input) =>
    mhdTrainingService.createScenarioNode(input),
  );
}

export function useMhdCreateTrainingScenarioChoice() {
  return useMhdTrainingScenarioMutation<MhdCreateTrainingScenarioChoiceInput>((input) =>
    mhdTrainingService.createScenarioChoice(input),
  );
}

export function useMhdTrainingIltSessions(courseId: string | null) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.iltSessions(courseId ?? ''),
    queryFn: () => mhdTrainingService.listIltSessions(courseId!),
    enabled: Boolean(courseId),
  });
}

export function useMhdCreateTrainingIltSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdCreateTrainingIltSessionInput) =>
      mhdTrainingService.createIltSession(input),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({
        queryKey: mhdTrainingQueryKeys.iltSessions(input.courseId),
      });
    },
  });
}

// ILT sessions and rosters are queried under three separate key segments
// ('ilt-sessions' per-course, 'ilt-sessions-by-company', and 'ilt-roster' per-session)
// — every mutation that changes enrollment or attendance must invalidate all the
// ones its change actually affects, or an admin UI showing the roster/counts never
// refreshes after an action.
function useMhdTrainingIltMutation<T>(
  mutationFn: (input: T) => Promise<unknown>,
  getSessionId: (input: T) => string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'ilt-sessions'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'ilt-sessions-by-company'] });
      void queryClient.invalidateQueries({
        queryKey: mhdTrainingQueryKeys.iltRoster(getSessionId(input)),
      });
    },
  });
}

export function useMhdEnrollTrainingIlt() {
  return useMhdTrainingIltMutation<MhdEnrollTrainingIltInput>(
    (input) => mhdTrainingService.enrollIlt(input),
    (input) => input.sessionId,
  );
}

export function useMhdCancelTrainingIltEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdCancelTrainingIltEnrollmentInput) =>
      mhdTrainingService.cancelIltEnrollment(input),
    onSuccess: () => {
      // The input carries only an enrollmentId, not the session it belongs to, so
      // every session's roster is invalidated rather than one targeted key.
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'ilt-sessions'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'ilt-sessions-by-company'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'ilt-roster'] });
    },
  });
}

export function useMhdCheckInTrainingIlt() {
  return useMhdTrainingIltMutation<MhdTrainingIltAttendanceInput>(
    (input) => mhdTrainingService.checkInIlt(input),
    (input) => input.sessionId,
  );
}

export function useMhdCheckOutTrainingIlt() {
  return useMhdTrainingIltMutation<MhdTrainingIltAttendanceInput>(
    (input) => mhdTrainingService.checkOutIlt(input),
    (input) => input.sessionId,
  );
}

export function useMhdOverrideTrainingIltAttendance() {
  return useMhdTrainingIltMutation<MhdTrainingIltAttendanceOverrideInput>(
    (input) => mhdTrainingService.overrideIltAttendance(input),
    (input) => input.sessionId,
  );
}

export function useMhdTrainingIltSessionsByCompany(companyId: string, includeCancelled = false) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.iltSessionsByCompany(companyId, includeCancelled),
    queryFn: () => mhdTrainingService.listIltSessionsByCompany(companyId, includeCancelled),
    enabled: Boolean(companyId),
  });
}

export function useMhdTrainingIltRoster(sessionId: string | null) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.iltRoster(sessionId ?? ''),
    queryFn: () => mhdTrainingService.listIltRoster(sessionId!),
    enabled: Boolean(sessionId),
  });
}

export function useMhdTrainingCourseContentTree(courseId: string | null) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.courseContentTree(courseId ?? ''),
    queryFn: () => mhdTrainingService.getCourseContentTree(courseId!),
    enabled: Boolean(courseId),
  });
}

export function useMhdUploadTrainingVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: MhdTrainingVideoUploadRequest) => mhdTrainingService.uploadVideo(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'content-tree'] });
    },
  });
}

export function useMhdTrainingBlockProgress(assignmentId: string | null) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.blockProgress(assignmentId ?? ''),
    queryFn: () => mhdTrainingService.getBlockProgress(assignmentId!),
    enabled: Boolean(assignmentId),
  });
}

export function useMhdStartTrainingBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { assignmentId: string; blockId: string }) =>
      mhdTrainingService.startBlock(input.assignmentId, input.blockId),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({
        queryKey: mhdTrainingQueryKeys.blockProgress(input.assignmentId),
      });
    },
  });
}

export function useMhdCompleteTrainingBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      assignmentId: string;
      blockId: string;
      response?: Record<string, unknown>;
    }) => mhdTrainingService.completeBlock(input.assignmentId, input.blockId, input.response),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({
        queryKey: mhdTrainingQueryKeys.blockProgress(input.assignmentId),
      });
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'assignments'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'completions'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'compliance'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'compliance-matrix'] });
    },
  });
}

export function useMhdTrainingCurriculums(companyId: string | null, includeInactive = false) {
  return useQuery({
    queryKey: [...mhdTrainingQueryKeys.curriculums(companyId), includeInactive] as const,
    queryFn: () => mhdTrainingService.listCurriculums(companyId!, includeInactive),
    enabled: Boolean(companyId),
  });
}

export function useMhdCreateTrainingCurriculum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdCreateCurriculumInput) => mhdTrainingService.createCurriculum(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'curriculums'] });
    },
  });
}

export function useMhdUpdateTrainingCurriculum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdUpdateCurriculumInput) => mhdTrainingService.updateCurriculum(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'curriculums'] });
    },
  });
}

export function useMhdDeleteTrainingCurriculum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (curriculumId: string) => mhdTrainingService.deleteCurriculum(curriculumId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'curriculums'] });
    },
  });
}

export function useMhdTrainingPrograms(filters: MhdTrainingProgramFilters) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.programs(filters),
    queryFn: () => mhdTrainingService.listPrograms(filters),
    enabled: Boolean(filters.companyId),
  });
}

export function useMhdCreateTrainingProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdCreateProgramInput) => mhdTrainingService.createProgram(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'programs'] });
    },
  });
}

export function useMhdUpdateTrainingProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdUpdateProgramInput) => mhdTrainingService.updateProgram(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'programs'] });
    },
  });
}

export function useMhdDeleteTrainingProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (programId: string) => mhdTrainingService.deleteProgram(programId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'programs'] });
    },
  });
}

export function useMhdTrainingTemplates(companyId: string | null, includeInactive = false) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.templates(companyId, includeInactive),
    queryFn: () => mhdTrainingService.listTemplates(companyId!, includeInactive),
    enabled: Boolean(companyId),
  });
}
export function useMhdCreateTrainingTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdCreateTrainingTemplateInput) => mhdTrainingService.createTemplate(input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'templates'] }),
  });
}
export function useMhdUpdateTrainingTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdUpdateTrainingTemplateInput) => mhdTrainingService.updateTemplate(input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'templates'] }),
  });
}
export function useMhdDeleteTrainingTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => mhdTrainingService.deleteTemplate(templateId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'templates'] }),
  });
}
export function useMhdTrainingTemplateSlots(templateId: string | null) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.templateSlots(templateId ?? ''),
    queryFn: () => mhdTrainingService.listTemplateSlots(templateId!),
    enabled: Boolean(templateId),
  });
}
export function useMhdCreateTrainingTemplateSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdCreateTrainingTemplateSlotInput) => mhdTrainingService.createTemplateSlot(input),
    onSuccess: (_data, input) => void queryClient.invalidateQueries({ queryKey: mhdTrainingQueryKeys.templateSlots(input.templateId) }),
  });
}
export function useMhdUpdateTrainingTemplateSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdUpdateTrainingTemplateSlotInput) => mhdTrainingService.updateTemplateSlot(input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'template-slots'] }),
  });
}
export function useMhdDeleteTrainingTemplateSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slotId: string) => mhdTrainingService.deleteTemplateSlot(slotId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'template-slots'] }),
  });
}
export function useMhdCreateTrainingCourseFromTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdCreateTrainingCourseFromTemplateInput) =>
      mhdTrainingService.createCourseFromTemplate(input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'courses'] }),
  });
}

function useMhdTrainingContentMutation<T>(mutationFn: (input: T) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      // 'content-tree' is queried under its own top-level key segment
      // (['mhd-training', 'content-tree', courseId]), not nested under 'courses' —
      // both must be invalidated explicitly, or editing a module/lesson/block never
      // refreshes the tree a builder UI is actually looking at.
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'courses'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'content-tree'] });
    },
  });
}

export function useMhdSetTrainingCourseContentMode() {
  return useMhdTrainingContentMutation<MhdSetCourseContentModeInput>((input) =>
    mhdTrainingService.setCourseContentMode(input),
  );
}
export function useMhdCreateTrainingCourseModule() {
  return useMhdTrainingContentMutation<MhdCreateCourseModuleInput>((input) =>
    mhdTrainingService.createCourseModule(input),
  );
}
export function useMhdUpdateTrainingCourseModule() {
  return useMhdTrainingContentMutation<MhdUpdateCourseModuleInput>((input) =>
    mhdTrainingService.updateCourseModule(input),
  );
}
export function useMhdDeleteTrainingCourseModule() {
  return useMhdTrainingContentMutation<string>((moduleId) =>
    mhdTrainingService.deleteCourseModule(moduleId),
  );
}
export function useMhdCreateTrainingLesson() {
  return useMhdTrainingContentMutation<MhdCreateLessonInput>((input) =>
    mhdTrainingService.createLesson(input),
  );
}
export function useMhdUpdateTrainingLesson() {
  return useMhdTrainingContentMutation<MhdUpdateLessonInput>((input) =>
    mhdTrainingService.updateLesson(input),
  );
}
export function useMhdDeleteTrainingLesson() {
  return useMhdTrainingContentMutation<string>((lessonId) =>
    mhdTrainingService.deleteLesson(lessonId),
  );
}
export function useMhdCreateTrainingBlock() {
  return useMhdTrainingContentMutation<MhdCreateBlockInput>((input) =>
    mhdTrainingService.createBlock(input),
  );
}
export function useMhdUpdateTrainingBlock() {
  return useMhdTrainingContentMutation<MhdUpdateBlockInput>((input) =>
    mhdTrainingService.updateBlock(input),
  );
}
export function useMhdDeleteTrainingBlock() {
  return useMhdTrainingContentMutation<string>((blockId) =>
    mhdTrainingService.deleteBlock(blockId),
  );
}
export function useMhdTrainingBlockTranslations(blockId: string | null) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.blockTranslations(blockId ?? ''),
    queryFn: () => mhdTrainingService.listBlockTranslations(blockId!),
    enabled: Boolean(blockId),
  });
}
export function useMhdUpsertTrainingBlockTranslation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdUpsertBlockTranslationInput) =>
      mhdTrainingService.upsertBlockTranslation(input),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({
        queryKey: mhdTrainingQueryKeys.blockTranslations(input.blockId),
      });
    },
  });
}
export function useMhdDeleteTrainingBlockTranslation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdDeleteBlockTranslationInput & { blockId: string }) =>
      mhdTrainingService.deleteBlockTranslation(input),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({
        queryKey: mhdTrainingQueryKeys.blockTranslations(input.blockId),
      });
    },
  });
}
export function useMhdUpdateTrainingScenarioNode() {
  return useMhdTrainingScenarioMutation<MhdUpdateScenarioNodeInput>((input) =>
    mhdTrainingService.updateScenarioNode(input),
  );
}
export function useMhdDeleteTrainingScenarioNode() {
  return useMhdTrainingScenarioMutation<string>((nodeId) =>
    mhdTrainingService.deleteScenarioNode(nodeId),
  );
}
export function useMhdUpdateTrainingScenarioChoice() {
  return useMhdTrainingScenarioMutation<MhdUpdateScenarioChoiceInput>((input) =>
    mhdTrainingService.updateScenarioChoice(input),
  );
}
export function useMhdDeleteTrainingScenarioChoice() {
  return useMhdTrainingScenarioMutation<string>((choiceId) =>
    mhdTrainingService.deleteScenarioChoice(choiceId),
  );
}
export function useMhdForkTrainingCourse() {
  return useMhdTrainingContentMutation<MhdForkCourseInput>((input) =>
    mhdTrainingService.forkCourse(input),
  );
}
// The content approval pipeline additionally invalidates its own history list
// (['mhd-training', 'content-approvals', courseId]) — a separate key from
// useMhdTrainingContentMutation's 'courses'/'content-tree' invalidation.
function useMhdTrainingApprovalMutation<T extends { courseId: string }>(
  mutationFn: (input: T) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'courses'] });
      void queryClient.invalidateQueries({ queryKey: mhdTrainingQueryKeys.contentApprovals(input.courseId) });
    },
  });
}
export function useMhdSubmitTrainingContentForReview() {
  return useMhdTrainingApprovalMutation<MhdSubmitContentForReviewInput>((input) =>
    mhdTrainingService.submitContentForReview(input),
  );
}
export function useMhdApproveTrainingContent() {
  return useMhdTrainingApprovalMutation<MhdApproveContentInput>((input) =>
    mhdTrainingService.approveContent(input),
  );
}
export function useMhdPublishTrainingContent() {
  return useMhdTrainingApprovalMutation<MhdPublishContentInput>((input) =>
    mhdTrainingService.publishContent(input),
  );
}
export function useMhdAddTrainingPrerequisite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdPrerequisiteInput) => mhdTrainingService.addPrerequisite(input),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'courses'] });
      void queryClient.invalidateQueries({ queryKey: mhdTrainingQueryKeys.prerequisites(input.courseId) });
    },
  });
}
export function useMhdRemoveTrainingPrerequisite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdPrerequisiteInput) => mhdTrainingService.removePrerequisite(input),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'courses'] });
      void queryClient.invalidateQueries({ queryKey: mhdTrainingQueryKeys.prerequisites(input.courseId) });
    },
  });
}
export function useMhdTrainingPrerequisites(courseId: string | null) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.prerequisites(courseId ?? ''),
    queryFn: () => mhdTrainingService.listPrerequisites(courseId!),
    enabled: Boolean(courseId),
  });
}
export function useMhdTrainingContentApprovals(courseId: string | null) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.contentApprovals(courseId ?? ''),
    queryFn: () => mhdTrainingService.listContentApprovals(courseId!),
    enabled: Boolean(courseId),
  });
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export function useMhdTrainingCourses(filters: MhdTrainingCourseFilters) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.courses(filters),
    queryFn: () => mhdTrainingService.listCourses(filters),
    enabled: Boolean(filters.companyId),
  });
}

export function useMhdCreateTrainingCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdCreateCourseInput) => mhdTrainingService.createCourse(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'courses'] });
    },
  });
}

export function useMhdUpdateTrainingCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdUpdateCourseInput) => mhdTrainingService.updateCourse(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'courses'] });
    },
  });
}

export function useMhdSetTrainingCourseActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdSetCourseActiveInput) => mhdTrainingService.setCourseActive(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'courses'] });
    },
  });
}

export function useMhdRetireTrainingCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdRetireTrainingCourseInput) => mhdTrainingService.retireCourse(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'courses'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'assignments'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'compliance-matrix'] });
    },
  });
}

export function useMhdResolveActiveTrainingSuccessor(courseId: string | null) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.activeSuccessor(courseId ?? ''),
    queryFn: () => mhdTrainingService.resolveActiveSuccessor({ courseId: courseId! }),
    enabled: Boolean(courseId),
  });
}

export function useMhdSetTrainingContentLicense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdSetTrainingContentLicenseInput) =>
      mhdTrainingService.setContentLicense(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'content-licenses'] });
    },
  });
}

export function useMhdTrainingContentLicenses(input: MhdListTrainingContentLicensesInput) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.contentLicenses(input.companyId),
    queryFn: () => mhdTrainingService.listContentLicenses(input),
    enabled: Boolean(input.companyId),
  });
}

// ---------------------------------------------------------------------------
// Assignments
// ---------------------------------------------------------------------------

export function useMhdTrainingAssignments(filters: MhdTrainingAssignmentFilters) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.assignments(filters),
    queryFn: () => mhdTrainingService.listAssignments(filters),
    enabled: Boolean(filters.companyId),
  });
}

export function useMhdSendTrainingDeadlineReminders() {
  return useMutation({
    mutationFn: (input: MhdSendTrainingDeadlineRemindersInput) =>
      mhdTrainingService.sendDeadlineReminders(input),
  });
}

/**
 * Assigning changes both the assignment board and (because a completion may
 * already exist / the derived compliance shifts) the compliance board, so both
 * are invalidated.
 */
export function useMhdAssignTraining() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdAssignTrainingInput) => mhdTrainingService.assign(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'assignments'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'compliance-matrix'] });
    },
  });
}

export function useMhdBulkAssignTraining() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdBulkAssignTrainingInput) => mhdTrainingService.bulkAssign(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'assignments'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'compliance-matrix'] });
    },
  });
}

export function useMhdTrainingManagerTeamStatus(managerPersonId: string | null) {
  const input = { managerPersonId: managerPersonId ?? '' };
  return useQuery({
    queryKey: mhdTrainingQueryKeys.managerTeamStatus(input),
    queryFn: () => mhdTrainingService.managerTeamStatus({ managerPersonId: managerPersonId! }),
    enabled: Boolean(managerPersonId),
  });
}

export function useMhdAssignTrainingProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdAssignTrainingProgramInput) => mhdTrainingService.assignProgram(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'assignments'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'compliance-matrix'] });
    },
  });
}

export function useMhdTrainingComplianceRules(companyId: string | null) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.complianceRules(companyId),
    queryFn: () => mhdTrainingService.listComplianceRules(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useMhdCreateTrainingComplianceRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdCreateTrainingComplianceRuleInput) =>
      mhdTrainingService.createComplianceRule(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'compliance-rules'] });
    },
  });
}

export function useMhdApplyTrainingComplianceRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) => mhdTrainingService.applyComplianceRule({ ruleId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'assignments'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'compliance-matrix'] });
    },
  });
}

export function useMhdTrainingSelfEnrollments(input: MhdListTrainingSelfEnrollmentsInput) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.selfEnrollments(input),
    queryFn: () => mhdTrainingService.listSelfEnrollments(input),
    enabled: Boolean(input.companyId),
  });
}

export function useMhdRequestTrainingSelfEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdSelfEnrollTrainingInput) =>
      mhdTrainingService.requestSelfEnrollment(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'self-enrollments'] });
    },
  });
}

export function useMhdDecideTrainingSelfEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdDecideTrainingSelfEnrollmentInput) =>
      mhdTrainingService.decideSelfEnrollment(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'self-enrollments'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'assignments'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'compliance-matrix'] });
    },
  });
}

export function useMhdCancelTrainingAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => mhdTrainingService.cancelAssignment(assignmentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'assignments'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'compliance-matrix'] });
    },
  });
}

export function useMhdWaiveTrainingAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdWaiveAssignmentInput) => mhdTrainingService.waiveAssignment(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'assignments'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'compliance-matrix'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Completions
// ---------------------------------------------------------------------------

export function useMhdTrainingCompletions(personId: string | null, courseId: string | null = null) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.completions(personId, courseId),
    queryFn: () => mhdTrainingService.listCompletions(personId!, courseId),
    enabled: Boolean(personId),
  });
}

/**
 * Completing writes evidence and flips the assignment — so the assignments list,
 * completion history and both compliance surfaces all change. Invalidate broadly
 * across the module rather than trying to key each one.
 */
export function useMhdCompleteTraining() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdCompleteTrainingInput) => mhdTrainingService.complete(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'assignments'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'completions'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'compliance'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'compliance-matrix'] });
    },
  });
}

export function useMhdGenerateTrainingCertificate() {
  return useMutation({
    mutationFn: (completionId: string) => mhdTrainingService.generateCertificate(completionId),
  });
}

export function useMhdRecordAdminCompletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdRecordAdminCompletionInput) =>
      mhdTrainingService.recordAdminCompletion(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'assignments'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'completions'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'compliance'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'compliance-matrix'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Compliance (derived, read-only)
// ---------------------------------------------------------------------------

export function useMhdTrainingCompliance(personId: string | null, courseId: string | null = null) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.compliance(personId, courseId),
    queryFn: () => mhdTrainingService.compliance(personId!, courseId),
    enabled: Boolean(personId),
  });
}

export function useMhdTrainingComplianceMatrix(filters: MhdTrainingComplianceMatrixFilters) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.complianceMatrix(filters),
    queryFn: () => mhdTrainingService.complianceMatrix(filters),
    enabled: Boolean(filters.companyId),
  });
}

export function useMhdTrainingTimeOnTaskReport(filters: MhdTrainingTimeOnTaskFilters) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.timeOnTask(filters),
    queryFn: () => mhdTrainingService.timeOnTaskReport(filters),
    enabled: Boolean(filters.companyId),
  });
}

export function useMhdSetTrainingTimeOnTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdSetTrainingTimeOnTaskInput) => mhdTrainingService.setTimeOnTask(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'time-on-task'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'time-on-task-settings'] });
    },
  });
}

export function useMhdTrainingTimeOnTaskSettings(input: MhdGetTrainingTimeOnTaskInput) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.timeOnTaskSettings(input.companyId),
    queryFn: () => mhdTrainingService.getTimeOnTask(input),
    enabled: Boolean(input.companyId),
  });
}

export function useMhdTrainingLearnerExport(personId: string | null) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.learnerExport(personId ?? ''),
    queryFn: () => mhdTrainingService.learnerExport(personId!),
    enabled: Boolean(personId),
  });
}

export function useMhdCreateTrainingExternalAuditorGrant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdCreateTrainingExternalAuditorGrantInput) =>
      mhdTrainingService.createExternalAuditorGrant(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'external-auditor-grants'] });
    },
  });
}

export function useMhdRevokeTrainingExternalAuditorGrant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdTrainingExternalAuditorGrantRevokeInput) =>
      mhdTrainingService.revokeExternalAuditorGrant(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'external-auditor-grants'] });
    },
  });
}

export function useMhdTrainingExternalAuditorGrants(
  input: MhdListTrainingExternalAuditorGrantsInput,
) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.externalAuditorGrants(input.companyId),
    queryFn: () => mhdTrainingService.listExternalAuditorGrants(input),
    enabled: Boolean(input.companyId),
  });
}

export function useMhdTrainingExternalAuditorReport(grantId: string | null) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.externalAuditorReport(grantId ?? ''),
    queryFn: () => mhdTrainingService.externalAuditorReport(grantId!),
    enabled: Boolean(grantId),
  });
}

// ---------------------------------------------------------------------------
// Pickers
// ---------------------------------------------------------------------------

export function useMhdTrainingPeople(companyId: string | null) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.people(companyId),
    // mhdPersonService.listPeople requires { companyId, searchTerm }; the picker
    // wants the whole company roster, so searchTerm is blank.
    queryFn: () => mhdPersonService.listPeople({ companyId: companyId!, searchTerm: '' }),
    enabled: Boolean(companyId),
  });
}

export function useMhdTrainingPointsBalance(personId: string | null) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.pointsBalance(personId ?? ''),
    queryFn: () => mhdTrainingService.pointsBalance(personId!),
    enabled: Boolean(personId),
  });
}
export function useMhdTrainingBadges(companyId: string | null) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.badges(companyId),
    queryFn: () => mhdTrainingService.listBadges(companyId!),
    enabled: Boolean(companyId),
  });
}
export function useMhdCreateTrainingBadge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdCreateTrainingBadgeInput) => mhdTrainingService.createBadge(input),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({
        queryKey: mhdTrainingQueryKeys.badges(input.companyId),
      });
    },
  });
}
export function useMhdAwardTrainingBadge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdAwardTrainingBadgeInput) => mhdTrainingService.awardBadge(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'points-balance'] });
    },
  });
}
export function useMhdSetTrainingLeaderboardOptIn() {
  return useMutation({
    mutationFn: (input: MhdSetTrainingLeaderboardOptInInput) =>
      mhdTrainingService.setLeaderboardOptIn(input),
  });
}
export function useMhdTrainingLeaderboard(input: MhdTrainingLeaderboardInput) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.leaderboard(input),
    queryFn: () => mhdTrainingService.leaderboard(input),
    enabled: Boolean(input.companyId),
  });
}
export function useMhdCreateContentFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdCreateContentFlagInput) => mhdTrainingService.createContentFlag(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'content-flags'] });
    },
  });
}
export function useMhdContentFlags(input: MhdListContentFlagsInput) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.contentFlags(input),
    queryFn: () => mhdTrainingService.listContentFlags(input),
    enabled: Boolean(input.companyId),
  });
}
export function useMhdResolveContentFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdResolveContentFlagInput) => mhdTrainingService.resolveContentFlag(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'content-flags'] });
    },
  });
}
export function useMhdAssignTrainingPeerReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdAssignTrainingPeerReviewInput) =>
      mhdTrainingService.assignPeerReview(input),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({
        queryKey: mhdTrainingQueryKeys.peerReviews({ blockProgressId: input.blockProgressId }),
      });
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'peer-review-candidates'] });
    },
  });
}

export function useMhdTrainingPeerReviewCandidates(companyId: string) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.peerReviewCandidates(companyId),
    queryFn: () => mhdTrainingService.listPeerReviewCandidates(companyId),
    enabled: Boolean(companyId),
  });
}
export function useMhdSubmitTrainingPeerReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdSubmitTrainingPeerReviewInput) =>
      mhdTrainingService.submitPeerReview(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'peer-reviews'] });
    },
  });
}
export function useMhdTrainingPeerReviews(input: MhdListTrainingPeerReviewsInput) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.peerReviews(input),
    queryFn: () => mhdTrainingService.listPeerReviews(input),
    enabled: Boolean(input.blockProgressId),
  });
}
export function useMhdSubmitTrainingCourseFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdSubmitTrainingCourseFeedbackInput) =>
      mhdTrainingService.submitCourseFeedback(input),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({
        queryKey: mhdTrainingQueryKeys.feedbackSummary(input.courseId),
      });
    },
  });
}
export function useMhdTrainingCourseFeedbackSummary(courseId: string | null) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.feedbackSummary(courseId ?? ''),
    queryFn: () => mhdTrainingService.courseFeedbackSummary(courseId!),
    enabled: Boolean(courseId),
  });
}
