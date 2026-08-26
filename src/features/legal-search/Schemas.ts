import { z } from 'zod';
import type { MhdLegalSearchResponse } from './Types';

export const mhdLegalJurisdictionSchema = z.object({
  id: z.string(), code: z.string(), name: z.string(), level: z.enum(['FEDERAL', 'STATE']),
});

export const mhdLegalTopicSchema = z.object({
  id: z.string(), topic_key: z.string(), display_name: z.string(), description: z.string().nullable(),
});

const resultSchema = z.object({
  id: z.string(), source_lane: z.enum(['CURATED', 'FEDERAL_TEXT', 'PENDING_LEGISLATION']),
  jurisdiction_id: z.string(), title: z.string(), summary: z.string().nullable().optional(),
  source_url: z.string().nullable().optional(), external_provider: z.string(), external_ref: z.string(),
  fetched_at: z.string().nullable().optional(),
});

export const mhdLegalSearchResponseSchema = z.object({
  curated: z.array(resultSchema),
  federal_text: z.array(resultSchema),
  pending_legislation: z.array(resultSchema),
});

export function parseMhdLegalSearchResponse(value: unknown): MhdLegalSearchResponse {
  const parsed = mhdLegalSearchResponseSchema.parse(value);
  const map = (row: z.infer<typeof resultSchema>) => ({
    id: row.id, sourceLane: row.source_lane, jurisdictionId: row.jurisdiction_id,
    title: row.title, summary: row.summary ?? null, sourceUrl: row.source_url ?? null,
    externalProvider: row.external_provider, externalRef: row.external_ref, fetchedAt: row.fetched_at ?? null,
  });
  return { curated: parsed.curated.map(map), federalText: parsed.federal_text.map(map), pendingLegislation: parsed.pending_legislation.map(map) };
}
