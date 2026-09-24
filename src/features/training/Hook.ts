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
  MhdRecordAdminCompletionInput,
  MhdSetCourseActiveInput,
  MhdTrainingAssignmentFilters,
  MhdTrainingComplianceMatrixFilters,
  MhdTrainingCourseFilters,
  MhdTrainingProgramFilters,
  MhdUpdateCourseInput,
  MhdWaiveAssignmentInput,
  MhdSetTrainingTimeOnTaskInput,
  MhdTrainingTimeOnTaskFilters,
  MhdCreateTrainingExternalAuditorGrantInput,
  MhdTrainingExternalAuditorGrantRevokeInput,
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
} from './Types';
import { mhdTrainingService } from './Service';

export const mhdTrainingQueryKeys = {
  curriculums: (companyId: string | null) =>
    ['mhd-training', 'curriculums', companyId ?? 'ALL'] as const,
  programs: (filters: MhdTrainingProgramFilters) => ['mhd-training', 'programs', filters] as const,
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
  blockProgress: (assignmentId: string) =>
    ['mhd-training', 'block-progress', assignmentId] as const,
  timeOnTask: (filters: MhdTrainingTimeOnTaskFilters) =>
    ['mhd-training', 'time-on-task', filters] as const,
  learnerExport: (personId: string) => ['mhd-training', 'learner-export', personId] as const,
  externalAuditorReport: (grantId: string) =>
    ['mhd-training', 'external-auditor-report', grantId] as const,
  pointsBalance: (personId: string) => ['mhd-training', 'points-balance', personId] as const,
  badges: (companyId: string | null) => ['mhd-training', 'badges', companyId ?? 'ALL'] as const,
  leaderboard: (input: MhdTrainingLeaderboardInput) =>
    ['mhd-training', 'leaderboard', input] as const,
  contentFlags: (input: MhdListContentFlagsInput) =>
    ['mhd-training', 'content-flags', input] as const,
  peerReviews: (input: MhdListTrainingPeerReviewsInput) =>
    ['mhd-training', 'peer-reviews', input] as const,
  feedbackSummary: (courseId: string) => ['mhd-training', 'feedback-summary', courseId] as const,
};

export function useMhdTrainingCourseContentTree(courseId: string | null) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.courseContentTree(courseId ?? ''),
    queryFn: () => mhdTrainingService.getCourseContentTree(courseId!),
    enabled: Boolean(courseId),
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

export function useMhdTrainingCurriculums(companyId: string | null) {
  return useQuery({
    queryKey: mhdTrainingQueryKeys.curriculums(companyId),
    queryFn: () => mhdTrainingService.listCurriculums(companyId!),
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

function useMhdTrainingContentMutation<T>(mutationFn: (input: T) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-training', 'courses'] });
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
export function useMhdCreateTrainingLesson() {
  return useMhdTrainingContentMutation<MhdCreateLessonInput>((input) =>
    mhdTrainingService.createLesson(input),
  );
}
export function useMhdCreateTrainingBlock() {
  return useMhdTrainingContentMutation<MhdCreateBlockInput>((input) =>
    mhdTrainingService.createBlock(input),
  );
}
export function useMhdForkTrainingCourse() {
  return useMhdTrainingContentMutation<MhdForkCourseInput>((input) =>
    mhdTrainingService.forkCourse(input),
  );
}
export function useMhdSubmitTrainingContentForReview() {
  return useMhdTrainingContentMutation<MhdSubmitContentForReviewInput>((input) =>
    mhdTrainingService.submitContentForReview(input),
  );
}
export function useMhdApproveTrainingContent() {
  return useMhdTrainingContentMutation<MhdApproveContentInput>((input) =>
    mhdTrainingService.approveContent(input),
  );
}
export function useMhdPublishTrainingContent() {
  return useMhdTrainingContentMutation<MhdPublishContentInput>((input) =>
    mhdTrainingService.publishContent(input),
  );
}
export function useMhdAddTrainingPrerequisite() {
  return useMhdTrainingContentMutation<MhdPrerequisiteInput>((input) =>
    mhdTrainingService.addPrerequisite(input),
  );
}
export function useMhdRemoveTrainingPrerequisite() {
  return useMhdTrainingContentMutation<MhdPrerequisiteInput>((input) =>
    mhdTrainingService.removePrerequisite(input),
  );
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
    },
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
  return useMutation({
    mutationFn: (input: MhdCreateTrainingExternalAuditorGrantInput) =>
      mhdTrainingService.createExternalAuditorGrant(input),
  });
}

export function useMhdRevokeTrainingExternalAuditorGrant() {
  return useMutation({
    mutationFn: (input: MhdTrainingExternalAuditorGrantRevokeInput) =>
      mhdTrainingService.revokeExternalAuditorGrant(input),
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
    },
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
