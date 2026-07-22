import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdPersonService } from '@/features/people/Service';
import type {
  MhdAddCustomQuestionInput,
  MhdAddGuideQuestionInput,
  MhdCreateInterviewInput,
  MhdCreateQuestionInput,
  MhdFinalizeEvaluationInput,
  MhdInterviewQuestionFilters,
  MhdSubmitResponsesInput,
} from './Types';
import { mhdInterviewService } from './Service';

export const mhdInterviewQueryKeys = {
  categories: (companyId: string | null) =>
    ['mhd-interview', 'categories', companyId ?? 'ALL'] as const,
  questions: (filters: MhdInterviewQuestionFilters) =>
    ['mhd-interview', 'questions', filters] as const,
  jobCompetencies: (requisitionId: string | null) =>
    ['mhd-interview', 'job-competencies', requisitionId ?? 'ALL'] as const,
  guideItems: (guideId: string | null) =>
    ['mhd-interview', 'guide-items', guideId ?? 'ALL'] as const,
  interviews: (applicationId: string | null) =>
    ['mhd-interview', 'interviews', applicationId ?? 'ALL'] as const,
  worksheet: (interviewId: string | null) =>
    ['mhd-interview', 'worksheet', interviewId ?? 'ALL'] as const,
  evaluationRollup: (applicationId: string | null) =>
    ['mhd-interview', 'evaluation-rollup', applicationId ?? 'ALL'] as const,
  evaluationScore: (applicationId: string | null) =>
    ['mhd-interview', 'evaluation-score', applicationId ?? 'ALL'] as const,
  evaluation: (applicationId: string | null) =>
    ['mhd-interview', 'evaluation', applicationId ?? 'ALL'] as const,
  people: (companyId: string | null) => ['mhd-interview', 'people', companyId ?? 'ALL'] as const,
};

// ---------------------------------------------------------------------------
// Bank: categories + questions
// ---------------------------------------------------------------------------

export function useMhdInterviewCategories(companyId: string | null) {
  return useQuery({
    queryKey: mhdInterviewQueryKeys.categories(companyId),
    queryFn: () => mhdInterviewService.listCategories(companyId),
    enabled: Boolean(companyId),
  });
}

export function useMhdInterviewQuestions(filters: MhdInterviewQuestionFilters) {
  return useQuery({
    queryKey: mhdInterviewQueryKeys.questions(filters),
    queryFn: () => mhdInterviewService.listQuestions(filters),
    enabled: Boolean(filters.companyId),
  });
}

export function useMhdCreateInterviewQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdCreateQuestionInput) => mhdInterviewService.createQuestion(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-interview', 'questions'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Guide assembly
// ---------------------------------------------------------------------------

export function useMhdInterviewJobCompetencies(requisitionId: string | null) {
  return useQuery({
    queryKey: mhdInterviewQueryKeys.jobCompetencies(requisitionId),
    queryFn: () => mhdInterviewService.jobCompetencies(requisitionId),
    enabled: Boolean(requisitionId),
  });
}

export function useMhdInterviewGuideItems(guideId: string | null) {
  return useQuery({
    queryKey: mhdInterviewQueryKeys.guideItems(guideId),
    queryFn: () => mhdInterviewService.listGuideItems(guideId),
    enabled: Boolean(guideId),
  });
}

/**
 * Get-or-create the requisition's guide. Exposed as a MUTATION, not a query,
 * because it lazily WRITES the guide row on first call — the builder fires it once
 * (via an effect) to obtain the guide id that its item query then hangs off. It is
 * idempotent server-side, so a re-fire returns the same guide.
 */
export function useMhdGuideGetOrCreate() {
  return useMutation({
    mutationFn: (requisitionId: string) => mhdInterviewService.guideGetOrCreate(requisitionId),
  });
}

/** Assembling pulls STANDARD + JOB-competency questions into the guide — refresh the items. */
export function useMhdAssembleGuide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (guideId: string) => mhdInterviewService.guideAssemble(guideId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-interview', 'guide-items'] });
    },
  });
}

export function useMhdAddGuideQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdAddGuideQuestionInput) => mhdInterviewService.guideAddQuestion(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-interview', 'guide-items'] });
    },
  });
}

/**
 * Adding a custom question refreshes the guide items; when `saveToBank` is set it
 * also grows the bank, so the question list is invalidated too.
 */
export function useMhdAddCustomQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdAddCustomQuestionInput) => mhdInterviewService.guideAddCustom(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-interview', 'guide-items'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-interview', 'questions'] });
    },
  });
}

export function useMhdRemoveGuideItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => mhdInterviewService.removeGuideItem(itemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-interview', 'guide-items'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Interviews
// ---------------------------------------------------------------------------

export function useMhdInterviews(applicationId: string | null) {
  return useQuery({
    queryKey: mhdInterviewQueryKeys.interviews(applicationId),
    queryFn: () => mhdInterviewService.listInterviews(applicationId),
    enabled: Boolean(applicationId),
  });
}

export function useMhdCreateInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdCreateInterviewInput) => mhdInterviewService.createInterview(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-interview', 'interviews'] });
    },
  });
}

export function useMhdInterviewWorksheet(interviewId: string | null) {
  return useQuery({
    queryKey: mhdInterviewQueryKeys.worksheet(interviewId),
    queryFn: () => mhdInterviewService.getWorksheet(interviewId),
    enabled: Boolean(interviewId),
  });
}

/**
 * Submitting the scorecard marks the interview COMPLETED and feeds the evaluation,
 * so it invalidates the worksheet, the application's interview list, and every
 * derived evaluation read (rollup, overall score, and the evaluation record).
 */
export function useMhdSubmitInterviewResponses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdSubmitResponsesInput) => mhdInterviewService.submitResponses(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-interview', 'worksheet'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-interview', 'interviews'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-interview', 'evaluation-rollup'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-interview', 'evaluation-score'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-interview', 'evaluation'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Evaluation — the competency-weighted rollup
// ---------------------------------------------------------------------------

export function useMhdInterviewEvaluationRollup(applicationId: string | null) {
  return useQuery({
    queryKey: mhdInterviewQueryKeys.evaluationRollup(applicationId),
    queryFn: () => mhdInterviewService.evaluationRollup(applicationId),
    enabled: Boolean(applicationId),
  });
}

export function useMhdInterviewEvaluationScore(applicationId: string | null) {
  return useQuery({
    queryKey: mhdInterviewQueryKeys.evaluationScore(applicationId),
    queryFn: () => mhdInterviewService.evaluationOverallScore(applicationId),
    enabled: Boolean(applicationId),
  });
}

export function useMhdInterviewEvaluation(applicationId: string | null) {
  return useQuery({
    queryKey: mhdInterviewQueryKeys.evaluation(applicationId),
    queryFn: () => mhdInterviewService.getEvaluation(applicationId),
    enabled: Boolean(applicationId),
  });
}

/**
 * Finalizing writes the recommendation; the derived score is unaffected by it, but
 * the evaluation record read must refresh to show the stamped decision.
 */
export function useMhdFinalizeEvaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdFinalizeEvaluationInput) =>
      mhdInterviewService.finalizeEvaluation(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-interview', 'evaluation'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Pickers
// ---------------------------------------------------------------------------

/**
 * The company's people, for the interviewer picker on the schedule panel. Mirrors
 * package 1's people picker — an interviewer is a PERSON.
 */
export function useMhdInterviewPeople(companyId: string | null) {
  return useQuery({
    queryKey: mhdInterviewQueryKeys.people(companyId),
    queryFn: () => mhdPersonService.listPeople({ companyId: companyId!, searchTerm: '' }),
    enabled: Boolean(companyId),
  });
}
