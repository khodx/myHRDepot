import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdBenefitIntakeService } from './Service';
import type {
  MhdBenefitCaseType,
  MhdBenefitIntakeAnswers,
  MhdBenefitIntakePayload,
  MhdInformationRequestInput,
  MhdInformationResponseInput,
} from './Types';
export function useMhdBenefitIntakeRoute() {
  return useMutation({
    mutationFn: (input: MhdBenefitIntakeAnswers) => mhdBenefitIntakeService.route(input),
  });
}
export function useMhdSubmitBenefitIntake() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdBenefitIntakePayload) => mhdBenefitIntakeService.submit(input),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['mhd-leaves'] }),
        qc.invalidateQueries({ queryKey: ['mhd-accommodations'] }),
        qc.invalidateQueries({ queryKey: ['mhd-drafts'] }),
      ]);
    },
  });
}
export function useMhdInformationRequests(caseType: MhdBenefitCaseType, caseId: string) {
  return useQuery({
    queryKey: ['mhd-information-requests', caseType, caseId],
    queryFn: () => mhdBenefitIntakeService.listInformationRequests(caseType, caseId),
    enabled: Boolean(caseId),
  });
}
export function useMhdCreateInformationRequest() {
  return useMutation({
    mutationFn: (input: MhdInformationRequestInput) =>
      mhdBenefitIntakeService.createInformationRequest(input),
  });
}
export function useMhdRespondToInformationRequest() {
  return useMutation({
    mutationFn: (input: MhdInformationResponseInput) =>
      mhdBenefitIntakeService.respondToInformationRequest(input),
  });
}
