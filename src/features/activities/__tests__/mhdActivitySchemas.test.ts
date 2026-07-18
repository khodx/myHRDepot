import { describe, expect, it } from 'vitest';
import { mhdActivityBoardFilterSchema, mhdActivityFormSchema } from '../Schemas';

describe('mhdActivityFormSchema', () => {
  it('accepts a valid activity payload with a single participant target', () => {
    const parsed = mhdActivityFormSchema.parse({
      companyId: 'company-1',
      activityType: 'MEETING',
      title: 'Quarterly check-in',
      scheduledAt: '2026-07-18T15:00',
      isConfidential: true,
      participants: [{ userId: 'user-1', role: 'FACILITATOR' }],
    });

    expect(parsed.title).toBe('Quarterly check-in');
    expect(parsed.participants).toHaveLength(1);
  });

  it('rejects a participant row that targets both a user and a person', () => {
    expect(() =>
      mhdActivityFormSchema.parse({
        companyId: 'company-1',
        activityType: 'MEETING',
        title: 'Quarterly check-in',
        participants: [{ userId: 'user-1', personId: 'person-1', role: 'FACILITATOR' }],
      }),
    ).toThrow('Each participant must target exactly one internal user or person.');
  });

  it('requires occurredAt when a completed activity is submitted', () => {
    expect(() =>
      mhdActivityFormSchema.parse({
        companyId: 'company-1',
        activityType: 'PHONE_CALL',
        title: 'Follow-up call',
        status: 'COMPLETED',
      }),
    ).toThrow('Occurred date/time is required when the activity is completed.');
  });
});

describe('mhdActivityBoardFilterSchema', () => {
  it('defaults blank filters to the ALL sentinel values used by the board', () => {
    const parsed = mhdActivityBoardFilterSchema.parse({});

    expect(parsed).toEqual({
      companyId: 'ALL',
      personId: 'ALL',
      taskId: 'ALL',
      activityType: 'ALL',
      status: 'ALL',
      searchTerm: '',
      from: '',
      to: '',
    });
  });
});
