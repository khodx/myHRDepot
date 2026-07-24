import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdPersonService } from '@/features/people/Service';
import { mhdTaskService } from '@/features/tasks/Service';
import type {
  MhdConductCaseFilters,
  MhdCreateConductActionInput,
  MhdCreateConductCaseInput,
  MhdConductCeremonyStepState,
  MhdIssueConductActionInput,
  MhdRecordConductOutcomeInput,
  MhdTransitionConductCaseInput,
  MhdUpdateConductActionInput,
} from './Types';
import { mhdConductService } from './Service';

export const mhdConductQueryKeys = {
  cases: (filters: MhdConductCaseFilters) => ['mhd-conduct', 'cases', filters] as const,
  caseDetail: (companyId: string | null, caseId: string | null) =>
    ['mhd-conduct', 'case-detail', companyId ?? '', caseId ?? ''] as const,
  caseActions: (caseId: string | null) => ['mhd-conduct', 'case-actions', caseId ?? ''] as const,
  people: (companyId: string | null) => ['mhd-conduct', 'people', companyId ?? 'ALL'] as const,
  users: (companyId: string | null) => ['mhd-conduct', 'users', companyId ?? 'ALL'] as const,
};

export function useMhdConductCases(filters: MhdConductCaseFilters) {
  return useQuery({
    queryKey: mhdConductQueryKeys.cases(filters),
    queryFn: () => mhdConductService.listCases(filters),
    enabled: Boolean(filters.companyId),
  });
}

export function useMhdConductCase(companyId: string | null, caseId: string | null) {
  return useQuery({
    queryKey: mhdConductQueryKeys.caseDetail(companyId, caseId),
    queryFn: () => mhdConductService.getCase(companyId!, caseId!),
    enabled: Boolean(companyId) && Boolean(caseId),
  });
}

export function useMhdConductActions(caseId: string | null) {
  return useQuery({
    queryKey: mhdConductQueryKeys.caseActions(caseId),
    queryFn: () => mhdConductService.listActions(caseId!),
    enabled: Boolean(caseId),
  });
}

/** Subject picker (People directory). */
export function useMhdConductPeople(companyId: string | null, enabled = true) {
  return useQuery({
    queryKey: mhdConductQueryKeys.people(companyId),
    queryFn: () => mhdPersonService.listPeople({ companyId: companyId ?? 'ALL', searchTerm: '' }),
    enabled: enabled && Boolean(companyId),
  });
}

/** Witness picker (`mhd_list_task_assignable_users` via the Tasks contract). */
export function useMhdConductUsers(companyId: string | null, enabled = true) {
  return useQuery({
    queryKey: mhdConductQueryKeys.users(companyId),
    queryFn: () => mhdTaskService.listAssignableUsers(companyId ?? 'ALL'),
    enabled: enabled && Boolean(companyId),
  });
}

export function useMhdConductActionsMutations() {
  const queryClient = useQueryClient();

  async function invalidate() {
    await queryClient.invalidateQueries({ queryKey: ['mhd-conduct'] });
  }

  const createCase = useMutation({
    mutationFn: (input: MhdCreateConductCaseInput) => mhdConductService.createCase(input),
    onSuccess: invalidate,
  });

  const transitionCase = useMutation({
    mutationFn: ({ caseId, input }: { caseId: string; input: MhdTransitionConductCaseInput }) =>
      mhdConductService.transitionCase(caseId, input),
    onSuccess: invalidate,
  });

  const openFromThreshold = useMutation({
    mutationFn: (thresholdEventId: string) => mhdConductService.openFromThreshold(thresholdEventId),
    onSuccess: invalidate,
  });

  const createAction = useMutation({
    mutationFn: (input: MhdCreateConductActionInput) => mhdConductService.createAction(input),
    onSuccess: invalidate,
  });

  const updateAction = useMutation({
    mutationFn: ({ actionId, input }: { actionId: string; input: MhdUpdateConductActionInput }) =>
      mhdConductService.updateAction(actionId, input),
    onSuccess: invalidate,
  });

  const recordOutcome = useMutation({
    mutationFn: ({ actionId, input }: { actionId: string; input: MhdRecordConductOutcomeInput }) =>
      mhdConductService.recordOutcome(actionId, input),
    onSuccess: invalidate,
  });

  const deleteAction = useMutation({
    mutationFn: (actionId: string) => mhdConductService.deleteAction(actionId),
    onSuccess: invalidate,
  });

  const issueAction = useMutation({
    mutationFn: (input: MhdIssueConductActionInput) =>
      mhdConductService.issueActionWithCeremony(input),
    onSuccess: invalidate,
  });

  return {
    createCase,
    transitionCase,
    openFromThreshold,
    createAction,
    updateAction,
    recordOutcome,
    deleteAction,
    issueAction,
  };
}

/**
 * Step-state ceremony hook for the corrective-action launcher (the Offboarding
 * exit-document pattern). Drives the DRAFT -> ISSUED document ceremony and
 * exposes per-step progress so the operator sees exactly where it stopped.
 */
export function useMhdConductActionCeremony() {
  const actions = useMhdConductActionsMutations();
  const [steps, setSteps] = useState<MhdConductCeremonyStepState[]>([]);

  const reset = useCallback(() => {
    actions.issueAction.reset();
    setSteps([]);
  }, [actions.issueAction]);

  const issue = useCallback(
    async (input: MhdIssueConductActionInput) => {
      // A no-document action has a single "issue" step; a document action runs
      // the full ceremony ladder.
      const initialSteps: MhdConductCeremonyStepState[] = input.requiresDocument
        ? (
            [
              ['resolve-template', 'Resolve corrective-action template'],
              ['request-generation', 'Request document generation'],
              ['render-document', 'Render document'],
              ['wait-for-generation', 'Verify generated document'],
              ['resolve-document-hash', 'Verify document hash'],
              ['create-signature-request', 'Create signature request'],
              [
                'issue-action',
                'Issue action and notify the employee for acknowledgment of receipt',
              ],
            ] as const
          ).map(([key, label]) => ({ key, label, status: 'PENDING' as const }))
        : [{ key: 'issue-action', label: 'Issue action', status: 'PENDING' as const }];
      setSteps(initialSteps);

      try {
        const result = await actions.issueAction.mutateAsync({
          ...input,
          onStep: (stepNumber) => {
            setSteps((current) =>
              current.map((step, index) => ({
                ...step,
                status: index < stepNumber ? 'DONE' : index === stepNumber ? 'RUNNING' : 'PENDING',
              })),
            );
          },
        });
        setSteps((current) => current.map((step) => ({ ...step, status: 'DONE' })));
        return result;
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause);
        const match = /Corrective action step (\d+)/.exec(message);
        const failedStep = match ? Number(match[1]) : 0;
        setSteps((current) =>
          current.map((step, index) => ({
            ...step,
            status: index < failedStep ? 'DONE' : index === failedStep ? 'ERROR' : 'PENDING',
            ...(index === failedStep ? { errorMessage: message } : {}),
          })),
        );
        throw cause;
      }
    },
    [actions.issueAction],
  );

  return { issue, reset, isIssuing: actions.issueAction.isPending, steps };
}
