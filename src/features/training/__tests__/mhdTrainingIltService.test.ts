import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

vi.mock('@/features/documents/Service', () => ({
  mhdRenderDocumentGeneration: vi.fn(),
  mhdPollDocumentGenerationUntilGenerated: vi.fn(),
}));

const { mhdTrainingService } = await import('../Service');

beforeEach(() => vi.clearAllMocks());

describe('mhdTrainingService — ILT sessions', () => {
  it('creates an external-instructor session without inventing a person fallback', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ id: 'session-1', reference_id: 'ILT-0001' }],
      error: null,
    });

    await expect(
      mhdTrainingService.createIltSession({
        companyId: 'company-1',
        courseId: 'course-1',
        sessionDate: '2026-10-15',
        startTime: '09:00:00',
        endTime: '12:00:00',
        instructorName: 'Vendor instructor',
        instructorPersonId: null,
        roomOrResourceLabel: 'Room A',
        capacity: 20,
        meetingProvider: 'NONE',
        meetingJoinUrl: null,
      }),
    ).resolves.toEqual({ id: 'session-1', referenceId: 'ILT-0001' });

    expect(rpcMock).toHaveBeenCalledWith('mhd_training_ilt_session_create', {
      p_company_id: 'company-1',
      p_course_id: 'course-1',
      p_session_date: '2026-10-15',
      p_start_time: '09:00:00',
      p_end_time: '12:00:00',
      p_instructor_name: 'Vendor instructor',
      p_instructor_person_id: undefined,
      p_room_or_resource_label: 'Room A',
      p_capacity: 20,
      p_meeting_provider: 'NONE',
      p_meeting_join_url: undefined,
    });
  });

  it('maps list counts and preserves the plain resource label', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'session-1',
          reference_id: 'ILT-0001',
          session_date: '2026-10-15',
          start_time: '09:00:00',
          end_time: '12:00:00',
          instructor_name: 'Dana Doe',
          room_or_resource_label: 'Room A',
          capacity: '20',
          meeting_provider: 'MEET',
          is_cancelled: false,
          enrolled_count: '19',
          waitlisted_count: 2,
        },
      ],
      error: null,
    });

    await expect(mhdTrainingService.listIltSessions('course-1')).resolves.toEqual([
      {
        id: 'session-1',
        referenceId: 'ILT-0001',
        sessionDate: '2026-10-15',
        startTime: '09:00:00',
        endTime: '12:00:00',
        instructorName: 'Dana Doe',
        roomOrResourceLabel: 'Room A',
        capacity: 20,
        meetingProvider: 'MEET',
        isCancelled: false,
        enrolledCount: 19,
        waitlistedCount: 2,
      },
    ]);
  });

  it('returns the server-decided enrollment status and never sends a desired status', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ id: 'enrollment-1', status: 'WAITLISTED' }],
      error: null,
    });

    await expect(
      mhdTrainingService.enrollIlt({ sessionId: 'session-1', personId: 'person-1' }),
    ).resolves.toEqual({ id: 'enrollment-1', status: 'WAITLISTED' });

    expect(rpcMock).toHaveBeenCalledWith('mhd_training_ilt_enroll', {
      p_session_id: 'session-1',
      p_person_id: 'person-1',
    });
  });

  it('keeps ordinary attendance separate from the audited override path', async () => {
    rpcMock
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    await mhdTrainingService.checkOutIlt({ sessionId: 'session-1', personId: 'person-1' });
    await mhdTrainingService.overrideIltAttendance({
      sessionId: 'session-1',
      personId: 'person-1',
      checkInAt: '2026-10-15T09:05:00Z',
      checkOutAt: '2026-10-15T12:00:00Z',
      reason: 'Corrected paper sign-in sheet',
    });

    expect(rpcMock).toHaveBeenNthCalledWith(1, 'mhd_training_ilt_check_out', {
      p_session_id: 'session-1',
      p_person_id: 'person-1',
    });
    expect(rpcMock).toHaveBeenNthCalledWith(2, 'mhd_training_ilt_attendance_override', {
      p_session_id: 'session-1',
      p_person_id: 'person-1',
      p_check_in_at: '2026-10-15T09:05:00Z',
      p_check_out_at: '2026-10-15T12:00:00Z',
      p_reason: 'Corrected paper sign-in sheet',
    });
  });
});
