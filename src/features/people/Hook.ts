import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { mhdPersonService } from './Service';
import type { MhdPeopleListFilters } from './Types';

export const mhdPeopleQueryKeys = {
  picker: (companyId: string | null) => ['mhd-people', 'picker', companyId ?? 'ALL'] as const,
  list: (filters: MhdPeopleListFilters) => ['mhd-people', 'list', filters] as const,
  directReports: (personId: string | null) =>
    ['mhd-people', 'direct-reports', personId ?? 'none'] as const,
  orgChart: (companyId: string | null) => ['mhd-people', 'org-chart', companyId ?? 'ALL'] as const,
  currentEmploymentState: (personId: string | null) =>
    ['mhd-people', 'current-employment-state', personId ?? 'none'] as const,
  photoUrl: (photoPath: string | null) => ['mhd-people', 'photo-url', photoPath ?? 'none'] as const,
  photoUrls: (cacheKey: string) => ['mhd-people', 'photo-urls', cacheKey] as const,
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

export function useMhdDirectReports(personId: string | null) {
  return useQuery({
    queryKey: mhdPeopleQueryKeys.directReports(personId),
    queryFn: () => mhdPersonService.listDirectReports(personId!),
    enabled: Boolean(personId),
  });
}

export function useMhdOrgChart(companyId: string | null) {
  return useQuery({
    queryKey: mhdPeopleQueryKeys.orgChart(companyId),
    queryFn: () => mhdPersonService.listOrgChart(companyId),
  });
}

/** The signed-in person's own open employment-state row — used for the
 *  dashboard's tenure display (see mhd_person_current_employment_state). */
export function useMhdPersonCurrentEmploymentState(personId: string | null) {
  return useQuery({
    queryKey: mhdPeopleQueryKeys.currentEmploymentState(personId),
    queryFn: () => mhdPersonService.getCurrentEmploymentState(personId!),
    enabled: Boolean(personId),
    staleTime: 60_000,
  });
}

/**
 * Resolves a people.photo_path into a viewable (signed) URL. The
 * person-photos bucket is private, so every consumer that wants to render a
 * photo — the dashboard greeting, the topbar identity bubble, the person
 * detail page — goes through this one shared hook rather than each calling
 * mhdPersonService.getPersonPhotoSignedUrl itself (see CLAUDE.md's "engines,
 * not per-feature copies" standard). Signed URLs are requested for 1 hour;
 * staleTime is kept comfortably under that so a stale-but-cached URL is never
 * served past its own expiry.
 */
export function useMhdPersonPhotoUrl(photoPath: string | null | undefined) {
  const normalizedPath = photoPath ?? null;
  return useQuery({
    queryKey: mhdPeopleQueryKeys.photoUrl(normalizedPath),
    queryFn: () => mhdPersonService.getPersonPhotoSignedUrl(normalizedPath!),
    enabled: Boolean(normalizedPath),
    staleTime: 45 * 60_000,
  });
}

/**
 * List-view counterpart to useMhdPersonPhotoUrl — resolves many photo paths
 * in one Storage call instead of one hook instance per row (an N-row table
 * calling the single-path hook N times would mean N separate sign requests).
 * Returns a path -> signed URL map; a path missing from the map (never
 * requested, or failed to sign) means the caller falls back to initials, same
 * as the single-photo hook. The query key is the sorted, deduped path list
 * joined into one string so passing a new array with the same paths each
 * render doesn't trigger a refetch.
 */
export function useMhdPersonPhotoUrls(photoPaths: Array<string | null | undefined>) {
  const uniquePaths = useMemo(
    () => Array.from(new Set(photoPaths.filter((path): path is string => Boolean(path)))).sort(),
    [photoPaths],
  );
  const cacheKey = uniquePaths.join(',');

  return useQuery({
    queryKey: mhdPeopleQueryKeys.photoUrls(cacheKey),
    queryFn: () => mhdPersonService.getPersonPhotoSignedUrls(uniquePaths),
    enabled: uniquePaths.length > 0,
    staleTime: 45 * 60_000,
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
