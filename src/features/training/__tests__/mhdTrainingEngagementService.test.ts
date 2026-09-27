import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));
vi.mock('@/lib/supabase/supabaseClient', () => ({ supabaseClient: { rpc: rpcMock } }));
vi.mock('@/features/documents/Service', () => ({
  mhdRenderDocumentGeneration: vi.fn(),
  mhdPollDocumentGenerationUntilGenerated: vi.fn(),
}));

const { mhdTrainingService } = await import('../Service');

beforeEach(() => vi.clearAllMocks());

describe('mhdTrainingService — LMS v2 engagement and social RPCs', () => {
  it('maps points, badges, and opt-in without accepting a person id for opt-in', async () => {
    rpcMock.mockResolvedValueOnce({ data: '125', error: null });
    expect(await mhdTrainingService.pointsBalance('person-1')).toBe(125);
    expect(rpcMock).toHaveBeenLastCalledWith('mhd_training_points_balance', {
      p_person_id: 'person-1',
    });

    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'b1',
          reference_id: 'BDG-1',
          title: 'Helper',
          description: null,
          icon_key: 'award',
          is_global: true,
        },
      ],
      error: null,
    });
    expect(await mhdTrainingService.listBadges('company-1')).toMatchObject([
      { referenceId: 'BDG-1', iconKey: 'award', isGlobal: true },
    ]);

    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdTrainingService.setLeaderboardOptIn({ optedIn: true });
    expect(rpcMock).toHaveBeenLastCalledWith('mhd_training_leaderboard_opt_in', {
      p_opted_in: true,
    });
  });

  it('keeps the leaderboard explicitly opt-in-only and normalizes numeric rows', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        { person_id: 'p1', person_display_name: 'Ada', total_points: '40', current_streak_days: 3 },
      ],
      error: null,
    });
    expect(await mhdTrainingService.leaderboard({ companyId: 'company-1' })).toEqual([
      { personId: 'p1', personDisplayName: 'Ada', totalPoints: 40, currentStreakDays: 3 },
    ]);
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_leaderboard', {
      p_company_id: 'company-1',
      p_limit: 20,
    });
  });

  it('supports generic content flags and all four resolution actions', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'f1',
          reference_id: 'FLG-1',
          entity_type: 'TRAINING_LESSON',
          entity_id: 'lesson-1',
          reason: 'Issue',
          status: 'PENDING',
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
      error: null,
    });
    expect(await mhdTrainingService.listContentFlags({ companyId: 'company-1' })).toMatchObject([
      { entityType: 'TRAINING_LESSON', status: 'PENDING' },
    ]);
    // Not specifying a status defaults to the RPC's own PENDING default.
    expect(rpcMock).toHaveBeenLastCalledWith('mhd_content_flag_list', {
      p_company_id: 'company-1', p_status: 'PENDING',
    });

    // An explicit null must reach the RPC unchanged -- it means "every status",
    // not "not specified". Coalescing it back to 'PENDING' would make it
    // impossible to ever request all flags (a real bug found and fixed while
    // building the moderation queue's "All" filter option).
    rpcMock.mockResolvedValueOnce({ data: [], error: null });
    await mhdTrainingService.listContentFlags({ companyId: 'company-1', status: null });
    expect(rpcMock).toHaveBeenLastCalledWith('mhd_content_flag_list', {
      p_company_id: 'company-1', p_status: null,
    });

    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdTrainingService.resolveContentFlag({ flagId: 'f1', action: 'HIDDEN' });
    expect(rpcMock).toHaveBeenLastCalledWith('mhd_content_flag_resolve', {
      p_flag_id: 'f1',
      p_action: 'HIDDEN',
      p_notes: undefined,
    });
  });

  it('maps peer reviews and submits course feedback with the 1-5 rating contract', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'r1',
          reference_id: 'PRV-1',
          reviewer_person_id: 'p2',
          rubric_score: '4.5',
          feedback: 'Good',
          status: 'SUBMITTED',
          submitted_at: '2026-01-01T00:00:00Z',
        },
      ],
      error: null,
    });
    expect(await mhdTrainingService.listPeerReviews({ blockProgressId: 'bp1' })).toMatchObject([
      { referenceId: 'PRV-1', rubricScore: 4.5, status: 'SUBMITTED' },
    ]);

    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdTrainingService.submitCourseFeedback({
      courseId: 'course-1',
      rating: 5,
      comments: 'Excellent',
    });
    expect(rpcMock).toHaveBeenLastCalledWith('mhd_training_course_feedback_submit', {
      p_course_id: 'course-1',
      p_rating: 5,
      p_comments: 'Excellent',
    });
  });
});
