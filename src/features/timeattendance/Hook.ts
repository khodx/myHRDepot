import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdPersonService } from '@/features/people/Service';
import type {
  MhdAdjustPointsInput,
  MhdAssignScheduleTemplateInput,
  MhdAttendanceOccurrenceFilters,
  MhdCreatePolicyVersionInput,
  MhdCreateScheduleTemplateInput,
  MhdGenerateShiftsInput,
  MhdOverrideShiftInput,
  MhdReclassifyOccurrenceInput,
  MhdRecordOccurrenceInput,
  MhdResolveReassessmentInput,
  MhdResolveThresholdEventInput,
  MhdUpdateOccurrenceInput,
  MhdUpdateScheduleTemplateInput,
  MhdVoidOccurrenceInput,
} from './Types';
import { mhdTimeAttendanceService } from './Service';

export const mhdTimeAttendanceQueryKeys = {
  templates: (companyId: string | null) => ['mhd-timeattendance', 'templates', companyId ?? ''] as const,
  templateDetail: (templateId: string | null) =>
    ['mhd-timeattendance', 'template-detail', templateId ?? ''] as const,
  assignments: (personId: string | null) =>
    ['mhd-timeattendance', 'assignments', personId ?? ''] as const,
  shifts: (personId: string | null, from: string, to: string) =>
    ['mhd-timeattendance', 'shifts', personId ?? '', from, to] as const,
  holidays: (companyId: string | null) => ['mhd-timeattendance', 'holidays', companyId ?? ''] as const,
  policy: (companyId: string | null) => ['mhd-timeattendance', 'policy', companyId ?? ''] as const,
  occurrences: (filters: MhdAttendanceOccurrenceFilters) =>
    ['mhd-timeattendance', 'occurrences', filters] as const,
  pointBalance: (personId: string | null, asOf: string | null) =>
    ['mhd-timeattendance', 'point-balance', personId ?? '', asOf ?? 'today'] as const,
  pointLedger: (personId: string | null) =>
    ['mhd-timeattendance', 'point-ledger', personId ?? ''] as const,
  thresholdEvents: (companyId: string | null, status: string | null) =>
    ['mhd-timeattendance', 'threshold-events', companyId ?? '', status ?? 'ALL'] as const,
  reassessments: (companyId: string | null, status: string | null) =>
    ['mhd-timeattendance', 'reassessments', companyId ?? '', status ?? 'ALL'] as const,
  people: (companyId: string | null) => ['mhd-timeattendance', 'people', companyId ?? 'ALL'] as const,
};

/**
 * Anything that moves points must also refresh the balance, the ledger, the
 * occurrence list AND the threshold-event list — an assessment can raise an
 * event server-side, so a stale event list would hide pending discipline from
 * the person responsible for acting on it.
 */
function usePointsInvalidator() {
  const queryClient = useQueryClient();
  return (companyId: string | null, personId: string | null) => {
    void queryClient.invalidateQueries({ queryKey: ['mhd-timeattendance', 'occurrences'] });
    void queryClient.invalidateQueries({
      queryKey: mhdTimeAttendanceQueryKeys.pointLedger(personId),
    });
    void queryClient.invalidateQueries({ queryKey: ['mhd-timeattendance', 'point-balance'] });
    void queryClient.invalidateQueries({ queryKey: ['mhd-timeattendance', 'threshold-events'] });
    // A reclassification can RAISE a reassessment item server-side, so a stale
    // queue would hide the decision from the person who has to make it.
    void queryClient.invalidateQueries({ queryKey: ['mhd-timeattendance', 'reassessments'] });
    void queryClient.invalidateQueries({ queryKey: ['mhd-timeattendance', 'shifts'] });
    if (companyId) {
      void queryClient.invalidateQueries({
        queryKey: mhdTimeAttendanceQueryKeys.policy(companyId),
      });
    }
  };
}

// ---------------------------------------------------------------------------
// Schedule
// ---------------------------------------------------------------------------

export function useMhdScheduleTemplates(companyId: string | null) {
  return useQuery({
    queryKey: mhdTimeAttendanceQueryKeys.templates(companyId),
    queryFn: () => mhdTimeAttendanceService.listTemplates(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useMhdScheduleTemplate(templateId: string | null) {
  return useQuery({
    queryKey: mhdTimeAttendanceQueryKeys.templateDetail(templateId),
    queryFn: () => mhdTimeAttendanceService.getTemplate(templateId!),
    enabled: Boolean(templateId),
  });
}

export function useMhdCreateScheduleTemplate(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdCreateScheduleTemplateInput) =>
      mhdTimeAttendanceService.createTemplate(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mhdTimeAttendanceQueryKeys.templates(companyId),
      });
    },
  });
}

export function useMhdUpdateScheduleTemplate(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdUpdateScheduleTemplateInput) =>
      mhdTimeAttendanceService.updateTemplate(input),
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({
        queryKey: mhdTimeAttendanceQueryKeys.templates(companyId),
      });
      void queryClient.invalidateQueries({
        queryKey: mhdTimeAttendanceQueryKeys.templateDetail(input.templateId),
      });
    },
  });
}

export function useMhdDeleteScheduleTemplate(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => mhdTimeAttendanceService.deleteTemplate(templateId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mhdTimeAttendanceQueryKeys.templates(companyId),
      });
    },
  });
}

export function useMhdScheduleAssignments(personId: string | null) {
  return useQuery({
    queryKey: mhdTimeAttendanceQueryKeys.assignments(personId),
    queryFn: () => mhdTimeAttendanceService.listAssignments(personId!),
    enabled: Boolean(personId),
  });
}

export function useMhdAssignScheduleTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdAssignScheduleTemplateInput) =>
      mhdTimeAttendanceService.assignTemplate(input),
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({
        queryKey: mhdTimeAttendanceQueryKeys.assignments(input.personId),
      });
      // A new assignment changes what future generation will produce, but does
      // NOT retroactively rewrite existing shifts — the list is invalidated so
      // the calendar reflects any regeneration the user runs next.
      void queryClient.invalidateQueries({ queryKey: ['mhd-timeattendance', 'shifts'] });
    },
  });
}

export function useMhdEndScheduleAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, effectiveTo }: { assignmentId: string; effectiveTo: string }) =>
      mhdTimeAttendanceService.endAssignment(assignmentId, effectiveTo),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-timeattendance', 'assignments'] });
    },
  });
}

export function useMhdScheduledShifts(personId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: mhdTimeAttendanceQueryKeys.shifts(personId, from, to),
    queryFn: () => mhdTimeAttendanceService.listShifts(personId!, from, to),
    enabled: Boolean(personId && from && to),
  });
}

export function useMhdGenerateShifts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdGenerateShiftsInput) => mhdTimeAttendanceService.generateShifts(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-timeattendance', 'shifts'] });
    },
  });
}

export function useMhdOverrideShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdOverrideShiftInput) => mhdTimeAttendanceService.overrideShift(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-timeattendance', 'shifts'] });
    },
  });
}

export function useMhdCompanyHolidays(companyId: string | null) {
  return useQuery({
    queryKey: mhdTimeAttendanceQueryKeys.holidays(companyId),
    queryFn: () => mhdTimeAttendanceService.listHolidays(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useMhdUpsertHoliday(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      holidayDate,
      holidayName,
      isPaid,
    }: {
      holidayDate: string;
      holidayName: string;
      isPaid?: boolean;
    }) => mhdTimeAttendanceService.upsertHoliday(companyId!, holidayDate, holidayName, isPaid ?? true),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mhdTimeAttendanceQueryKeys.holidays(companyId),
      });
      // Generation skips holidays, so an added holiday changes future output.
      void queryClient.invalidateQueries({ queryKey: ['mhd-timeattendance', 'shifts'] });
    },
  });
}

export function useMhdDeleteHoliday(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (holidayId: string) => mhdTimeAttendanceService.deleteHoliday(holidayId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mhdTimeAttendanceQueryKeys.holidays(companyId),
      });
      void queryClient.invalidateQueries({ queryKey: ['mhd-timeattendance', 'shifts'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Policy
// ---------------------------------------------------------------------------

export function useMhdAttendancePolicy(companyId: string | null) {
  return useQuery({
    queryKey: mhdTimeAttendanceQueryKeys.policy(companyId),
    queryFn: () => mhdTimeAttendanceService.getPolicy(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useMhdCreatePolicyVersion(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdCreatePolicyVersionInput) =>
      mhdTimeAttendanceService.createPolicyVersion(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mhdTimeAttendanceQueryKeys.policy(companyId),
      });
      // A new version changes projected points for anything recorded from here
      // on, but never restates history — existing ledger rows keep their own
      // policy_id.
      void queryClient.invalidateQueries({ queryKey: ['mhd-timeattendance', 'occurrences'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Occurrences
// ---------------------------------------------------------------------------

export function useMhdAttendanceOccurrences(filters: MhdAttendanceOccurrenceFilters) {
  return useQuery({
    queryKey: mhdTimeAttendanceQueryKeys.occurrences(filters),
    queryFn: () => mhdTimeAttendanceService.listOccurrences(filters),
    enabled: Boolean(filters.companyId),
  });
}

export function useMhdRecordOccurrence(companyId: string | null) {
  const invalidatePoints = usePointsInvalidator();
  return useMutation({
    mutationFn: (input: MhdRecordOccurrenceInput) =>
      mhdTimeAttendanceService.recordOccurrence({
        personId: input.personId,
        occurrenceDate: input.occurrenceDate,
        occurrenceType: input.occurrenceType,
        classification: input.classification,
        protectedLeaveCategory: input.protectedLeaveCategory ?? null,
        minutesVariance: input.minutesVariance ?? null,
        reasonNote: input.reasonNote ?? null,
        scheduledShiftId: input.scheduledShiftId ?? null,
      }),
    onSuccess: (_result, input) => invalidatePoints(companyId, input.personId),
  });
}

export function useMhdUpdateOccurrence(companyId: string | null) {
  const invalidatePoints = usePointsInvalidator();
  return useMutation({
    mutationFn: (input: MhdUpdateOccurrenceInput) =>
      mhdTimeAttendanceService.updateOccurrence(input),
    onSuccess: () => invalidatePoints(companyId, null),
  });
}

/**
 * Reclassification can move points server-side (the reversal trigger), so it
 * invalidates the full points surface rather than just the occurrence row.
 */
export function useMhdReclassifyOccurrence(companyId: string | null) {
  const invalidatePoints = usePointsInvalidator();
  return useMutation({
    mutationFn: (input: MhdReclassifyOccurrenceInput) =>
      mhdTimeAttendanceService.reclassifyOccurrence(input),
    onSuccess: () => invalidatePoints(companyId, null),
  });
}

export function useMhdVoidOccurrence(companyId: string | null) {
  const invalidatePoints = usePointsInvalidator();
  return useMutation({
    mutationFn: (input: MhdVoidOccurrenceInput) => mhdTimeAttendanceService.voidOccurrence(input),
    onSuccess: () => invalidatePoints(companyId, null),
  });
}

// ---------------------------------------------------------------------------
// Points
// ---------------------------------------------------------------------------

export function useMhdPointBalance(personId: string | null, asOf: string | null = null) {
  return useQuery({
    queryKey: mhdTimeAttendanceQueryKeys.pointBalance(personId, asOf),
    queryFn: () => mhdTimeAttendanceService.pointBalance(personId!, asOf),
    enabled: Boolean(personId),
  });
}

export function useMhdPointLedger(personId: string | null) {
  return useQuery({
    queryKey: mhdTimeAttendanceQueryKeys.pointLedger(personId),
    queryFn: () => mhdTimeAttendanceService.listPointLedger(personId!),
    enabled: Boolean(personId),
  });
}

export function useMhdAdjustPoints(companyId: string | null) {
  const invalidatePoints = usePointsInvalidator();
  return useMutation({
    mutationFn: (input: MhdAdjustPointsInput) => mhdTimeAttendanceService.adjustPoints(input),
    onSuccess: (_result, input) => invalidatePoints(companyId, input.personId),
  });
}

// ---------------------------------------------------------------------------
// Threshold events (privileged only)
// ---------------------------------------------------------------------------

export function useMhdThresholdEvents(companyId: string | null, status: string | null = null) {
  return useQuery({
    queryKey: mhdTimeAttendanceQueryKeys.thresholdEvents(companyId, status),
    queryFn: () => mhdTimeAttendanceService.listThresholdEvents(companyId!, status),
    enabled: Boolean(companyId),
  });
}

export function useMhdResolveThresholdEvent(_companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdResolveThresholdEventInput) =>
      mhdTimeAttendanceService.resolveThresholdEvent(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['mhd-timeattendance', 'threshold-events'],
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Reassessment queue (privileged only — the consistency record)
// ---------------------------------------------------------------------------

/**
 * Pass no status to get open items first then resolved history — the resolved
 * rows are the evidence that the policy was applied consistently, so the panel
 * should show them rather than hiding everything that has been dealt with.
 */
export function useMhdReassessmentEvents(companyId: string | null, status: string | null = null) {
  return useQuery({
    queryKey: mhdTimeAttendanceQueryKeys.reassessments(companyId, status),
    queryFn: () => mhdTimeAttendanceService.listReassessmentEvents(companyId!, status),
    enabled: Boolean(companyId),
  });
}

export function useMhdResolveReassessmentEvent(companyId: string | null) {
  const invalidatePoints = usePointsInvalidator();
  return useMutation({
    mutationFn: (input: MhdResolveReassessmentInput) =>
      mhdTimeAttendanceService.resolveReassessmentEvent(input),
    // ASSESSED writes a backdated ledger entry and can cross a threshold
    // retroactively, so the whole points surface has to refresh — not just the
    // queue the user was looking at.
    onSuccess: () => invalidatePoints(companyId, null),
  });
}

// ---------------------------------------------------------------------------
// Pickers
// ---------------------------------------------------------------------------

export function useMhdAttendancePeople(companyId: string | null) {
  return useQuery({
    queryKey: mhdTimeAttendanceQueryKeys.people(companyId),
    queryFn: () => mhdPersonService.listPeople({ companyId: companyId!, searchTerm: '' }),
    enabled: Boolean(companyId),
  });
}
