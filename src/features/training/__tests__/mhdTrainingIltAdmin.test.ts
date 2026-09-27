import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));
vi.mock('@/lib/supabase/supabaseClient', () => ({ supabaseClient: { rpc: rpcMock } }));
const { mhdTrainingService } = await import('../Service');

beforeEach(() => vi.clearAllMocks());

describe('LMS v2 ILT admin service (company-wide session list + roster)', () => {
  it('lists ILT sessions across every course for a company', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 's1', reference_id: 'ILT-0001', course_id: 'c1', course_title: 'Forklift Safety',
          session_date: '2026-10-05', start_time: '09:00', end_time: '11:00', instructor_name: 'Rowan Delgado',
          room_or_resource_label: 'Bay 3', capacity: 4, meeting_provider: 'NONE', is_cancelled: false,
          enrolled_count: 2, waitlisted_count: 0,
        },
      ],
      error: null,
    });
    const [session] = await mhdTrainingService.listIltSessionsByCompany('c');
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_ilt_session_list_by_company', {
      p_company_id: 'c', p_include_cancelled: false,
    });
    expect(session.courseTitle).toBe('Forklift Safety');
    expect(session.enrolledCount).toBe(2);
  });

  it('lists a session roster with real check-in/out and override state, not just aggregate counts', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          enrollment_id: 'e1', person_id: 'p1', person_display_name: 'Harper Garcia', status: 'ENROLLED',
          enrolled_at: 'now', check_in_at: 'now', check_out_at: 'now', attendance_source: 'MANUAL', override_reason: null,
        },
        {
          enrollment_id: 'e2', person_id: 'p2', person_display_name: 'Jordan Martinez', status: 'WAITLISTED',
          enrolled_at: 'now', check_in_at: null, check_out_at: null, attendance_source: null, override_reason: null,
        },
      ],
      error: null,
    });
    const roster = await mhdTrainingService.listIltRoster('s1');
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_ilt_roster_list', { p_session_id: 's1' });
    expect(roster).toHaveLength(2);
    expect(roster[0].personDisplayName).toBe('Harper Garcia');
    expect(roster[1].status).toBe('WAITLISTED');
  });

  it('lists peer review candidates (completed reflection/discussion responses awaiting review)', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          block_progress_id: 'bp1', person_id: 'p1', person_display_name: 'Jordan Martinez',
          course_title: 'De-escalation & Difficult Conversations', block_title: 'Reflect', block_type: 'REFLECTION_PROMPT',
          response: { text: 'I would listen first.' }, completed_at: 'now', existing_review_count: '5',
        },
      ],
      error: null,
    });
    const [candidate] = await mhdTrainingService.listPeerReviewCandidates('c');
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_peer_review_candidates_list', { p_company_id: 'c' });
    expect(candidate.personDisplayName).toBe('Jordan Martinez');
    expect(candidate.existingReviewCount).toBe(5);
  });
});
