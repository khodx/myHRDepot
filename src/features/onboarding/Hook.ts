import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mhdOnboardingService } from './Service';
import { MHD_ONBOARDING_PACKET_DEFINITIONS } from './PacketCatalog';
import type { MhdOnboardingPacketItem } from './Types';

export function useMhdOnboardingPacket(personId: string, companyId: string) {
  const checklistQuery = useQuery({
    queryKey: ['mhd-onboarding-checklist', personId],
    queryFn: () => mhdOnboardingService.getChecklistForPerson(personId),
    enabled: !!personId,
  });

  const formsQuery = useQuery({
    queryKey: ['mhd-onboarding-forms', companyId],
    queryFn: () => mhdOnboardingService.listPacketFormsForCompany(companyId),
    enabled: !!companyId,
  });

  const items = useMemo<MhdOnboardingPacketItem[]>(() => {
    const checklistByKey = new Map(
      (checklistQuery.data ?? []).map((item) => [item.documentKey, item] as const),
    );
    const formByName = new Map((formsQuery.data ?? []).map((form) => [form.formName, form] as const));

    return MHD_ONBOARDING_PACKET_DEFINITIONS.map((packet) => {
      const checklistItem = checklistByKey.get(packet.documentKey);
      const form = formByName.get(packet.formName);

      return {
        id: checklistItem?.id ?? `pending-${personId}-${packet.documentKey}`,
        referenceId: checklistItem?.referenceId ?? 'Pending',
        companyId: checklistItem?.companyId ?? companyId,
        personId: checklistItem?.personId ?? personId,
        documentKey: packet.documentKey,
        documentRecordId: checklistItem?.documentRecordId ?? null,
        status: checklistItem?.status ?? 'NOT_STARTED',
        isRequired: checklistItem?.isRequired ?? packet.isRequiredByDefault,
        dueDate: checklistItem?.dueDate ?? null,
        completedAt: checklistItem?.completedAt ?? null,
        label: packet.label,
        formName: packet.formName,
        accessTier: packet.accessTier,
        requiresSignature: packet.requiresSignature,
        generatedDocumentRequired: packet.generatedDocumentRequired,
        description: packet.description,
        isRequiredByDefault: packet.isRequiredByDefault,
        formId: form?.formId ?? null,
        formReferenceId: form?.formReferenceId ?? null,
        formStatus: form?.formStatus ?? null,
      };
    });
  }, [checklistQuery.data, companyId, formsQuery.data, personId]);

  const requiredItems = useMemo(() => items.filter((item) => item.isRequired), [items]);
  const completedCount = useMemo(
    () => requiredItems.filter((item) => item.status === 'SUBMITTED' || item.status === 'SIGNED').length,
    [requiredItems],
  );

  return {
    items,
    requiredItems,
    completedCount,
    isFullyOnboarded: requiredItems.length > 0 && completedCount === requiredItems.length,
    isLoading: checklistQuery.isLoading || formsQuery.isLoading,
    errorMessage: checklistQuery.error?.message ?? formsQuery.error?.message ?? null,
    refresh: async () => {
      await Promise.all([checklistQuery.refetch(), formsQuery.refetch()]);
    },
  };
}
