import { describe, expect, it } from 'vitest';
import { mhdLegalSearchResponseSchema, parseMhdLegalSearchResponse } from '../Schemas';

const row = {
  id: 'result-1',
  source_lane: 'PENDING_LEGISLATION',
  jurisdiction_id: 'jurisdiction-ca',
  title: 'Assembly Bill 123',
  summary: 'In committee; not yet law.',
  source_url: null,
  external_provider: 'OPEN_STATES',
  external_ref: 'bill-123',
  fetched_at: '2026-08-25T12:00:00.000Z',
};

describe('mhdLegalSearchResponseSchema', () => {
  it('requires all three distinct lane arrays', () => {
    expect(
      mhdLegalSearchResponseSchema.safeParse({
        curated: [],
        federal_text: [],
        pending_legislation: [row],
      }).success,
    ).toBe(true);
    expect(mhdLegalSearchResponseSchema.safeParse({ curated: [] }).success).toBe(false);
  });

  it('maps every lane and snake_case field to the TypeScript contract', () => {
    expect(
      parseMhdLegalSearchResponse({ curated: [], federal_text: [], pending_legislation: [row] }),
    ).toEqual({
      curated: [],
      federalText: [],
      pendingLegislation: [
        {
          id: 'result-1',
          sourceLane: 'PENDING_LEGISLATION',
          jurisdictionId: 'jurisdiction-ca',
          title: 'Assembly Bill 123',
          summary: 'In committee; not yet law.',
          sourceUrl: null,
          externalProvider: 'OPEN_STATES',
          externalRef: 'bill-123',
          fetchedAt: '2026-08-25T12:00:00.000Z',
        },
      ],
    });
  });

  it('rejects invalid lane values', () => {
    expect(
      mhdLegalSearchResponseSchema.safeParse({
        curated: [{ ...row, source_lane: 'MIXED' }],
        federal_text: [],
        pending_legislation: [],
      }).success,
    ).toBe(false);
  });
});
