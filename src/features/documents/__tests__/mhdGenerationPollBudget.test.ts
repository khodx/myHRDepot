import { describe, expect, it } from 'vitest';
import {
  MHD_DEFAULT_GENERATION_POLL_ATTEMPTS,
  MHD_DEFAULT_GENERATION_POLL_INTERVAL_MS,
  MHD_LONG_DOCUMENT_POLL_ATTEMPTS,
  MHD_LONG_DOCUMENT_POLL_INTERVAL_MS,
  mhdGenerationPollOptionsFor,
} from '../generationEngine';

describe('mhdGenerationPollOptionsFor', () => {
  it('gives a full handbook version the long budget', () => {
    expect(mhdGenerationPollOptionsFor('HANDBOOK_VERSION')).toEqual({
      pollAttempts: MHD_LONG_DOCUMENT_POLL_ATTEMPTS,
      pollIntervalMs: MHD_LONG_DOCUMENT_POLL_INTERVAL_MS,
    });
  });

  it('keeps every other document on the default fail-fast budget', () => {
    for (const entityType of ['TASK', 'LEAVE_CASE', 'CONDUCT_ACTION', 'PERSON']) {
      expect(mhdGenerationPollOptionsFor(entityType)).toEqual({
        pollAttempts: MHD_DEFAULT_GENERATION_POLL_ATTEMPTS,
        pollIntervalMs: MHD_DEFAULT_GENERATION_POLL_INTERVAL_MS,
      });
    }
  });

  it('the long budget is genuinely longer than the default', () => {
    expect(MHD_LONG_DOCUMENT_POLL_ATTEMPTS * MHD_LONG_DOCUMENT_POLL_INTERVAL_MS).toBeGreaterThan(
      MHD_DEFAULT_GENERATION_POLL_ATTEMPTS * MHD_DEFAULT_GENERATION_POLL_INTERVAL_MS,
    );
  });
});
