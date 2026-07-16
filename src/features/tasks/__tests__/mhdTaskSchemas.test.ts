import { describe, expect, it } from 'vitest';
import { mhdTaskFormSchema } from '../Schemas';

describe('mhdTaskFormSchema', () => {
  it('accepts a valid task form payload', () => {
    const result = mhdTaskFormSchema.safeParse({
      companyId: 'COMPANY1',
      title: 'Prepare onboarding task list',
      descriptionPlainText: 'Build task list for the client.',
      statusId: 'STATUS1',
      priorityId: 'PRIORITY1',
      startDate: '2026-07-05',
      dueDate: '2026-07-10',
      completedDate: '',
      manualProgressPercent: 25,
      assignedUserIds: ['USER1'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects a due date before the start date', () => {
    const result = mhdTaskFormSchema.safeParse({
      companyId: 'COMPANY1',
      title: 'Invalid schedule',
      descriptionPlainText: '',
      statusId: 'STATUS1',
      priorityId: '',
      startDate: '2026-07-10',
      dueDate: '2026-07-05',
      completedDate: '',
      manualProgressPercent: 0,
      assignedUserIds: [],
    });
    expect(result.success).toBe(false);
  });
});
