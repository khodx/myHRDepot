import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdAssessmentService } from './Service';
import type {
  MhdAccommodationRequestCreateInput,
  MhdAssessmentCreateInput,
  MhdAssessmentItemCreateInput,
} from './Types';

export const mhdAssessmentQueryKeys = {
  items: (companyId: string, tag?: string | null) =>
    ['mhd-assessments', 'items', companyId, tag ?? null] as const,
  detail: (assessmentId: string) => ['mhd-assessments', 'detail', assessmentId] as const,
  attempts: (assessmentId: string, personId?: string | null) =>
    ['mhd-assessments', 'attempts', assessmentId, personId ?? null] as const,
  list: (companyId: string, includeInactive?: boolean) =>
    ['mhd-assessments', 'list', companyId, Boolean(includeInactive)] as const,
  accommodationRequests: (companyId: string, status?: string | null) =>
    ['mhd-assessments', 'accommodation-requests', companyId, status ?? null] as const,
  pendingReview: (companyId: string) => ['mhd-assessments', 'pending-review', companyId] as const,
};

export function useMhdAssessmentItems(companyId: string, tag: string | null = null) {
  return useQuery({
    queryKey: mhdAssessmentQueryKeys.items(companyId, tag),
    queryFn: () => mhdAssessmentService.listItems(companyId, tag),
    enabled: Boolean(companyId),
  });
}

export function useMhdCreateAssessmentItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdAssessmentItemCreateInput) => mhdAssessmentService.createItem(input),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({
        queryKey: mhdAssessmentQueryKeys.items(input.companyId),
      });
    },
  });
}

export function useMhdAssessment(assessmentId: string) {
  return useQuery({
    queryKey: mhdAssessmentQueryKeys.detail(assessmentId),
    queryFn: () => mhdAssessmentService.get(assessmentId),
    enabled: Boolean(assessmentId),
  });
}

export function useMhdCreateAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdAssessmentCreateInput) => mhdAssessmentService.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-assessments'] });
    },
  });
}

export function useMhdAssessmentAttempts(assessmentId: string, personId: string | null = null) {
  return useQuery({
    queryKey: mhdAssessmentQueryKeys.attempts(assessmentId, personId),
    queryFn: () => mhdAssessmentService.listAttempts(assessmentId, personId),
    enabled: Boolean(assessmentId),
  });
}

export function useMhdStartAssessmentAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assessmentId,
      assignmentId,
    }: {
      assessmentId: string;
      assignmentId?: string | null;
    }) => mhdAssessmentService.startAttempt(assessmentId, assignmentId ?? null),
    onSuccess: (_data, { assessmentId }) => {
      void queryClient.invalidateQueries({
        queryKey: mhdAssessmentQueryKeys.attempts(assessmentId),
      });
    },
  });
}

export function useMhdSubmitAssessmentAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { assessmentId: string; attemptId: string; responses: Record<string, unknown> }) =>
      mhdAssessmentService.submitAttempt(input.attemptId, input.responses),
    onSuccess: (_data, { assessmentId }) => {
      void queryClient.invalidateQueries({
        queryKey: mhdAssessmentQueryKeys.attempts(assessmentId),
      });
    },
  });
}

export function useMhdGradeAssessmentAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      attemptId,
      scorePercent,
      passed,
    }: {
      assessmentId: string;
      attemptId: string;
      scorePercent: number;
      passed: boolean;
    }) => mhdAssessmentService.gradeAttempt(attemptId, scorePercent, passed),
    onSuccess: (_data, { assessmentId }) => {
      void queryClient.invalidateQueries({
        queryKey: mhdAssessmentQueryKeys.attempts(assessmentId),
      });
      void queryClient.invalidateQueries({ queryKey: ['mhd-assessments', 'pending-review'] });
    },
  });
}

export function useMhdCreateAccommodationRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdAccommodationRequestCreateInput) =>
      mhdAssessmentService.createAccommodationRequest(input),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({
        queryKey: mhdAssessmentQueryKeys.detail(input.assessmentId),
      });
      void queryClient.invalidateQueries({ queryKey: ['mhd-assessments', 'accommodation-requests'] });
    },
  });
}

export function useMhdDecideAccommodationRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { assessmentId: string; requestId: string; approve: boolean; notes?: string | null }) =>
      mhdAssessmentService.decideAccommodationRequest(input.requestId, input.approve, input.notes ?? null),
    onSuccess: (_data, { assessmentId }) => {
      void queryClient.invalidateQueries({ queryKey: mhdAssessmentQueryKeys.detail(assessmentId) });
      void queryClient.invalidateQueries({ queryKey: ['mhd-assessments', 'accommodation-requests'] });
    },
  });
}

export function useMhdAssessmentList(companyId: string, includeInactive = false) {
  return useQuery({
    queryKey: mhdAssessmentQueryKeys.list(companyId, includeInactive),
    queryFn: () => mhdAssessmentService.listAssessments(companyId, includeInactive),
    enabled: Boolean(companyId),
  });
}

export function useMhdAccommodationRequestList(companyId: string, status: string | null = null) {
  return useQuery({
    queryKey: mhdAssessmentQueryKeys.accommodationRequests(companyId, status),
    queryFn: () => mhdAssessmentService.listAccommodationRequests(companyId, status),
    enabled: Boolean(companyId),
  });
}

export function useMhdAssessmentPendingReview(companyId: string) {
  return useQuery({
    queryKey: mhdAssessmentQueryKeys.pendingReview(companyId),
    queryFn: () => mhdAssessmentService.listPendingReview(companyId),
    enabled: Boolean(companyId),
  });
}
