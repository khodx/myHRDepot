import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

const { mhdAccommodationsService } = await import('../Service');
const { MHD_ACCOMMODATION_REVIEW_EFFECTIVENESS } = await import('../Types');

const CASE = 'case-1';

beforeEach(() => {
  vi.clearAllMocks();
});

/* ------------------------------------------------------------------ */
/* Self-service intake                                                 */
/* ------------------------------------------------------------------ */

describe('mhdAccommodationsService — verbal, self-service intake', () => {
  it('opens a case from a VERBAL request with no form and no attachment', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ id: 'case-9', reference_id: 'RA-0009' }],
      error: null,
    });

    const created = await mhdAccommodationsService.create({
      companyId: 'company-1',
      personId: 'person-1',
      requestSource: 'SELF',
      requestChannel: 'VERBAL',
      requestedAt: '2026-07-25T17:00:00.000Z',
      requestSummary: 'Asked in the hallway for a seated workstation.',
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_accommodation_case_create', {
      p_company_id: 'company-1',
      p_person_id: 'person-1',
      p_request_source: 'SELF',
      p_request_channel: 'VERBAL',
      p_requested_at: '2026-07-25T17:00:00.000Z',
      p_request_summary: 'Asked in the hallway for a seated workstation.',
      p_leave_case_id: undefined,
    });
    expect(created).toEqual({ id: 'case-9', referenceId: 'RA-0009' });
  });

  it('surfaces the 42501 a Client User hits when opening a case for someone else', async () => {
    // mhd_accommodation_case_create: "Employees may open only their own
    // accommodation request". The client never gets to decide this.
    rpcMock.mockResolvedValueOnce({
      error: { code: '42501', message: 'Employees may open only their own accommodation request' },
    });

    await expect(
      mhdAccommodationsService.create({
        companyId: 'company-1',
        personId: 'someone-else',
        requestSource: 'SELF',
        requestChannel: 'VERBAL',
        requestedAt: '2026-07-25T17:00:00.000Z',
        requestSummary: 'A seated workstation.',
      }),
    ).rejects.toMatchObject({ code: '42501' });
  });

  it('lists a Client User own-case view by passing their own person id as the filter', async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });
    await mhdAccommodationsService.list('company-1', 'ALL', 'person-1');
    // 'ALL' is a UI sentinel and must never reach the RPC as a status value.
    expect(rpcMock).toHaveBeenCalledWith('mhd_accommodation_case_list', {
      p_company_id: 'company-1',
      p_status: undefined,
      p_person_id: 'person-1',
    });
  });
});

/* ------------------------------------------------------------------ */
/* The medical partition                                               */
/* ------------------------------------------------------------------ */

describe('mhdAccommodationsService — the medical partition', () => {
  it('records ONLY functional limitation and accommodation need — no diagnosis field exists', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'doc-1', error: null });

    await mhdAccommodationsService.recordMedical({
      caseId: CASE,
      documentationType: 'PROVIDER_NOTE',
      status: 'SUFFICIENT',
      needIsObvious: false,
      documentationRequested: true,
      requestedAt: '2026-07-20',
      dueDate: '2026-08-04',
      functionalLimitation: 'Cannot stand longer than 20 minutes.',
      accommodationNeed: 'Seated workstation.',
    });

    const [, args] = rpcMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(rpcMock.mock.calls[0][0]).toBe('mhd_accommodation_medical_record');
    expect(args.p_functional_limitation).toBe('Cannot stand longer than 20 minutes.');
    expect(args.p_accommodation_need).toBe('Seated workstation.');
    // The contract carries no diagnosis, causation, medical-history, or genetic
    // key of any kind. A regression that added one would fail here.
    for (const forbidden of [
      'p_diagnosis',
      'p_condition',
      'p_cause',
      'p_medical_history',
      'p_genetic_information',
      'p_medical_records',
    ]) {
      expect(Object.keys(args)).not.toContain(forbidden);
    }
  });

  it('surfaces the 23514 raised when documentation is requested for an obvious need', async () => {
    rpcMock.mockResolvedValueOnce({
      error: {
        code: '23514',
        message: 'Documentation may not be requested when disability and need are obvious',
      },
    });

    await expect(
      mhdAccommodationsService.recordMedical({
        caseId: CASE,
        documentationType: 'SIMPLE_CERTIFICATION',
        status: 'REQUESTED',
        needIsObvious: true,
        documentationRequested: true,
        requestedAt: '2026-07-25',
      }),
    ).rejects.toMatchObject({ code: '23514' });
  });

  it('reveals the two encrypted fields through the audited RPC', async () => {
    rpcMock.mockResolvedValueOnce({
      data: {
        functional_limitation: 'Cannot stand longer than 20 minutes.',
        accommodation_need: 'Seated workstation.',
      },
      error: null,
    });

    const revealed = await mhdAccommodationsService.revealMedical('doc-1');

    expect(rpcMock).toHaveBeenCalledWith('mhd_accommodation_medical_reveal', {
      p_documentation_id: 'doc-1',
    });
    expect(revealed.functional_limitation).toBe('Cannot stand longer than 20 minutes.');
    expect(revealed.accommodation_need).toBe('Seated workstation.');
  });

  it('surfaces the 42501 a Client Admin hits on reveal — it can never see medical content', async () => {
    // mhd_accommodation_medical_reveal gates on
    // mhd_accommodation_can_see_medical (Platform Admin / HR Partner). A Client
    // Admin is otherwise privileged and still cannot decrypt these two fields.
    rpcMock.mockResolvedValueOnce({
      error: { code: '42501', message: 'Accommodation medical record not found or access denied' },
    });

    await expect(mhdAccommodationsService.revealMedical('doc-1')).rejects.toMatchObject({
      code: '42501',
    });
  });

  it('never returns medical content from the ordinary case read', async () => {
    // mhd_accommodation_case_get projects medical_status as STATUS METADATA
    // only — no ciphertext and no plaintext. This is the read every role with
    // case visibility performs, including Client Admin and the employee.
    rpcMock.mockResolvedValueOnce({
      data: {
        case: { id: CASE },
        interactions: [],
        options: [],
        decisions: [],
        implementations: [],
        reviews: [],
        medical_status: [
          {
            id: 'doc-1',
            documentation_type: 'PROVIDER_NOTE',
            status: 'SUFFICIENT',
            need_is_obvious: false,
            documentation_requested: true,
            requested_at: '2026-07-20',
            due_date: '2026-08-04',
            received_at: '2026-07-28',
            has_attachment: true,
          },
        ],
      },
      error: null,
    });

    const detail = await mhdAccommodationsService.get(CASE);
    const [row] = detail.medical_status;
    expect(row.status).toBe('SUFFICIENT');
    expect(Object.keys(row)).not.toContain('functional_limitation');
    expect(Object.keys(row)).not.toContain('accommodation_need');
    expect(Object.keys(row)).not.toContain('functional_limitation_ciphertext');
  });
});

/* ------------------------------------------------------------------ */
/* Manager-safe projection                                             */
/* ------------------------------------------------------------------ */

describe('mhdAccommodationsService — the manager projection', () => {
  it('maps instructions and dates only, with no field a manager must not see', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          implementation_id: 'impl-1',
          option_type: 'MODIFIED_SCHEDULE',
          manager_instruction: 'Schedule a five-minute break each hour; start at 10:00.',
          start_date: '2026-08-01',
          end_date: null,
          review_due_date: '2026-11-01',
        },
      ],
      error: null,
    });

    const [instruction] = await mhdAccommodationsService.managerProjection('person-1');

    expect(rpcMock).toHaveBeenCalledWith('mhd_accommodation_manager_projection', {
      p_person_id: 'person-1',
    });
    expect(instruction).toEqual({
      implementationId: 'impl-1',
      optionType: 'MODIFIED_SCHEDULE',
      managerInstruction: 'Schedule a five-minute break each hour; start at 10:00.',
      startDate: '2026-08-01',
      endDate: null,
      reviewDueDate: '2026-11-01',
    });
    // What a manager gets is exactly: what to do, from when, until when.
    expect(Object.keys(instruction).sort()).toEqual([
      'endDate',
      'implementationId',
      'managerInstruction',
      'optionType',
      'reviewDueDate',
      'startDate',
    ]);
  });
});

/* ------------------------------------------------------------------ */
/* Decision and review contracts                                       */
/* ------------------------------------------------------------------ */

describe('mhdAccommodationsService — decisions and re-engagement', () => {
  it('sends a denial with the individualized analysis and keeps the process open', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'decision-1', error: null });

    await mhdAccommodationsService.decide({
      caseId: CASE,
      outcome: 'DENIED',
      decisionSummary: 'The requested schedule cannot be granted.',
      denialReasonCode: 'UNDUE_HARDSHIP',
      individualizedAnalysis: 'Remote work and reassignment were costed and evaluated.',
      alternativesConsidered: true,
      interactiveProcessContinues: true,
    });

    const [, args] = rpcMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(args.p_individualized_analysis).toEqual({
      analysis: 'Remote work and reassignment were costed and evaluated.',
    });
    expect(args.p_alternatives_considered).toBe(true);
    // Undue hardship does not end the interactive process.
    expect(args.p_interactive_process_continues).toBe(true);
  });

  it('surfaces the 23514 raised when a decision precedes any interaction', async () => {
    rpcMock.mockResolvedValueOnce({
      error: {
        code: '23514',
        message: 'A decision requires a recorded interactive-process interaction',
      },
    });

    await expect(
      mhdAccommodationsService.decide({
        caseId: CASE,
        outcome: 'APPROVED',
        decisionSummary: 'Granted.',
        selectedOptionId: 'option-1',
        alternativesConsidered: false,
        interactiveProcessContinues: false,
      }),
    ).rejects.toMatchObject({ code: '23514' });
  });

  it('surfaces the 23514 raised when the selected option removes an essential function', async () => {
    rpcMock.mockResolvedValueOnce({
      error: {
        code: '23514',
        message: 'Selected option is invalid or removes an essential function',
      },
    });

    await expect(
      mhdAccommodationsService.decide({
        caseId: CASE,
        outcome: 'APPROVED',
        decisionSummary: 'Granted.',
        selectedOptionId: 'option-removes-ef',
        alternativesConsidered: false,
        interactiveProcessContinues: false,
      }),
    ).rejects.toMatchObject({ code: '23514' });
  });

  it('a review marked INEFFECTIVE re-engages the interactive process', async () => {
    rpcMock.mockResolvedValueOnce({ error: null });

    await mhdAccommodationsService.completeReview({
      reviewId: 'review-1',
      effectiveness: 'INEFFECTIVE',
      summary: 'The seated workstation no longer covers the afternoon shift.',
      reengageRequired: true,
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_accommodation_complete_review', {
      p_review_id: 'review-1',
      p_effectiveness: 'INEFFECTIVE',
      p_summary: 'The seated workstation no longer covers the afternoon shift.',
      p_reengage_required: true,
    });
  });

  it.each(MHD_ACCOMMODATION_REVIEW_EFFECTIVENESS)(
    'sends %s, one of the four values the CHECK constraint admits',
    async (effectiveness) => {
      // accommodation_review_effectiveness_allowed rejects anything else with
      // 23514. The union type is the guard; this pins the exact four values so
      // a rename in either direction fails here rather than at runtime.
      rpcMock.mockResolvedValueOnce({ error: null });
      await mhdAccommodationsService.completeReview({
        reviewId: 'review-1',
        effectiveness,
        summary: 'Reviewed.',
        reengageRequired: false,
      });
      expect(rpcMock.mock.calls[0][1]).toMatchObject({ p_effectiveness: effectiveness });
    },
  );
});

/* ------------------------------------------------------------------ */
/* The pre-live compliance gate                                        */
/* ------------------------------------------------------------------ */

describe('mhdAccommodationsService — the compliance release gate', () => {
  it('reports the module NOT release-ready while blockers remain', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          module_key: 'ACCOMMODATIONS',
          release_ready: false,
          blocker_count: 2,
          blockers: [
            {
              content_key: 'RA_INTERACTIVE_PROCESS_LETTER',
              version: 1,
              review_status: 'PENDING_REVIEW',
              production_enabled: false,
              source_url: 'https://calcivilrights.ca.gov/',
            },
          ],
        },
      ],
      error: null,
    });

    const readiness = await mhdAccommodationsService.readiness();

    expect(rpcMock).toHaveBeenCalledWith('mhd_compliance_module_readiness', {
      p_module_key: 'ACCOMMODATIONS',
    });
    expect(readiness?.release_ready).toBe(false);
    expect(readiness?.blocker_count).toBe(2);
    expect(readiness?.blockers[0].review_status).toBe('PENDING_REVIEW');
  });

  it('returns null rather than inventing readiness when the registry has no row', async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });
    // A missing row must never read as "ready" — the banner treats null as
    // unknown, not as approval.
    expect(await mhdAccommodationsService.readiness()).toBeNull();
  });
});
