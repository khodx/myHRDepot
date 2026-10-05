import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MhdDocumentMutationContext } from '@/features/documents/Types';
import type { MhdTask } from '@/features/tasks/Types';
import { mhdAuditService } from './Service';
import type {
  MhdAuditEvent,
  MhdAuditEventFilters,
  MhdRecordRetentionDecisionInput,
  MhdRetentionReviewScope,
} from './Types';

export const mhdAuditQueryKeys = {
  taskTimeline: (taskId: string | null) => ['mhd-audit', 'task-timeline', taskId ?? ''] as const,
  // Only the server-side params (entityType/actionType/from/to) are part of
  // the key — sourceModule is filtered client-side in MhdAuditReportsPage
  // and does not need to trigger a refetch.
  events: (
    companyId: string | null,
    serverFilters: Pick<MhdAuditEventFilters, 'entityType' | 'actionType' | 'from' | 'to'>,
  ) => ['mhd-audit', 'events', companyId ?? '', serverFilters] as const,
  retentionReviewRoot: ['mhd-audit', 'retention-review'] as const,
  retentionReview: (companyId: string | null, scope: MhdRetentionReviewScope) =>
    ['mhd-audit', 'retention-review', companyId ?? '', scope] as const,
  retentionHistoryRoot: ['mhd-audit', 'retention-history'] as const,
  retentionHistory: (scheduleId: string | null) =>
    ['mhd-audit', 'retention-history', scheduleId ?? ''] as const,
};

/** Query key the shell's module attention badges read (module-alerts feature). */
const MODULE_ALERTS_QUERY_KEY = ['mhd-module-alerts'] as const;

export function useMhdRetentionReview(companyId: string | null, scope: MhdRetentionReviewScope) {
  return useQuery({
    queryKey: mhdAuditQueryKeys.retentionReview(companyId, scope),
    queryFn: () => mhdAuditService.listRetentionReview(companyId!, scope),
    enabled: Boolean(companyId),
  });
}

export function useMhdRetentionDecisionHistory(scheduleId: string | null) {
  return useQuery({
    queryKey: mhdAuditQueryKeys.retentionHistory(scheduleId),
    queryFn: () => mhdAuditService.listRetentionDecisionHistory(scheduleId!),
    enabled: Boolean(scheduleId),
  });
}

/** Records a decision, then refreshes the queue, history and nav attention badge. */
export function useMhdRecordRetentionDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdRecordRetentionDecisionInput) =>
      mhdAuditService.recordRetentionDecision(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: mhdAuditQueryKeys.retentionReviewRoot }),
        queryClient.invalidateQueries({ queryKey: mhdAuditQueryKeys.retentionHistoryRoot }),
        queryClient.invalidateQueries({ queryKey: MODULE_ALERTS_QUERY_KEY }),
      ]);
    },
  });
}

export function useMhdTaskAuditTimeline(taskId: string | null) {
  return useQuery({
    queryKey: mhdAuditQueryKeys.taskTimeline(taskId),
    queryFn: () => mhdAuditService.listTaskAuditTimeline(taskId!),
    enabled: Boolean(taskId),
  });
}

export function useMhdRequestTaskAuditReport(context: MhdDocumentMutationContext | null) {
  return useMutation({
    mutationFn: ({
      task,
      generatedByDisplayName,
      templateKey,
    }: {
      task: Pick<
        MhdTask,
        | 'id'
        | 'companyId'
        | 'referenceId'
        | 'title'
        | 'assignedDate'
        | 'startDate'
        | 'dueDate'
        | 'completedDate'
        | 'statusName'
      >;
      generatedByDisplayName: string;
      /** Defaults to the master TASK_AUDIT_REPORT inside the service when
       *  omitted — pass one of the system report set's keys to generate a
       *  filtered lens instead (see TASK_AUDIT_REPORT_ROW_FILTER, Service.ts). */
      templateKey?: string;
    }) => {
      if (!context) {
        throw new Error('Cannot generate an audit report without an authenticated user.');
      }
      return mhdAuditService.requestTaskAuditReport(
        task,
        context,
        generatedByDisplayName,
        templateKey,
      );
    },
  });
}

/**
 * Company-wide audit events (mhd_list_audit_events). Only entityType/
 * actionType/from/to are sent to the server; sourceModule filtering and any
 * further narrowing happens client-side against this result set in
 * MhdAuditReportsPage.
 */
export function useMhdAuditEvents(
  companyId: string | null,
  filters: Pick<MhdAuditEventFilters, 'entityType' | 'actionType' | 'from' | 'to'>,
) {
  return useQuery({
    queryKey: mhdAuditQueryKeys.events(companyId, filters),
    queryFn: () =>
      mhdAuditService.listAuditEvents({
        companyId: companyId!,
        ...(filters.entityType !== 'ALL' ? { entityType: filters.entityType } : {}),
        ...(filters.actionType !== 'ALL' ? { actionType: filters.actionType } : {}),
        ...(filters.from ? { dateFrom: filters.from } : {}),
        // Half-open on the "to" side isn't needed here for the same reason as
        // MhdTaskAuditPage's client-side filter: performed_at is a full
        // timestamp and filters.to is a bare date, so append the end-of-day
        // boundary to make the "To" filter inclusive of that whole day.
        ...(filters.to ? { dateTo: `${filters.to}T23:59:59.999Z` } : {}),
      }),
    enabled: Boolean(companyId),
  });
}

export function useMhdRequestAuditReport(context: MhdDocumentMutationContext | null) {
  return useMutation({
    mutationFn: ({
      companyId,
      filters,
      allEvents,
      displayedEvents,
      generatedByDisplayName,
    }: {
      companyId: string;
      filters: MhdAuditEventFilters;
      allEvents: MhdAuditEvent[];
      displayedEvents: MhdAuditEvent[];
      generatedByDisplayName: string;
    }) => {
      if (!context) {
        throw new Error('Cannot generate an audit report without an authenticated user.');
      }
      return mhdAuditService.requestAuditReport(
        companyId,
        filters,
        allEvents,
        displayedEvents,
        context,
        generatedByDisplayName,
      );
    },
  });
}
