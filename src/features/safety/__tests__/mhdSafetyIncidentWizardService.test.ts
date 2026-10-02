import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

const { mhdSafetyService } = await import('../Service');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('mhdSafetyService — incident wizard', () => {
  it('maps the recordability rules the questions are built from', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          rule_key: 'WORK_RELATED',
          kind: 'PRECONDITION',
          fact_key: 'work_related',
          answer_type: 'BOOLEAN',
          outcome_classification: null,
          label: 'The injury resulted from an event in the work environment',
          guidance: 'An event or exposure at work caused or contributed to the condition.',
          citation: '29 CFR 1904.5(a)',
        },
        {
          rule_key: 'DAYS_AWAY',
          kind: 'CRITERION',
          fact_key: 'days_away_count',
          answer_type: 'NUMBER',
          outcome_classification: 'DAYS_AWAY_FROM_WORK',
          label: 'The employee has days away from work',
          guidance: null,
          citation: '29 CFR 1904.7(b)(3)',
        },
      ],
      error: null,
    });

    const rules = await mhdSafetyService.listRecordabilityRules('company-ridgeline');

    expect(rpcMock).toHaveBeenCalledWith('mhd_safety_recordability_rules_list', {
      p_company_id: 'company-ridgeline',
    });
    expect(rules).toEqual([
      {
        ruleKey: 'WORK_RELATED',
        kind: 'PRECONDITION',
        factKey: 'work_related',
        answerType: 'BOOLEAN',
        outcomeClassification: null,
        label: 'The injury resulted from an event in the work environment',
        guidance: 'An event or exposure at work caused or contributed to the condition.',
        citation: '29 CFR 1904.5(a)',
      },
      {
        ruleKey: 'DAYS_AWAY',
        kind: 'CRITERION',
        factKey: 'days_away_count',
        answerType: 'NUMBER',
        outcomeClassification: 'DAYS_AWAY_FROM_WORK',
        label: 'The employee has days away from work',
        guidance: null,
        citation: '29 CFR 1904.7(b)(3)',
      },
    ]);
  });

  it('evaluates recordability and keeps an undetermined result undetermined', async () => {
    rpcMock.mockResolvedValueOnce({
      data: {
        rule_set_version: 1,
        registry_review_status: 'PENDING_REVIEW',
        recordable: null,
        classification: null,
        failed_preconditions: [],
        matched_criteria: [],
        missing_facts: [
          { rule_key: 'NEW_CASE', fact_key: 'new_case', label: 'This is a new case' },
        ],
      },
      error: null,
    });

    const result = await mhdSafetyService.evaluateRecordability('company-ridgeline', {
      work_related: true,
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_safety_recordability_evaluate', {
      p_company_id: 'company-ridgeline',
      p_facts: { work_related: true },
    });
    expect(result.recordable).toBeNull();
    expect(result.registryReviewStatus).toBe('PENDING_REVIEW');
    expect(result.missingFacts).toEqual([
      { ruleKey: 'NEW_CASE', factKey: 'new_case', label: 'This is a new case' },
    ]);
  });

  it('maps a recordable recommendation with the criteria that produced it', async () => {
    rpcMock.mockResolvedValueOnce({
      data: {
        rule_set_version: 1,
        registry_review_status: 'PENDING_REVIEW',
        recordable: true,
        classification: 'OTHER_RECORDABLE',
        failed_preconditions: [],
        matched_criteria: [
          {
            rule_key: 'MEDICAL_TREATMENT',
            label: 'Medical treatment beyond first aid',
            citation: '29 CFR 1904.7(b)(5)',
            classification: 'OTHER_RECORDABLE',
          },
        ],
        missing_facts: [],
      },
      error: null,
    });

    const result = await mhdSafetyService.evaluateRecordability('company-ridgeline', {});

    expect(result.recordable).toBe(true);
    expect(result.classification).toBe('OTHER_RECORDABLE');
    expect(result.matchedCriteria[0]).toEqual({
      ruleKey: 'MEDICAL_TREATMENT',
      label: 'Medical treatment beyond first aid',
      citation: '29 CFR 1904.7(b)(5)',
      classification: 'OTHER_RECORDABLE',
    });
  });

  it('surfaces a rejected evaluation instead of swallowing it', async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not authorized to evaluate safety incidents for this company' },
    });

    await expect(mhdSafetyService.evaluateRecordability('company-ridgeline', {})).rejects.toThrow(
      'Not authorized to evaluate safety incidents',
    );
  });

  it('asks for the reporting deadlines from the time the employer learned of the event', async () => {
    rpcMock.mockResolvedValueOnce({
      data: {
        jurisdiction: 'CALIFORNIA',
        triggers: [
          {
            trigger_kind: 'AMPUTATION',
            label: 'An amputation',
            guidance: null,
            citation: 'Cal. Labor Code 6302(h), 6409.1(b)',
            deadline_hours: 8,
            deadline_at: '2026-10-02T02:00:00Z',
          },
        ],
        earliest_deadline_at: '2026-10-02T02:00:00Z',
        needs_notified_time: false,
      },
      error: null,
    });

    const result = await mhdSafetyService.evaluateSevereInjury(
      'est-sacramento',
      { amputation: true },
      '2026-10-01T18:00:00Z',
    );

    expect(rpcMock).toHaveBeenCalledWith('mhd_safety_severe_injury_evaluate', {
      p_establishment_id: 'est-sacramento',
      p_facts: { amputation: true },
      p_employer_notified_at: '2026-10-01T18:00:00Z',
    });
    expect(result.jurisdiction).toBe('CALIFORNIA');
    expect(result.triggers[0]).toMatchObject({ triggerKind: 'AMPUTATION', deadlineHours: 8 });
    expect(result.needsNotifiedTime).toBe(false);
  });

  it('omits the notified time when it is not known yet', async () => {
    rpcMock.mockResolvedValueOnce({
      data: {
        jurisdiction: 'FEDERAL',
        triggers: [],
        earliest_deadline_at: null,
        needs_notified_time: false,
      },
      error: null,
    });

    await mhdSafetyService.evaluateSevereInjury('est-boise', { amputation: false }, null);

    expect(rpcMock).toHaveBeenCalledWith('mhd_safety_severe_injury_evaluate', {
      p_establishment_id: 'est-boise',
      p_facts: { amputation: false },
    });
  });

  it('returns only dates and status from the leave context', async () => {
    rpcMock.mockResolvedValueOnce({
      data: {
        visible: true,
        cases: [
          {
            id: 'leave-1',
            reference_id: 'A1B-2-3456-7-89',
            status: 'COMPLETED',
            start_date: '2026-09-22',
            end_date: '2026-10-10',
            suggested_calendar_days: 19,
          },
        ],
      },
      error: null,
    });

    const result = await mhdSafetyService.getLeaveContext(
      'company-ridgeline',
      'person-marisol',
      '2026-09-21',
    );

    expect(rpcMock).toHaveBeenCalledWith('mhd_safety_incident_leave_context', {
      p_company_id: 'company-ridgeline',
      p_person_id: 'person-marisol',
      p_incident_date: '2026-09-21',
    });
    expect(result).toEqual({
      visible: true,
      cases: [
        {
          id: 'leave-1',
          referenceId: 'A1B-2-3456-7-89',
          status: 'COMPLETED',
          startDate: '2026-09-22',
          endDate: '2026-10-10',
          suggestedCalendarDays: 19,
        },
      ],
    });
  });

  it('reports a hidden leave context as not visible', async () => {
    rpcMock.mockResolvedValueOnce({ data: { visible: false, cases: [] }, error: null });

    const result = await mhdSafetyService.getLeaveContext(
      'company-ridgeline',
      'person-marisol',
      '2026-09-21',
    );

    expect(result).toEqual({ visible: false, cases: [] });
  });

  it('opens the incident, decision and reporting decisions in one call', async () => {
    rpcMock.mockResolvedValueOnce({
      data: {
        id: 'incident-77',
        reference_id: 'C4D-5-6789-0-12',
        case_number: 3,
        recordable: true,
        classification: 'DAYS_AWAY_FROM_WORK',
        severe_injury_reports: [
          {
            id: 'report-1',
            trigger_kind: 'AMPUTATION',
            decision: 'REPORT_REQUIRED',
            deadline_at: '2026-10-02T02:00:00Z',
          },
        ],
      },
      error: null,
    });

    const result = await mhdSafetyService.openFromIntake({
      companyId: 'company-ridgeline',
      establishmentId: 'est-sacramento',
      incident: {
        personId: 'person-marisol',
        dateOfIncident: '2026-09-30',
        timeOfIncident: '',
        whatHappened: 'Her hand was caught in the press brake.',
        injuryIllnessDescription: 'Partial amputation of the left index finger',
        illnessType: 'INJURY',
        daysAwayCount: 12,
        daysRestrictedOrTransferredCount: 0,
        isPrivacyCase: false,
        bodyPart: 'Left index finger',
        employerNotifiedAt: '2026-09-30T18:00:00Z',
      },
      facts: { work_related: true, amputation: true },
      decision: { recordable: true, classification: 'DAYS_AWAY_FROM_WORK' },
      severeDecisions: [{ triggerKind: 'AMPUTATION', decision: 'REPORT_REQUIRED' }],
    });

    const [name, args] = rpcMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(name).toBe('mhd_safety_incident_intake_open');
    expect(args.p_company_id).toBe('company-ridgeline');
    expect(args.p_establishment_id).toBe('est-sacramento');
    expect(args.p_incident).toMatchObject({
      person_id: 'person-marisol',
      date_of_incident: '2026-09-30',
      time_of_incident: null,
      days_away_count: 12,
      body_part: 'Left index finger',
      employer_notified_at: '2026-09-30T18:00:00Z',
      non_employee_name: null,
      privacy_case_reason: null,
    });
    expect(args.p_decision).toEqual({
      recordable: true,
      classification: 'DAYS_AWAY_FROM_WORK',
      override_reason: null,
    });
    expect(args.p_severe_decisions).toEqual([
      { trigger_kind: 'AMPUTATION', decision: 'REPORT_REQUIRED', reason: null },
    ]);
    expect(result).toEqual({
      id: 'incident-77',
      referenceId: 'C4D-5-6789-0-12',
      caseNumber: 3,
      recordable: true,
      classification: 'DAYS_AWAY_FROM_WORK',
      severeInjuryReports: [
        {
          id: 'report-1',
          triggerKind: 'AMPUTATION',
          decision: 'REPORT_REQUIRED',
          deadlineAt: '2026-10-02T02:00:00Z',
        },
      ],
    });
  });

  it('maps a non-recordable result to no case number and no classification', async () => {
    rpcMock.mockResolvedValueOnce({
      data: {
        id: 'incident-78',
        reference_id: 'E5F-6-7890-1-23',
        case_number: null,
        recordable: false,
        classification: null,
        severe_injury_reports: [],
      },
      error: null,
    });

    const result = await mhdSafetyService.openFromIntake({
      companyId: 'company-ridgeline',
      establishmentId: 'est-sacramento',
      incident: {
        nonEmployeeName: 'Delivery driver',
        dateOfIncident: '2026-09-29',
        whatHappened: 'Scraped an elbow on a shelf.',
        injuryIllnessDescription: 'Minor scrape cleaned and bandaged',
        daysAwayCount: 0,
        daysRestrictedOrTransferredCount: 0,
        isPrivacyCase: false,
      },
      facts: { work_related: true },
      decision: { recordable: false, classification: null },
      severeDecisions: [],
    });

    expect(result.caseNumber).toBeNull();
    expect(result.classification).toBeNull();
    expect(result.recordable).toBe(false);
  });

  it('shows the server refusal when an override has no reason', async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: {
        message: 'Record why you are not following the recommendation (at least 10 characters)',
      },
    });

    await expect(
      mhdSafetyService.openFromIntake({
        companyId: 'company-ridgeline',
        establishmentId: 'est-sacramento',
        incident: {
          personId: 'person-marisol',
          dateOfIncident: '2026-09-30',
          whatHappened: 'A fall from a ladder.',
          injuryIllnessDescription: 'Bruised ribs',
          daysAwayCount: 0,
          daysRestrictedOrTransferredCount: 0,
          isPrivacyCase: false,
        },
        facts: {},
        decision: { recordable: true, classification: 'OTHER_RECORDABLE' },
        severeDecisions: [],
      }),
    ).rejects.toThrow('Record why you are not following the recommendation');
  });

  it('reads the stored determination and the reporting records', async () => {
    rpcMock.mockResolvedValueOnce({
      data: {
        determination: {
          rule_set_version: 1,
          registry_review_status: 'PENDING_REVIEW',
          recommendation: {
            rule_set_version: 1,
            registry_review_status: 'PENDING_REVIEW',
            recordable: true,
            classification: 'OTHER_RECORDABLE',
            failed_preconditions: [],
            matched_criteria: [],
            missing_facts: [],
          },
          recommended_recordable: true,
          recommended_classification: 'OTHER_RECORDABLE',
          decided_recordable: true,
          decided_classification: 'JOB_TRANSFER_OR_RESTRICTION',
          is_override: true,
          override_reason: 'Physician restricted standing for two weeks',
          decided_at: '2026-10-01T15:30:00Z',
        },
        severe_injury_reports: [
          {
            id: 'report-1',
            incident_id: 'incident-77',
            trigger_kind: 'AMPUTATION',
            jurisdiction: 'CALIFORNIA',
            rule_citation: 'Cal. Labor Code 6302(h), 6409.1(b)',
            deadline_hours: 8,
            deadline_at: '2026-10-02T02:00:00Z',
            decision: 'REPORT_REQUIRED',
            decision_reason: null,
            reported_at: '2026-10-01T20:00:00Z',
            report_method: 'PHONE',
            agency_reference: 'CA-2026-04417',
          },
        ],
      },
      error: null,
    });

    const evidence = await mhdSafetyService.getEvidence('incident-77');

    expect(evidence.determination).toMatchObject({
      isOverride: true,
      decidedClassification: 'JOB_TRANSFER_OR_RESTRICTION',
      overrideReason: 'Physician restricted standing for two weeks',
    });
    expect(evidence.severeInjuryReports[0]).toMatchObject({
      triggerKind: 'AMPUTATION',
      reportMethod: 'PHONE',
      agencyReference: 'CA-2026-04417',
    });
  });

  it('returns no determination for a legacy incident that has none', async () => {
    rpcMock.mockResolvedValueOnce({
      data: { determination: null, severe_injury_reports: [] },
      error: null,
    });

    const evidence = await mhdSafetyService.getEvidence('incident-legacy');

    expect(evidence).toEqual({ determination: null, severeInjuryReports: [] });
  });

  it('records the report that was made to the agency', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });

    await mhdSafetyService.recordSevereInjuryReport({
      reportId: 'report-1',
      reportedAt: '2026-10-01T20:00:00Z',
      method: 'PHONE',
      agencyReference: 'CA-2026-04417',
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_safety_severe_injury_record_report', {
      p_report_id: 'report-1',
      p_reported_at: '2026-10-01T20:00:00Z',
      p_method: 'PHONE',
      p_agency_reference: 'CA-2026-04417',
    });
  });
});
