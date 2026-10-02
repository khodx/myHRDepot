import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

const { mhdPerformanceCycleService } = await import('../Service-cycles');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('mhdPerformanceCycleService', () => {
  it('lists the candidates for a manager subtree with the dates used for the duplicate check', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          person_id: 'person-priya',
          display_name: 'Priya Raman',
          job_title: 'Payroll Specialist',
          manager_person_id: 'person-callum',
          manager_name: 'Callum Reyes',
          depth: 1,
          reviewer_user_id: 'user-callum',
          reviewer_name: 'Callum Reyes',
          has_published_job: true,
          competency_count: 3,
          conflicting_review_reference: null,
        },
      ],
      error: null,
    });

    const result = await mhdPerformanceCycleService.listCandidates({
      companyId: 'company-northstar',
      rootPersonId: 'person-callum',
      includeIndirect: false,
      reviewType: 'ANNUAL',
      periodStart: '2027-01-01',
      periodEnd: '2027-12-31',
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_performance_cycle_candidates', {
      p_company_id: 'company-northstar',
      p_root_person_id: 'person-callum',
      p_include_indirect: false,
      p_review_type: 'ANNUAL',
      p_period_start: '2027-01-01',
      p_period_end: '2027-12-31',
    });
    expect(result).toEqual([
      {
        personId: 'person-priya',
        displayName: 'Priya Raman',
        jobTitle: 'Payroll Specialist',
        managerPersonId: 'person-callum',
        managerName: 'Callum Reyes',
        depth: 1,
        reviewerUserId: 'user-callum',
        reviewerName: 'Callum Reyes',
        hasPublishedJob: true,
        competencyCount: 3,
        conflictingReviewReference: null,
      },
    ]);
  });

  it('asks for the whole company, including indirect reports, when no root is given', async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });

    await mhdPerformanceCycleService.listCandidates({ companyId: 'company-northstar' });

    expect(rpcMock).toHaveBeenCalledWith('mhd_performance_cycle_candidates', {
      p_company_id: 'company-northstar',
      p_include_indirect: true,
    });
  });

  it('surfaces a refused candidate list', async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not authorized to manage performance review cycles for this company' },
    });

    await expect(
      mhdPerformanceCycleService.listCandidates({ companyId: 'company-northstar' }),
    ).rejects.toThrow('Not authorized to manage performance review cycles');
  });

  it('maps the suggested raters', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          subject_person_id: 'person-priya',
          rater_person_id: 'person-dario',
          rater_name: 'Dario Fontaine',
          participant_type: 'PEER',
        },
      ],
      error: null,
    });

    const result = await mhdPerformanceCycleService.planRaters({
      companyId: 'company-northstar',
      personIds: ['person-priya'],
      includePeers: true,
      maxPeers: 4,
      includeUpward: false,
      maxUpward: 3,
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_performance_cycle_rater_plan', {
      p_company_id: 'company-northstar',
      p_person_ids: ['person-priya'],
      p_include_peers: true,
      p_max_peers: 4,
      p_include_upward: false,
      p_max_upward: 3,
    });
    expect(result).toEqual([
      {
        subjectPersonId: 'person-priya',
        raterPersonId: 'person-dario',
        raterName: 'Dario Fontaine',
        participantType: 'PEER',
      },
    ]);
  });

  it('launches the whole cycle in one call with the exact payload', async () => {
    rpcMock.mockResolvedValueOnce({
      data: {
        id: 'cycle-1',
        reference_id: '4D8-6-2D8C-F-B7',
        review_count: 2,
        participant_count: 6,
      },
      error: null,
    });

    const result = await mhdPerformanceCycleService.launch({
      companyId: 'company-northstar',
      cycleName: '2027 Annual Reviews',
      reviewType: 'ANNUAL',
      reviewPeriodStart: '2027-01-01',
      reviewPeriodEnd: '2027-12-31',
      selfAssessmentDue: '2028-01-15',
      feedbackDue: '',
      reviewDue: '2028-02-05',
      templateId: null,
      includesSelfAssessment: true,
      isMultiRater: true,
      announcementNote: '',
      participants: [
        {
          personId: 'person-priya',
          reviewerUserId: 'user-callum',
          raters: [{ personId: 'person-dario', participantType: 'PEER' }],
        },
      ],
      competencyIds: ['competency-adaptability'],
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_performance_cycle_launch', {
      p_company_id: 'company-northstar',
      p_cycle: {
        cycle_name: '2027 Annual Reviews',
        review_type: 'ANNUAL',
        review_period_start: '2027-01-01',
        review_period_end: '2027-12-31',
        self_assessment_due: '2028-01-15',
        feedback_due: null,
        review_due: '2028-02-05',
        template_id: null,
        includes_self_assessment: true,
        is_multi_rater: true,
        announcement_note: null,
      },
      p_participants: [
        {
          person_id: 'person-priya',
          reviewer_user_id: 'user-callum',
          raters: [{ person_id: 'person-dario', participant_type: 'PEER' }],
        },
      ],
      p_competency_ids: ['competency-adaptability'],
    });
    expect(result).toEqual({
      id: 'cycle-1',
      referenceId: '4D8-6-2D8C-F-B7',
      reviewCount: 2,
      participantCount: 6,
    });
  });

  it('shows the server message when a launch is refused', async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'Review 589-9-88E1-3-46 already covers this person and period' },
    });

    await expect(
      mhdPerformanceCycleService.launch({
        companyId: 'company-northstar',
        cycleName: 'Duplicate',
        reviewType: 'ANNUAL',
        reviewPeriodStart: '2027-01-01',
        reviewPeriodEnd: '2027-12-31',
        reviewDue: '2028-02-05',
        includesSelfAssessment: true,
        isMultiRater: false,
        participants: [],
        competencyIds: [],
      }),
    ).rejects.toThrow('already covers this person and period');
  });

  it('maps the cycle list with its counts', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'cycle-1',
          reference_id: '4D8-6-2D8C-F-B7',
          cycle_name: '2027 Annual Reviews',
          review_type: 'ANNUAL',
          review_period_start: '2027-01-01',
          review_period_end: '2027-12-31',
          self_assessment_due: null,
          feedback_due: null,
          review_due: '2028-02-05',
          status: 'ACTIVE',
          template_name: 'Default Review',
          is_multi_rater: true,
          launched_at: '2027-12-20T17:00:00Z',
          review_count: 12,
          completed_count: 3,
          overdue_count: 0,
        },
      ],
      error: null,
    });

    const [cycle] = await mhdPerformanceCycleService.listCycles('company-northstar');

    expect(cycle).toMatchObject({
      cycleName: '2027 Annual Reviews',
      templateName: 'Default Review',
      reviewCount: 12,
      completedCount: 3,
      status: 'ACTIVE',
    });
  });

  it('maps cycle progress and treats missing counts as zero', async () => {
    rpcMock.mockResolvedValueOnce({
      data: {
        reviews_by_status: { DRAFT: 1, PENDING_SIGNATURE: 1 },
        participants: [{ participant_type: 'PEER', status: 'INVITED', count: 3 }],
      },
      error: null,
    });

    const progress = await mhdPerformanceCycleService.getProgress('cycle-1');

    expect(progress).toEqual({
      reviewsByStatus: { DRAFT: 1, PENDING_SIGNATURE: 1 },
      participants: [{ participantType: 'PEER', status: 'INVITED', count: 3 }],
      selfAssessmentsOverdue: 0,
      feedbackOverdue: 0,
      reviewsOverdue: 0,
    });
  });

  it('closes a cycle and shows why it could not be closed', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdPerformanceCycleService.closeCycle('cycle-1');
    expect(rpcMock).toHaveBeenCalledWith('mhd_performance_cycle_close', { p_cycle_id: 'cycle-1' });

    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'Complete or cancel every review in the cycle before closing it' },
    });
    await expect(mhdPerformanceCycleService.closeCycle('cycle-1')).rejects.toThrow(
      'Complete or cancel every review in the cycle before closing it',
    );
  });
});
