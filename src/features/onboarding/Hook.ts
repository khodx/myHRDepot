import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mhdPersonService } from '@/features/people/Service';
import { mhdOnboardingService } from './Service';
import {
  MHD_ONBOARDING_PACKET_DEFINITIONS,
  type MhdOnboardingPacketItem,
  type MhdOnboardingRosterRow,
} from './Types';

/**
 * /onboarding roster. Two queries joined in memory: the people directory for the
 * company, and one aggregate progress call (migration 0055). People with no
 * checklist rows are absent from the progress result and surface here as
 * "not started" — the roster never fabricates checklist rows to fill the gap.
 *
 * The denominator is the app-side packet manifest, because the 22-item packet is
 * defined in MHD_ONBOARDING_PACKET_DEFINITIONS rather than in the database.
 */
export function useMhdOnboardingRoster(companyId: string | null) {
  const peopleQuery = useQuery({
    queryKey: ['mhd-onboarding-roster-people', companyId],
    queryFn: () => mhdPersonService.listPeople({ companyId: companyId ?? 'ALL', searchTerm: '' }),
    enabled: !!companyId,
  });

  const progressQuery = useQuery({
    queryKey: ['mhd-onboarding-roster-progress', companyId],
    queryFn: () => mhdOnboardingService.listProgressForCompany(companyId as string),
    enabled: !!companyId,
  });

  const packetSize = MHD_ONBOARDING_PACKET_DEFINITIONS.filter(
    (packet) => packet.isRequiredByDefault,
  ).length;

  const rows = useMemo<MhdOnboardingRosterRow[]>(() => {
    const progressByPerson = new Map(
      (progressQuery.data ?? []).map((entry) => [entry.personId, entry] as const),
    );

    return (peopleQuery.data ?? []).map((person) => {
      const progress = progressByPerson.get(person.id) ?? null;
      // Completeness is measured against the manifest, not against
      // progress.requiredItems: a partially seeded packet has fewer rows than
      // the manifest, and comparing against itself would read as complete.
      const completed = progress?.requiredCompleted ?? 0;

      return {
        personId: person.id,
        displayName: person.displayName,
        referenceId: person.referenceId,
        companyId: person.companyId,
        companyName: person.companyName,
        primaryEmail: person.primaryEmail,
        progress,
        packetSize,
        isStarted: progress !== null && progress.totalItems > 0,
        isComplete: packetSize > 0 && completed >= packetSize,
      };
    });
  }, [packetSize, peopleQuery.data, progressQuery.data]);

  return {
    rows,
    packetSize,
    isLoading: peopleQuery.isLoading || progressQuery.isLoading,
    errorMessage: peopleQuery.error?.message ?? progressQuery.error?.message ?? null,
    refresh: async () => {
      await Promise.all([peopleQuery.refetch(), progressQuery.refetch()]);
    },
  };
}

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
    const formByName = new Map(
      (formsQuery.data ?? []).map((form) => [form.formName, form] as const),
    );

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
    () =>
      requiredItems.filter((item) => item.status === 'SUBMITTED' || item.status === 'SIGNED')
        .length,
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
