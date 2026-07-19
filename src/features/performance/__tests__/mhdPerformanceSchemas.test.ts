import { describe, expect, it } from 'vitest';
import {
  mhdCoachingPlanFormSchema,
  mhdPerformanceReviewFormSchema,
  mhdPerformanceReviewTransitionSchema,
} from '../Schemas';

const review = {
  companyId: 'company-1',
  personId: 'person-1',
  reviewerUserId: 'user-1',
  reviewType: 'ANNUAL',
  reviewPeriodStart: '2026-01-01',
  reviewPeriodEnd: '2026-12-31',
};

describe('performance schemas', () => {
  it('accepts a valid review and rejects an inverted review period', () => {
    expect(mhdPerformanceReviewFormSchema.parse(review).reviewType).toBe('ANNUAL');
    expect(() => mhdPerformanceReviewFormSchema.parse({
      ...review,
      reviewPeriodStart: '2026-12-31',
      reviewPeriodEnd: '2026-01-01',
    })).toThrow('Review period end must be on or after the period start.');
  });

  it('requires a waiver when a review is completed without a signed request', () => {
    expect(() => mhdPerformanceReviewTransitionSchema.parse({
      newStatus: 'COMPLETED',
      signatureRequestCompleted: false,
    })).toThrow('A waiver reason is required to complete a review without a signed acknowledgment.');
  });

  it('rejects a coaching target date before its start date', () => {
    expect(() => mhdCoachingPlanFormSchema.parse({
      companyId: 'company-1',
      personId: 'person-1',
      coachUserId: 'user-1',
      title: 'Leadership plan',
      startDate: '2026-08-01',
      targetDate: '2026-07-01',
    })).toThrow('Target date must be on or after the start date.');
  });
});
