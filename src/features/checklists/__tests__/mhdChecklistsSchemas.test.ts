import { describe, expect, it } from 'vitest';
import { mhdCompleteChecklistItemSchema, mhdCreateChecklistTemplateSchema } from '../Schemas';

describe('checklist schemas', () => {
  it('requires a template title and at least one item', () => {
    const parsed = mhdCreateChecklistTemplateSchema.safeParse({
      companyId: '4b0b7969-911f-4062-bf40-08ca1b6f31cd',
      title: 'Standard New Hire Checklist',
      category: 'ONBOARDING',
      items: [
        {
          title: 'Collect I-9 section 1',
          isRequired: true,
          requiresEvidence: true,
          sortOrder: 100,
        },
      ],
    });

    expect(parsed.success).toBe(true);
  });

  it('rejects completion input without an item id', () => {
    expect(
      mhdCompleteChecklistItemSchema.safeParse({
        isCompleted: true,
        evidenceNote: 'Manager confirmed completion.',
      }).success,
    ).toBe(false);
  });
});
