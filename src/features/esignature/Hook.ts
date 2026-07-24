import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdEsignatureService } from './Service';
import type { MhdCreateEsignatureRequestFromGenerationInput } from './Types';

const esignatureKeys = {
  requests: (companyId: string | null) => ['esignature-requests', companyId ?? ''] as const,
  request: (requestId: string | null) => ['esignature-request', requestId ?? ''] as const,
  events: (requestId: string | null) => ['esignature-events', requestId ?? ''] as const,
  generatedDocuments: (companyId: string | null, personId: string | null) =>
    ['esignature-generated-documents', companyId ?? '', personId ?? ''] as const,
  users: (companyId: string | null) => ['esignature-users', companyId ?? ''] as const,
};

export function useMhdEsignatureRequests(companyId: string | null) {
  return useQuery({
    queryKey: esignatureKeys.requests(companyId),
    queryFn: () => mhdEsignatureService.listRequestsForCompany(companyId!),
    enabled: !!companyId,
  });
}

export function useMhdEsignatureRequest(requestId: string | null) {
  return useQuery({
    queryKey: esignatureKeys.request(requestId),
    queryFn: () => mhdEsignatureService.getRequest(requestId!),
    enabled: !!requestId,
  });
}

export function useMhdEsignatureEvents(requestId: string | null) {
  return useQuery({
    queryKey: esignatureKeys.events(requestId),
    queryFn: () => mhdEsignatureService.getEvents(requestId!),
    enabled: !!requestId,
  });
}

export function useMhdEsignatureGeneratedDocuments(
  companyId: string | null,
  personId?: string | null,
) {
  return useQuery({
    queryKey: esignatureKeys.generatedDocuments(companyId, personId ?? null),
    queryFn: () => mhdEsignatureService.listGeneratedDocuments(companyId!, personId),
    enabled: !!companyId,
  });
}

export function useMhdEsignatureAssignableUsers(companyId: string | null) {
  return useQuery({
    queryKey: esignatureKeys.users(companyId),
    queryFn: () => mhdEsignatureService.listAssignableUsers(companyId!),
    enabled: !!companyId,
  });
}

export function useMhdEsignatureActions() {
  const queryClient = useQueryClient();

  async function invalidate() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['esignature-requests'] }),
      queryClient.invalidateQueries({ queryKey: ['esignature-request'] }),
      queryClient.invalidateQueries({ queryKey: ['esignature-events'] }),
      queryClient.invalidateQueries({ queryKey: ['esignature-generated-documents'] }),
    ]);
  }

  const createRequestFromGeneratedDocument = useMutation({
    mutationFn: (input: MhdCreateEsignatureRequestFromGenerationInput) =>
      mhdEsignatureService.createRequestFromGeneratedDocument(input),
    onSuccess: invalidate,
  });

  const sendReminder = useMutation({
    mutationFn: (signerId: string) => mhdEsignatureService.sendReminder(signerId),
    onSuccess: invalidate,
  });

  const voidRequest = useMutation({
    mutationFn: (requestId: string) => mhdEsignatureService.voidRequest(requestId),
    onSuccess: invalidate,
  });

  return {
    createRequestFromGeneratedDocument,
    sendReminder,
    voidRequest,
  };
}
