export type MhdLegalSourceLane = 'CURATED' | 'FEDERAL_TEXT' | 'PENDING_LEGISLATION';

export interface MhdLegalJurisdiction {
  id: string;
  code: string;
  name: string;
  level: 'FEDERAL' | 'STATE';
}

export interface MhdLegalTopic {
  id: string;
  topicKey: string;
  displayName: string;
  description: string | null;
}

export interface MhdLegalSearchResult {
  id: string;
  sourceLane: MhdLegalSourceLane;
  jurisdictionId: string;
  title: string;
  summary: string | null;
  sourceUrl: string | null;
  externalProvider: string;
  externalRef: string;
  fetchedAt: string | null;
}

export interface MhdLegalSearchResponse {
  curated: MhdLegalSearchResult[];
  federalText: MhdLegalSearchResult[];
  pendingLegislation: MhdLegalSearchResult[];
}

export interface MhdLegalSearchFilters {
  query: string;
  jurisdictionIds: string[];
  topicIds: string[];
}
