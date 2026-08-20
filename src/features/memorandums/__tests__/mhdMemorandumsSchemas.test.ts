import { describe, expect, it } from 'vitest';
import { mhdMemorandumFormSchema, mhdPublishMemorandumSchema } from '../Schemas';

describe('memorandum form schema', () => {
  it('accepts a valid memorandum draft', () => {
    const parsed = mhdMemorandumFormSchema.safeParse({
      title: 'Updated Expense Reporting Deadline',
      body: 'Expense reports must be submitted within 15 days.',
      category: 'ORGANIZATIONAL',
      requiresAcknowledgment: false,
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects a blank title', () => {
    const parsed = mhdMemorandumFormSchema.safeParse({
      title: '   ',
      body: 'Body text.',
      category: 'GENERAL',
      requiresAcknowledgment: false,
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects a blank body', () => {
    const parsed = mhdMemorandumFormSchema.safeParse({
      title: 'Title',
      body: '   ',
      category: 'GENERAL',
      requiresAcknowledgment: false,
    });
    expect(parsed.success).toBe(false);
  });
});

describe('publish memorandum schema', () => {
  it('requires at least one recipient', () => {
    const parsed = mhdPublishMemorandumSchema.safeParse({
      recipientPersonIds: [],
      audienceLabel: 'All Company',
      sendEmail: false,
    });
    expect(parsed.success).toBe(false);
  });

  it('accepts a valid recipient list', () => {
    const parsed = mhdPublishMemorandumSchema.safeParse({
      recipientPersonIds: ['4b0b7969-911f-4062-bf40-08ca1b6f31cd'],
      audienceLabel: null,
      sendEmail: true,
    });
    expect(parsed.success).toBe(true);
  });
});
