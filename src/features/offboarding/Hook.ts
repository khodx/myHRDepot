import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdPersonService } from '@/features/people/Service';
import { mhdTaskService } from '@/features/tasks/Service';
import type {
  MhdCreateOffboardingCaseInput,
  MhdCreateOffboardingItemInput,
  MhdExitCeremonyStepState,
  MhdGenerateExitDocumentInput,
  MhdOffboardingCaseFilters,
  MhdTransitionOffboardingCaseInput,
  MhdUpdateOffboardingCaseInput,
  MhdUpdateOffboardingItemInput,
} from './Types';
import { mhdOffboardingService } from './Service';

export const mhdOffboardingQueryKeys = {
  cases: (filters: MhdOffboardingCaseFilters) => ['mhd-offboarding', 'cases', filters] as const,
  caseDetail: (caseId: string | null) => ['mhd-offboarding', 'case-detail', caseId ?? ''] as const,
  caseItems: (caseId: string | null) => ['mhd-offboarding', 'case-items', caseId ?? ''] as const,
  outstandingProperty: (personId: string | null) =>
    ['mhd-offboarding', 'outstanding-property', personId ?? ''] as const,
  exitInterviewActivities: (companyId: string | null, personId: string | null) =>
    ['mhd-offboarding', 'exit-interview-activities', companyId ?? '', personId ?? ''] as const,
  people: (companyId: string | null) => ['mhd-offboarding', 'people', companyId ?? 'ALL'] as const,
  users: (companyId: string | null) => ['mhd-offboarding', 'users', companyId ?? 'ALL'] as const,
};

export function useMhdOffboardingCases(filters: MhdOffboardingCaseFilters) {
  return useQuery({
    queryKey: mhdOffboardingQueryKeys.cases(filters),
    queryFn: () => mhdOffboardingService.listCases(filters),
    enabled: Boolean(filters.companyId),
  });
}

export function useMhdOffboardingCase(caseId: string | null) {
  return useQuery({
    queryKey: mhdOffboardingQueryKeys.caseDetail(caseId),
    queryFn: () => mhdOffboardingService.getCaseById(caseId!),
    enabled: Boolean(caseId),
  });
}

export function useMhdOffboardingItems(caseId: string | null) {
  return useQuery({
    queryKey: mhdOffboardingQueryKeys.caseItems(caseId),
    queryFn: () => mhdOffboardingService.listItems(caseId!),
    enabled: Boolean(caseId),
  });
}

/** Outstanding ISSUED property for the case subject (Property contract, rule 6). */
export function useMhdOffboardingOutstandingProperty(personId: string | null, enabled = true) {
  return useQuery({
    queryKey: mhdOffboardingQueryKeys.outstandingProperty(personId),
    queryFn: () => mhdOffboardingService.listOutstandingProperty(personId!),
    enabled: enabled && Boolean(personId),
  });
}

/** Person-scoped EXIT_INTERVIEW surface (Activities contract, rule 8). */
export function useMhdOffboardingExitInterviewActivities(
  companyId: string | null,
  personId: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: mhdOffboardingQueryKeys.exitInterviewActivities(companyId, personId),
    queryFn: () => mhdOffboardingService.listExitInterviewActivities(companyId!, personId!),
    enabled: enabled && Boolean(companyId) && Boolean(personId),
  });
}

/** Subject picker (People directory). */
export function useMhdOffboardingPeople(companyId: string | null, enabled = true) {
  return useQuery({
    queryKey: mhdOffboardingQueryKeys.people(companyId),
    queryFn: () => mhdPersonService.listPeople({ companyId: companyId ?? 'ALL', searchTerm: '' }),
    enabled: enabled && Boolean(companyId),
  });
}

/** Item assignee picker (`mhd_list_task_assignable_users` via the Tasks contract). */
export function useMhdOffboardingUsers(companyId: string | null, enabled = true) {
  return useQuery({
    queryKey: mhdOffboardingQueryKeys.users(companyId),
    queryFn: () => mhdTaskService.listAssignableUsers(companyId ?? 'ALL'),
    enabled: enabled && Boolean(companyId),
  });
}

export function useMhdOffboardingActions() {
  const queryClient = useQueryClient();

  async function invalidate() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['mhd-offboarding'] }),
      // Exit-interview quick-create and case linking mutate Activities data.
      queryClient.invalidateQueries({ queryKey: ['mhd-activities'] }),
    ]);
  }

  const createCase = useMutation({
    mutationFn: (input: MhdCreateOffboardingCaseInput) => mhdOffboardingService.createCase(input),
    onSuccess: invalidate,
  });

  const updateCase = useMutation({
    mutationFn: ({ caseId, input }: { caseId: string; input: MhdUpdateOffboardingCaseInput }) =>
      mhdOffboardingService.updateCase(caseId, input),
    onSuccess: invalidate,
  });

  const transitionCase = useMutation({
    mutationFn: ({ caseId, input }: { caseId: string; input: MhdTransitionOffboardingCaseInput }) =>
      mhdOffboardingService.transitionCase(caseId, input),
    onSuccess: invalidate,
  });

  const deleteCase = useMutation({
    mutationFn: (caseId: string) => mhdOffboardingService.deleteCase(caseId),
    onSuccess: invalidate,
  });

  const createItem = useMutation({
    mutationFn: (input: MhdCreateOffboardingItemInput) => mhdOffboardingService.createItem(input),
    onSuccess: invalidate,
  });

  const updateItem = useMutation({
    mutationFn: ({ itemId, input }: { itemId: string; input: MhdUpdateOffboardingItemInput }) =>
      mhdOffboardingService.updateItem(itemId, input),
    onSuccess: invalidate,
  });

  const deleteItem = useMutation({
    mutationFn: (itemId: string) => mhdOffboardingService.deleteItem(itemId),
    onSuccess: invalidate,
  });

  const generateExitDocument = useMutation({
    mutationFn: (input: MhdGenerateExitDocumentInput) =>
      mhdOffboardingService.generateExitDocumentForCase(input),
    onSuccess: invalidate,
  });

  const createExitInterviewActivity = useMutation({
    mutationFn: (input: Parameters<typeof mhdOffboardingService.createExitInterviewActivity>[0]) =>
      mhdOffboardingService.createExitInterviewActivity(input),
    onSuccess: invalidate,
  });

  const linkExitInterview = useMutation({
    mutationFn: ({ caseId, activityId }: { caseId: string; activityId: string }) =>
      mhdOffboardingService.updateCase(caseId, { exitInterviewActivityId: activityId }),
    onSuccess: invalidate,
  });

  const createAndLinkExitInterview = useMutation({
    mutationFn: (input: { caseId: string; title: string; activityDate: string }) =>
      mhdOffboardingService.createAndLinkExitInterview(input),
    onSuccess: invalidate,
  });

  return {
    createCase,
    updateCase,
    transitionCase,
    deleteCase,
    createItem,
    updateItem,
    deleteItem,
    generateExitDocument,
    createExitInterviewActivity,
    linkExitInterview,
    createAndLinkExitInterview,
  };
}

/** Component-facing split contracts over the one shared invalidation domain. */
export function useMhdOffboardingCaseActions() {
  const actions = useMhdOffboardingActions();
  return {
    createCase: actions.createCase,
    updateCase: actions.updateCase,
    transitionCase: {
      ...actions.transitionCase,
      mutateAsync: ({
        caseId,
        newStatus,
        cancelReason,
      }: {
        caseId: string;
        newStatus: MhdTransitionOffboardingCaseInput['newStatus'];
        cancelReason?: string | null;
      }) => actions.transitionCase.mutateAsync({ caseId, input: { newStatus, cancelReason } }),
    },
    deleteCase: {
      ...actions.deleteCase,
      mutateAsync: ({ caseId }: { caseId: string }) => actions.deleteCase.mutateAsync(caseId),
    },
    createExitInterviewActivity: actions.createExitInterviewActivity,
    linkExitInterview: actions.linkExitInterview,
    createAndLinkExitInterview: actions.createAndLinkExitInterview,
  };
}

export function useMhdOffboardingItemActions() {
  const actions = useMhdOffboardingActions();
  return {
    createItem: {
      ...actions.createItem,
      mutateAsync: ({
        caseId,
        input,
      }: {
        caseId: string;
        input: Omit<MhdCreateOffboardingItemInput, 'caseId'>;
      }) => actions.createItem.mutateAsync({ caseId, ...input }),
    },
    updateItem: actions.updateItem,
    deleteItem: {
      ...actions.deleteItem,
      mutateAsync: ({ itemId }: { itemId: string }) => actions.deleteItem.mutateAsync(itemId),
    },
    completeItem: {
      ...actions.updateItem,
      mutateAsync: ({ itemId }: { itemId: string }) =>
        actions.updateItem.mutateAsync({ itemId, input: { status: 'COMPLETED' } }),
    },
    waiveItem: {
      ...actions.updateItem,
      mutateAsync: ({
        itemId,
        status,
        reason,
      }: {
        itemId: string;
        status: 'WAIVED' | 'NOT_APPLICABLE';
        reason: string;
      }) => actions.updateItem.mutateAsync({ itemId, input: { status, reason } }),
    },
  };
}

/** Step-state ceremony hook for the exit-document launcher (Performance pattern). */
export function useMhdExitDocumentCeremony() {
  const actions = useMhdOffboardingActions();
  const [steps, setSteps] = useState<MhdExitCeremonyStepState[]>([]);

  const reset = useCallback(() => {
    actions.generateExitDocument.reset();
    setSteps([]);
  }, [actions.generateExitDocument]);

  const launch = useCallback(
    async (
      caseId: string,
      options?: Pick<
        MhdGenerateExitDocumentInput,
        'templateId' | 'manualDocumentHash' | 'expiresAt' | 'actorUserId'
      >,
    ) => {
      const initialSteps: MhdExitCeremonyStepState[] = [
        ['resolve-template', 'Resolve exit acknowledgment template'],
        ['request-generation', 'Request document generation'],
        ['render-document', 'Render document'],
        ['wait-for-generation', 'Verify generated document'],
        ['resolve-document-hash', 'Verify document hash'],
        ['create-signature-request', 'Create signature request'],
        ['link-item-evidence', 'Link signature request to the exit acknowledgment item'],
      ].map(([key, label]) => ({ key, label, status: 'PENDING' }));
      setSteps(initialSteps);

      try {
        const result = await actions.generateExitDocument.mutateAsync({
          caseId,
          ...options,
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
        const match = /Exit document step (\d+)/.exec(message);
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
    [actions.generateExitDocument],
  );

  return { launch, reset, isLaunching: actions.generateExitDocument.isPending, steps };
}
