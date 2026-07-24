import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  createActivityMock,
  createRequestFromGeneratedDocumentMock,
  fromMock,
  invokeMock,
  listActivitiesMock,
  maybeSingleMock,
  returnsMock,
  rpcMock,
} = vi.hoisted(() => ({
  createActivityMock: vi.fn(),
  createRequestFromGeneratedDocumentMock: vi.fn(),
  fromMock: vi.fn(),
  invokeMock: vi.fn(),
  listActivitiesMock: vi.fn(),
  maybeSingleMock: vi.fn(),
  returnsMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: {
    rpc: rpcMock,
    from: fromMock,
    functions: { invoke: invokeMock },
  },
}));
vi.mock('@/features/activities/Service', () => ({
  mhdActivityService: { createActivity: createActivityMock, listActivities: listActivitiesMock },
}));
vi.mock('@/features/esignature/Service', () => ({
  mhdEsignatureService: {
    createRequestFromGeneratedDocument: createRequestFromGeneratedDocumentMock,
  },
}));

const { mhdPerformanceService } = await import('../Service');

beforeEach(() => {
  vi.clearAllMocks();
  rpcMock.mockImplementation(() => ({ returns: returnsMock }));
  fromMock.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: maybeSingleMock }) }) });
});

describe('mhdPerformanceService', () => {
  it('passes only the required list filter when optional filters are unset', async () => {
    returnsMock.mockResolvedValueOnce({ data: [], error: null });

    await mhdPerformanceService.listReviews({
      companyId: 'company-1',
      personId: 'ALL',
      reviewerUserId: 'ALL',
      reviewType: 'ALL',
      status: 'ALL',
      searchTerm: '',
      dueFrom: '',
      dueTo: '',
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_list_performance_reviews', {
      p_company_id: 'company-1',
    });
  });

  it('uses the Activities contract and rejects unrelated activity types', async () => {
    listActivitiesMock.mockResolvedValueOnce([]);
    await mhdPerformanceService.listPersonActivities('company-1', 'person-1', 'ONE_ON_ONE');
    expect(listActivitiesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'company-1',
        personId: 'person-1',
        activityType: 'ONE_ON_ONE',
      }),
    );

    await expect(
      mhdPerformanceService.createPersonActivity({
        companyId: 'company-1',
        activityType: 'MEETING',
        title: 'Not permitted',
      }),
    ).rejects.toThrow(
      'The Performance module only creates ONE_ON_ONE or COACHING_SESSION activities.',
    );
    expect(createActivityMock).not.toHaveBeenCalled();
  });

  it('reports each finalize ceremony step while using the subject as the only signer', async () => {
    const review = {
      id: 'review-1',
      reference_id: 'PRFR-000001',
      company_id: 'company-1',
      company_name: 'Acme',
      person_id: 'person-1',
      person_display_name: 'Pat Person',
      reviewer_user_id: 'reviewer-1',
      reviewer_display_name: 'Riley Reviewer',
      review_type: 'ANNUAL',
      status: 'IN_REVIEW',
      review_period_start: '2026-01-01',
      review_period_end: '2026-12-31',
      due_date: null,
      overall_rating: 4,
      strengths_summary: null,
      improvement_summary: null,
      goals_summary: null,
      reviewer_comments: null,
      employee_comments: null,
      review_activity_id: null,
      document_generation_id: null,
      document_generation_reference_id: null,
      document_generation_status: null,
      esignature_request_id: null,
      esignature_request_reference_id: null,
      esignature_request_status: null,
      acknowledged_at: null,
      waiver_reason: null,
      created_at: '2026-01-01T00:00:00Z',
      created_by: 'reviewer-1',
      updated_at: '2026-01-01T00:00:00Z',
      updated_by: 'reviewer-1',
    };
    rpcMock.mockImplementation((name: string) => {
      if (name === 'mhd_get_performance_review' || name === 'mhd_request_document_generation') {
        return { returns: returnsMock };
      }
      return Promise.resolve({ error: null });
    });
    returnsMock
      .mockResolvedValueOnce({ data: [review], error: null })
      .mockResolvedValueOnce({
        data: [{ id: 'gen-1', reference_id: 'DGEN-1', status: 'PENDING' }],
        error: null,
      })
      .mockResolvedValueOnce({ data: [{ ...review, status: 'PENDING_SIGNATURE' }], error: null });
    invokeMock.mockResolvedValueOnce({ data: { success: true }, error: null });
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        id: 'gen-1',
        status: 'GENERATED',
        output_drive_file_id: 'drive-1',
        output_document_hash: 'hash-1',
      },
      error: null,
    });
    createRequestFromGeneratedDocumentMock.mockResolvedValueOnce({
      request: { id: 'signature-1' },
      invitationErrors: [],
    });
    const steps: number[] = [];

    await mhdPerformanceService.finalizeReviewForSignature({
      reviewId: 'review-1',
      templateId: 'template-1',
      signer: { kind: 'internal', userId: 'subject-user-1' },
      pollIntervalMs: 0,
      onStep: (step) => steps.push(step),
    });

    expect(steps).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(createRequestFromGeneratedDocumentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        signers: [{ kind: 'internal', userId: 'subject-user-1' }],
      }),
    );
  });
});
