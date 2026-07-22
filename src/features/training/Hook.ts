import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdPersonService } from '@/features/people/Service';
import type {
  MhdAssignTrainingInput,
  MhdCompleteTrainingInput,
  MhdCreateCourseInput,
  MhdRecordAdminCompletionInput,
  MhdSetCourseActiveInput,
  MhdTrainingAssignmentFilters,
  MhdTrainingComplianceMatrixFilters,
  MhdTrainingCourseFilters,
  MhdUpdateCourseInput,
  MhdWaiveAssignmentInput,
} from './Types';
import { mhdTrainingService } from './Service';

export const mhdTrainingQueryKeys = {
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
};

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
