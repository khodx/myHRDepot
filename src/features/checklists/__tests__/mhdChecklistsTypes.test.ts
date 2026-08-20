import { describe, expect, it } from 'vitest';
import { MHD_CHECKLIST_CATEGORIES, mhdFormatChecklistValue } from '../Types';

describe('checklist types', () => {
  it('pins the category values admitted by the database CHECK constraint', () => {
    expect(MHD_CHECKLIST_CATEGORIES).toEqual([
      'GENERAL',
      'ONBOARDING',
      'OFFBOARDING',
      'COMPLIANCE',
      'TRAINING',
      'SAFETY',
      'FACILITIES',
      'IT',
      'OTHER',
    ]);
  });

  it('formats enum values for display without changing the stored value', () => {
    expect(mhdFormatChecklistValue('REQUIRES_EVIDENCE')).toBe('Requires Evidence');
  });
});
