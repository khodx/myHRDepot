import { useQuery } from '@tanstack/react-query';
import { mhdLegalSearchService } from './Service';
import type { MhdLegalSearchFilters } from './Types';

export const mhdLegalSearchQueryKeys = {
  jurisdictions: () => ['mhd-legal-search', 'jurisdictions'] as const,
  topics: () => ['mhd-legal-search', 'topics'] as const,
  search: (filters: MhdLegalSearchFilters) => ['mhd-legal-search', 'search', filters.query, filters.jurisdictionIds, filters.topicIds] as const,
};

export function useMhdLegalJurisdictions() {
  return useQuery({ queryKey: mhdLegalSearchQueryKeys.jurisdictions(), queryFn: mhdLegalSearchService.listJurisdictions });
}

export function useMhdLegalTopics() {
  return useQuery({ queryKey: mhdLegalSearchQueryKeys.topics(), queryFn: mhdLegalSearchService.listTopics });
}

export function useMhdLegalSearch(filters: MhdLegalSearchFilters) {
  return useQuery({
    queryKey: mhdLegalSearchQueryKeys.search(filters),
    queryFn: () => mhdLegalSearchService.search(filters),
    // The RPC treats an empty query as "match nothing" (every lane's WHERE
    // clause requires a non-null tsquery), so without this guard the page
    // would always show three "No results in this section" sections instead
    // of the intended empty-state prompt on first load.
    enabled: filters.query.trim().length > 0,
  });
}
