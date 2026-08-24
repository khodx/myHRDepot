import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  MhdAssignJobInput,
  MhdCareerOneStopOccupationLookupInput,
  MhdCreateJobInput,
  MhdOnetOccupationLookupInput,
  MhdOnetOccupationSearchInput,
  MhdSetPayRangeInput,
  MhdUpdateDescriptionDraftInput,
  MhdUpdateJobInput,
  MhdUpsertCompetencyInput,
} from './Types';
import { mhdJobsService } from './Service';

export const mhdJobsQueryKeys = {
  jobs: (companyId: string | null, search: string | null, activeOnly: boolean) =>
    ['mhd-jobs', 'jobs', companyId ?? '', search ?? '', activeOnly] as const,
  competencies: (companyId: string | null, industry: string | null) =>
    ['mhd-jobs', 'competencies', companyId ?? '', industry ?? 'ALL'] as const,
  assignments: (personId: string | null) => ['mhd-jobs', 'assignments', personId ?? ''] as const,
  publishedForPerson: (personId: string | null, asOf: string | null) =>
    ['mhd-jobs', 'published-for-person', personId ?? '', asOf ?? 'today'] as const,
};

/**
 * Publishing a description changes what every downstream consumer resolves —
 * a review created a moment later will stamp the new version. So publishing
 * invalidates the consumer contract as well as the job list, not just the
 * description being edited.
 */
function useDescriptionInvalidator() {
  const queryClient = useQueryClient();
  return (companyId: string | null) => {
    void queryClient.invalidateQueries({ queryKey: ['mhd-jobs', 'jobs'] });
    void queryClient.invalidateQueries({ queryKey: ['mhd-jobs', 'published-for-person'] });
    if (companyId) {
      void queryClient.invalidateQueries({
        queryKey: ['mhd-jobs', 'competencies', companyId],
      });
    }
  };
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

export function useMhdJobs(
  companyId: string | null,
  search: string | null = null,
  activeOnly = true,
) {
  return useQuery({
    queryKey: mhdJobsQueryKeys.jobs(companyId, search, activeOnly),
    queryFn: () => mhdJobsService.listJobs(companyId!, search, activeOnly),
    enabled: Boolean(companyId),
  });
}

export function useMhdCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdCreateJobInput) => mhdJobsService.createJob(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-jobs', 'jobs'] });
    },
  });
}

export function useMhdUpdateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdUpdateJobInput) => mhdJobsService.updateJob(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-jobs', 'jobs'] });
      // FLSA classification lives on the job and is what Time & Attendance v2
      // accrual reads, so a change here matters beyond this module.
      void queryClient.invalidateQueries({ queryKey: ['mhd-jobs', 'published-for-person'] });
    },
  });
}

export function useMhdSetPayRange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdSetPayRangeInput) => mhdJobsService.setPayRange(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-jobs', 'jobs'] });
    },
  });
}

export function useMhdDeleteJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => mhdJobsService.deleteJob(jobId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-jobs', 'jobs'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Descriptions
// ---------------------------------------------------------------------------

export function useMhdCreateDescriptionDraft(companyId: string | null) {
  const invalidate = useDescriptionInvalidator();
  return useMutation({
    mutationFn: ({ jobId, copyFrom }: { jobId: string; copyFrom?: string | null }) =>
      mhdJobsService.createDraft(jobId, copyFrom),
    onSuccess: () => invalidate(companyId),
  });
}

export function useMhdUpdateDescriptionDraft(companyId: string | null) {
  const invalidate = useDescriptionInvalidator();
  return useMutation({
    mutationFn: (input: MhdUpdateDescriptionDraftInput) => mhdJobsService.updateDraft(input),
    onSuccess: () => invalidate(companyId),
  });
}

export function useMhdSetDescriptionFunctions(companyId: string | null) {
  const invalidate = useDescriptionInvalidator();
  return useMutation({
    mutationFn: ({
      descriptionId,
      functions,
    }: {
      descriptionId: string;
      functions: Array<{ functionText: string; isEssential: boolean }>;
    }) => mhdJobsService.setFunctions(descriptionId, functions),
    onSuccess: () => invalidate(companyId),
  });
}

export function useMhdSetDescriptionQualifications(companyId: string | null) {
  const invalidate = useDescriptionInvalidator();
  return useMutation({
    mutationFn: ({
      descriptionId,
      qualifications,
    }: {
      descriptionId: string;
      qualifications: Array<{
        qualificationText: string;
        qualificationType: string;
        isRequired: boolean;
      }>;
    }) => mhdJobsService.setQualifications(descriptionId, qualifications),
    onSuccess: () => invalidate(companyId),
  });
}

export function useMhdSetDescriptionCompetencies(companyId: string | null) {
  const invalidate = useDescriptionInvalidator();
  return useMutation({
    mutationFn: ({
      descriptionId,
      competencies,
    }: {
      descriptionId: string;
      competencies: Array<{ competencyId: string; weight?: number | null }>;
    }) => mhdJobsService.setCompetencies(descriptionId, competencies),
    onSuccess: () => invalidate(companyId),
  });
}

export function useMhdPublishDescription(companyId: string | null) {
  const invalidate = useDescriptionInvalidator();
  return useMutation({
    mutationFn: ({
      descriptionId,
      effectiveFrom,
    }: {
      descriptionId: string;
      effectiveFrom?: string | null;
    }) => mhdJobsService.publish(descriptionId, effectiveFrom),
    onSuccess: () => invalidate(companyId),
  });
}

// ---------------------------------------------------------------------------
// Competencies
// ---------------------------------------------------------------------------

export function useMhdCompetencies(companyId: string | null, industry: string | null = null) {
  return useQuery({
    queryKey: mhdJobsQueryKeys.competencies(companyId, industry),
    queryFn: () => mhdJobsService.listCompetencies(companyId!, industry),
    enabled: Boolean(companyId),
  });
}

export function useMhdUpsertCompetency(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdUpsertCompetencyInput) => mhdJobsService.upsertCompetency(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-jobs', 'competencies'] });
      // A corrected competency corrects everywhere it is referenced, because
      // descriptions reference global rows rather than copying them.
      void queryClient.invalidateQueries({ queryKey: ['mhd-jobs', 'published-for-person'] });
      if (companyId) {
        void queryClient.invalidateQueries({ queryKey: ['mhd-jobs', 'jobs'] });
      }
    },
  });
}

// ---------------------------------------------------------------------------
// Assignments
// ---------------------------------------------------------------------------

export function useMhdJobAssignments(personId: string | null) {
  return useQuery({
    queryKey: mhdJobsQueryKeys.assignments(personId),
    queryFn: () => mhdJobsService.listAssignmentsForPerson(personId!),
    enabled: Boolean(personId),
  });
}

export function useMhdAssignJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdAssignJobInput) => mhdJobsService.assign(input),
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({
        queryKey: mhdJobsQueryKeys.assignments(input.personId),
      });
      // Changing someone's job changes which description a review of them would
      // resolve, and changes the incumbent counts on both jobs.
      void queryClient.invalidateQueries({ queryKey: ['mhd-jobs', 'published-for-person'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-jobs', 'jobs'] });
    },
  });
}

// ---------------------------------------------------------------------------
// The consumer contract
// ---------------------------------------------------------------------------

/**
 * Pass `asOf` as the date the consuming record belongs to, not today. A review
 * covering last quarter must resolve the description in force then.
 */
export function useMhdPublishedJobForPerson(personId: string | null, asOf: string | null = null) {
  return useQuery({
    queryKey: mhdJobsQueryKeys.publishedForPerson(personId, asOf),
    queryFn: () => mhdJobsService.getPublishedForPerson(personId!, asOf),
    enabled: Boolean(personId),
  });
}

export function useMhdCareerOneStopOccupationLookup() {
  return useMutation({
    mutationFn: (input: MhdCareerOneStopOccupationLookupInput) => mhdJobsService.careerOneStopOccupationLookup(input),
  });
}

export function useMhdOnetOccupationSearch() {
  return useMutation({
    mutationFn: (input: MhdOnetOccupationSearchInput) => mhdJobsService.onetOccupationSearch(input),
  });
}

export function useMhdOnetOccupationLookup() {
  return useMutation({
    mutationFn: (input: MhdOnetOccupationLookupInput) => mhdJobsService.onetOccupationLookup(input),
  });
}
