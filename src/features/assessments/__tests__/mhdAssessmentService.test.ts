import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));
vi.mock('@/lib/supabase/supabaseClient', () => ({ supabaseClient: { rpc: rpcMock } }));
const { mhdAssessmentService } = await import('../Service');

describe('mhdAssessmentService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reassembles flattened assessment rows into nested items', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'a',
          reference_id: 'ASM-a',
          company_id: 'c',
          course_id: null,
          title: 'Quiz',
          assembly_mode: 'FIXED',
          integrity_profile: 'LIGHT',
          time_limit_minutes: 10,
          item_id: 'i1',
          question_type: 'MCQ_SINGLE',
          prompt: 'One?',
          options: ['A'],
          sort_order: 0,
        },
        {
          id: 'a',
          reference_id: 'ASM-a',
          company_id: 'c',
          course_id: null,
          title: 'Quiz',
          assembly_mode: 'FIXED',
          integrity_profile: 'LIGHT',
          time_limit_minutes: 10,
          item_id: 'i2',
          question_type: 'TRUE_FALSE',
          prompt: 'Two?',
          options: [],
          sort_order: 1,
        },
      ],
      error: null,
    });
    const result = await mhdAssessmentService.get('a');
    expect(result?.items).toHaveLength(2);
    expect(result?.items[1].itemId).toBe('i2');
  });

  it('surfaces RPC errors unchanged', async () => {
    const error = new Error('attempt limit');
    rpcMock.mockResolvedValueOnce({ data: null, error });
    await expect(mhdAssessmentService.startAttempt('a')).rejects.toBe(error);
  });

  it('flags LONG_TEXT_RUBRIC items as requiring manual grading via the server-returned flag', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'i1',
          reference_id: 'AIT-0001',
          question_type: 'LONG_TEXT_RUBRIC',
          prompt: 'Explain',
          options: [],
          requires_manual_grading: true,
          tags: [],
          difficulty: null,
          competency_id: null,
          is_active: true,
        },
      ],
      error: null,
    });
    const [item] = await mhdAssessmentService.listItems('c');
    expect(item.requiresManualGrading).toBe(true);
  });

  it('lists assessments for a company with real item counts, not just detail-only lookups', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'a1', reference_id: 'ASM-0001', course_id: 'course-1', course_title: 'Ethics', title: 'Ethics Check',
          assembly_mode: 'FIXED', integrity_profile: 'LIGHT', time_limit_minutes: 20, item_count: '4', is_active: true,
          created_at: 'now',
        },
      ],
      error: null,
    });
    const [assessment] = await mhdAssessmentService.listAssessments('c');
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_assessment_list', { p_company_id: 'c', p_include_inactive: false });
    expect(assessment.itemCount).toBe(4);
    expect(assessment.courseTitle).toBe('Ethics');
  });

  it('lists accommodation requests with resolved person and assessment names', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'r1', reference_id: 'TAR-0001', assessment_id: 'a1', assessment_title: 'Ethics Check',
          person_id: 'p1', person_display_name: 'Jordan Martinez', extended_time_percent: 50,
          attempt_count_override: null, integrity_profile_override: null, status: 'PENDING',
          decided_by_name: null, decided_at: null, decision_notes: null, created_at: 'now',
        },
      ],
      error: null,
    });
    const [request] = await mhdAssessmentService.listAccommodationRequests('c', 'PENDING');
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_accommodation_request_list', { p_company_id: 'c', p_status: 'PENDING' });
    expect(request.personDisplayName).toBe('Jordan Martinez');
  });

  it('lists attempts pending review across every assessment for the company', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'att1', reference_id: 'ATT-0001', assessment_id: 'a1', assessment_title: 'Ethics Check',
          person_id: 'p1', person_display_name: 'Jordan Martinez', attempt_number: 1, submitted_at: 'now',
        },
      ],
      error: null,
    });
    const [pending] = await mhdAssessmentService.listPendingReview('c');
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_assessment_pending_review_list', { p_company_id: 'c' });
    expect(pending.assessmentTitle).toBe('Ethics Check');
  });
});
