import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

const { mhdSafetyService } = await import('../Service');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('mhdSafetyService — establishments', () => {
  it('lists establishments and maps snake_case rows to camelCase', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'est-1',
          reference_id: 'ABC-1-2345-6-78',
          company_id: 'company-1',
          establishment_name: 'Main Plant',
          naics_code: '453998',
          address_street: '1 Main St',
          address_city: 'Austin',
          address_state: 'TX',
          address_zip: '78701',
          average_employee_count: 50,
          total_hours_worked_ytd: 100000,
          is_active: true,
          created_at: '2026-01-01T00:00:00.000Z',
          created_by: 'user-1',
          updated_at: '2026-01-01T00:00:00.000Z',
          updated_by: null,
        },
      ],
      error: null,
    });

    const result = await mhdSafetyService.listEstablishments('company-1');

    expect(rpcMock).toHaveBeenCalledWith('mhd_list_osha_establishments', {
      p_company_id: 'company-1',
    });
    expect(result).toEqual([
      expect.objectContaining({
        id: 'est-1',
        referenceId: 'ABC-1-2345-6-78',
        establishmentName: 'Main Plant',
        naicsCode: '453998',
        addressState: 'TX',
        averageEmployeeCount: 50,
        totalHoursWorkedYtd: 100000,
      }),
    ]);
  });

  it('wraps an establishment-creation RPC error with a descriptive message', async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not authorized to create an establishment for this company' },
    });

    await expect(
      mhdSafetyService.createEstablishment({
        companyId: 'company-1',
        establishmentName: 'Main Plant',
        naicsCode: '453998',
        addressState: 'TX',
      }),
    ).rejects.toThrow(/Unable to create establishment/);
  });
});

describe('mhdSafetyService — incidents', () => {
  it('sends every field mhd_safety_incident_create expects, trimmed', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'incident-1', error: null });

    await mhdSafetyService.createIncident({
      companyId: 'company-1',
      establishmentId: 'est-1',
      dateOfIncident: '2026-01-15',
      whatHappened: '  Fell from a ladder.  ',
      injuryIllnessDescription: '  Fractured wrist.  ',
      classification: 'DAYS_AWAY_FROM_WORK',
      nonEmployeeName: '  Jordan Contractor  ',
      daysAwayCount: 5,
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_safety_incident_create', {
      p_company_id: 'company-1',
      p_establishment_id: 'est-1',
      p_date_of_incident: '2026-01-15',
      p_what_happened: 'Fell from a ladder.',
      p_injury_illness_description: 'Fractured wrist.',
      p_classification: 'DAYS_AWAY_FROM_WORK',
      p_person_id: undefined,
      p_non_employee_name: 'Jordan Contractor',
      p_job_title: undefined,
      p_time_of_incident: undefined,
      p_location_description: undefined,
      p_illness_type: undefined,
      p_days_away_count: 5,
      p_days_restricted_or_transferred_count: undefined,
      p_is_privacy_case: undefined,
    });
  });

  it('lists incidents scoped by establishment and calendar year, trusting the RPC redaction as-is', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'incident-1',
          reference_id: 'DEF-1-2345-6-78',
          company_id: 'company-1',
          establishment_id: 'est-1',
          person_id: null,
          displayed_subject_name: 'Privacy Case',
          case_number: 2,
          incident_year: 2026,
          job_title: null,
          date_of_incident: '2026-02-01',
          time_of_incident: null,
          location_description: null,
          what_happened: 'Needlestick exposure',
          injury_illness_description: 'Bloodborne pathogen exposure',
          classification: 'OTHER_RECORDABLE',
          illness_type: null,
          days_away_count: 0,
          days_restricted_or_transferred_count: 0,
          is_privacy_case: true,
          status: 'RECORDED',
          created_at: '2026-02-01T00:00:00.000Z',
        },
      ],
      error: null,
    });

    const result = await mhdSafetyService.listIncidents('company-1', 'est-1', 2026);

    expect(rpcMock).toHaveBeenCalledWith('mhd_list_safety_incidents', {
      p_company_id: 'company-1',
      p_establishment_id: 'est-1',
      p_calendar_year: 2026,
    });
    // The service must pass the server's displayed_subject_name straight
    // through — it must never attempt to re-derive or override redaction
    // client-side, even when is_privacy_case is true.
    expect(result[0]?.displayedSubjectName).toBe('Privacy Case');
    expect(result[0]?.isPrivacyCase).toBe(true);
  });

  it('rejects an update to a locked incident with the server error surfaced', async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: {
        message:
          'This incident is locked by a certified annual summary and can no longer be edited',
      },
    });

    await expect(
      mhdSafetyService.updateIncident({ incidentId: 'incident-1', jobTitle: 'New Title' }),
    ).rejects.toThrow(/locked by a certified annual summary/);
  });
});

describe('mhdSafetyService — annual summary lifecycle', () => {
  it('generates a summary for an establishment/year', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'summary-1', error: null });
    const id = await mhdSafetyService.generateAnnualSummary('est-1', 2026);
    expect(rpcMock).toHaveBeenCalledWith('mhd_osha_annual_summary_generate', {
      p_establishment_id: 'est-1',
      p_calendar_year: 2026,
    });
    expect(id).toBe('summary-1');
  });

  it('certifies a summary, trimming the certifying official fields', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdSafetyService.certifyAnnualSummary({
      summaryId: 'summary-1',
      certifyingOfficialName: '  Jane Certifier  ',
      certifyingOfficialTitle: '  VP Operations  ',
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_osha_annual_summary_certify', {
      p_summary_id: 'summary-1',
      p_certifying_official_name: 'Jane Certifier',
      p_certifying_official_title: 'VP Operations',
      p_document_generation_id: undefined,
    });
  });

  it('rejects re-certifying an already-certified summary with the server error surfaced', async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'Annual summary is already CERTIFIED and cannot be re-certified' },
    });
    await expect(
      mhdSafetyService.certifyAnnualSummary({
        summaryId: 'summary-1',
        certifyingOfficialName: 'Jane Certifier',
        certifyingOfficialTitle: 'VP Operations',
      }),
    ).rejects.toThrow(/already CERTIFIED/);
  });

  it('queues an ITA submission for a certified summary', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'queue-1', error: null });
    const id = await mhdSafetyService.queueItaSubmission('summary-1');
    expect(rpcMock).toHaveBeenCalledWith('mhd_osha_ita_submission_queue', {
      p_summary_id: 'summary-1',
    });
    expect(id).toBe('queue-1');
  });

  it('rejects queuing a DRAFT summary with the server error surfaced', async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: {
        message: 'Annual summary must be CERTIFIED before it can be queued for ITA submission (current status: DRAFT)',
      },
    });
    await expect(mhdSafetyService.queueItaSubmission('summary-1')).rejects.toThrow(
      /must be CERTIFIED/,
    );
  });
});

describe('mhdSafetyService — thresholds', () => {
  it('maps rule_key/forms_required to ruleKey/formsRequired', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ rule_key: 'FEDERAL_300A', forms_required: ['300A'] }],
      error: null,
    });
    const result = await mhdSafetyService.computeThresholds('est-1');
    expect(rpcMock).toHaveBeenCalledWith('mhd_compute_osha_thresholds', {
      p_establishment_id: 'est-1',
    });
    expect(result).toEqual([{ ruleKey: 'FEDERAL_300A', formsRequired: ['300A'] }]);
  });
});
