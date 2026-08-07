import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { mhdPersonService } from './Service';
import type { MhdPeopleListFilters } from './Types';

export const mhdPeopleQueryKeys = {
  picker: (companyId: string | null) => ['mhd-people', 'picker', companyId ?? 'ALL'] as const,
  list: (filters: MhdPeopleListFilters) => ['mhd-people', 'list', filters] as const,
};

/**
 * Shared company-scoped people picker. Before 2026-08-06 (audit finding M3),
 * jobs, leaves, and mileage each independently defined a near-identical
 * useMhd*People hook wrapping the same mhdPersonService.listPeople query —
 * this is the one they now all call instead.
 */
export function useMhdPeoplePicker(companyId: string | null) {
  return useQuery({
    queryKey: mhdPeopleQueryKeys.picker(companyId),
    queryFn: () => mhdPersonService.listPeople({ companyId: companyId!, searchTerm: '' }),
    enabled: Boolean(companyId),
  });
}

/**
 * Before 2026-08-06 (audit finding M5), this was the one feature hook not
 * using TanStack Query — a hand-rolled useState/useEffect/try-catch fetch,
 * unlike every sibling feature. Migrated to match that shared convention
 * (caching, dedup, refetch-on-focus). `createPerson`/`updatePerson` were
 * dropped from the old return value: no caller used them — every actual
 * create/update flow (MhdPersonFormPage, MhdUserInvitePage, the lab sandbox
 * seeder) already calls `mhdPersonService.createPerson`/`updatePerson`
 * directly — so they were dead wrappers, not a preserved contract.
 */
export function useMhdPeople(initialFilters: MhdPeopleListFilters) {
  const [filters, setFilters] = useState<MhdPeopleListFilters>(initialFilters);
  // Raw user selection; the effective `selectedPersonId` below falls back to
  // the first result whenever this is unset or no longer present in `people`
  // (e.g. after a filter change) — derived at render time rather than via a
  // setState-in-effect, per this codebase's lint convention.
  const [selectedPersonIdOverride, setSelectedPersonIdOverride] = useState<string | null>(null);

  const query = useQuery({
    queryKey: mhdPeopleQueryKeys.list(filters),
    queryFn: () => mhdPersonService.listPeople(filters),
  });

  const people = useMemo(() => query.data ?? [], [query.data]);

  const selectedPersonId = useMemo(() => {
    if (
      selectedPersonIdOverride &&
      people.some((person) => person.id === selectedPersonIdOverride)
    ) {
      return selectedPersonIdOverride;
    }
    return people[0]?.id ?? null;
  }, [people, selectedPersonIdOverride]);

  const selectedPerson = useMemo(
    () => people.find((person) => person.id === selectedPersonId) ?? null,
    [people, selectedPersonId],
  );

  return {
    filters,
    setFilters,
    people,
    selectedPerson,
    selectedPersonId,
    setSelectedPersonId: setSelectedPersonIdOverride,
    isLoading: query.isLoading,
    errorMessage: query.isError
      ? query.error instanceof Error
        ? query.error.message
        : 'Unable to load people.'
      : null,
    refreshPeople: query.refetch,
  };
}
