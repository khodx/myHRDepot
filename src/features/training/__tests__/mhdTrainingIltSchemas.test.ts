import { describe, expect, it } from 'vitest';
import {
  mhdCreateTrainingIltSessionSchema,
  mhdTrainingIltAttendanceOverrideSchema,
} from '../Schemas';

describe('ILT session schemas', () => {
  it('defaults a session with no virtual component and permits an external instructor', () => {
    expect(
      mhdCreateTrainingIltSessionSchema.parse({
        companyId: 'company-1',
        courseId: 'course-1',
        sessionDate: '2026-10-15',
        startTime: '09:00',
        endTime: '12:00',
        instructorName: 'Vendor instructor',
        instructorPersonId: null,
      }),
    ).toMatchObject({ meetingProvider: 'NONE', instructorPersonId: null });
  });

  it('requires a non-empty reason for an audited attendance override', () => {
    expect(() =>
      mhdTrainingIltAttendanceOverrideSchema.parse({
        sessionId: 'session-1',
        personId: 'person-1',
        checkInAt: '2026-10-15T09:00:00Z',
        checkOutAt: '2026-10-15T12:00:00Z',
        reason: '  ',
      }),
    ).toThrow('A reason is required for an attendance override.');
  });
});
