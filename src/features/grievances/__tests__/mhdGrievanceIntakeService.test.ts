import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock, esignatureMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
  esignatureMock: vi.fn(),
}));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));
vi.mock('@/features/esignature/Service', () => ({
  mhdEsignatureService: { createRequestFromGeneratedDocument: esignatureMock },
}));

const { mhdGrievancesService } = await import('../Service');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('mhdGrievancesService — intake wizard', () => {
  it('files the grievance and its witnesses in one call with the exact payload', async () => {
    rpcMock.mockResolvedValueOnce({
      data: {
        id: 'grievance-1',
        reference_id: '675-3-55C3-0-BA',
        status: 'SUBMITTED',
        referred: false,
      },
      error: null,
    });

    const result = await mhdGrievancesService.openFromIntake({
      companyId: 'company-northstar',
      personId: 'person-marisol',
      grievanceWhat: 'My overtime for the week of September 14 was not paid.',
      disagreementExplanation: 'The timesheet shows 46 hours but I was paid for 40.',
      remedyRequested: 'Pay the six overtime hours.',
      employeeSignatureName: 'Marisol Okonkwo',
      grievanceCategory: 'PAY_AND_HOURS',
      personGrievedAgainstId: 'person-callum',
      grievanceWhere: 'Payroll office',
      grievanceWhen: '2026-09-15T09:00:00.000Z',
      stepsAlreadyTaken: 'I emailed payroll twice.',
      isHarassmentRelated: false,
      retaliationConcern: true,
      concernsUnrecordedOralReprimand: false,
      witnesses: [
        {
          witnessName: 'Dario Fontaine',
          witnessPersonId: 'person-dario',
          whatTheyKnow: 'Saw me clock out.',
        },
        { witnessName: 'A visiting auditor' },
      ],
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_grievance_intake_open', {
      p_company_id: 'company-northstar',
      p_person_id: 'person-marisol',
      p_grievance: {
        grievance_what: 'My overtime for the week of September 14 was not paid.',
        disagreement_explanation: 'The timesheet shows 46 hours but I was paid for 40.',
        remedy_requested: 'Pay the six overtime hours.',
        employee_signature_name: 'Marisol Okonkwo',
        grievance_category: 'PAY_AND_HOURS',
        person_grieved_against_id: 'person-callum',
        grievance_who: null,
        grievance_where: 'Payroll office',
        grievance_when: '2026-09-15T09:00:00.000Z',
        grievance_why: null,
        steps_already_taken: 'I emailed payroll twice.',
        is_harassment_related: false,
        retaliation_concern: true,
        concerns_unrecorded_oral_reprimand: false,
      },
      p_witnesses: [
        {
          witness_name: 'Dario Fontaine',
          witness_person_id: 'person-dario',
          what_they_know: 'Saw me clock out.',
        },
        { witness_name: 'A visiting auditor', witness_person_id: null, what_they_know: null },
      ],
    });
    expect(result).toEqual({
      id: 'grievance-1',
      referenceId: '675-3-55C3-0-BA',
      status: 'SUBMITTED',
      referred: false,
    });
  });

  it('reports a harassment grievance as referred at filing', async () => {
    rpcMock.mockResolvedValueOnce({
      data: {
        id: 'grievance-2',
        reference_id: 'A1B-2-3456-7-89',
        status: 'REFERRED',
        referred: true,
      },
      error: null,
    });

    const result = await mhdGrievancesService.openFromIntake({
      companyId: 'company-northstar',
      personId: 'person-marisol',
      grievanceWhat: 'Comments about my appearance.',
      disagreementExplanation: 'They are unwelcome.',
      remedyRequested: 'It must stop.',
      employeeSignatureName: 'Marisol Okonkwo',
      isHarassmentRelated: true,
      retaliationConcern: false,
      concernsUnrecordedOralReprimand: false,
      witnesses: [],
    });

    expect(result.status).toBe('REFERRED');
    expect(result.referred).toBe(true);
  });

  it('shows the server message when filing is refused', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'Describe what happened' } });

    await expect(
      mhdGrievancesService.openFromIntake({
        companyId: 'company-northstar',
        personId: 'person-marisol',
        grievanceWhat: '',
        disagreementExplanation: 'x',
        remedyRequested: 'y',
        employeeSignatureName: 'z',
        isHarassmentRelated: false,
        retaliationConcern: false,
        concernsUnrecordedOralReprimand: false,
        witnesses: [],
      }),
    ).rejects.toThrow('Describe what happened');
  });

  it('reads the intake detail with its witnesses', async () => {
    rpcMock.mockResolvedValueOnce({
      data: {
        grievance_category: 'SUPERVISOR_CONDUCT',
        person_grieved_against_id: 'person-callum',
        person_grieved_against_name: 'Callum Reyes',
        steps_already_taken: 'Spoke to him directly.',
        retaliation_concern: true,
        witnesses: [
          {
            id: 'w1',
            witness_name: 'Dario Fontaine',
            witness_person_id: 'person-dario',
            what_they_know: 'Was present.',
          },
        ],
      },
      error: null,
    });

    const detail = await mhdGrievancesService.getIntakeDetail('grievance-1');

    expect(rpcMock).toHaveBeenCalledWith('mhd_grievance_get_intake_detail', {
      p_grievance_id: 'grievance-1',
    });
    expect(detail).toEqual({
      grievanceCategory: 'SUPERVISOR_CONDUCT',
      personGrievedAgainstId: 'person-callum',
      personGrievedAgainstName: 'Callum Reyes',
      stepsAlreadyTaken: 'Spoke to him directly.',
      retaliationConcern: true,
      witnesses: [
        {
          id: 'w1',
          witnessName: 'Dario Fontaine',
          witnessPersonId: 'person-dario',
          whatTheyKnow: 'Was present.',
        },
      ],
    });
  });

  it('treats a missing detail as empty rather than inventing values', async () => {
    rpcMock.mockResolvedValueOnce({ data: {}, error: null });

    const detail = await mhdGrievancesService.getIntakeDetail('grievance-1');

    expect(detail.grievanceCategory).toBeNull();
    expect(detail.retaliationConcern).toBe(false);
    expect(detail.witnesses).toEqual([]);
  });

  it('asks the filer to sign the receipt in the app, as an internal signer', async () => {
    esignatureMock.mockResolvedValueOnce({ request: { id: 'request-9' }, invitationErrors: [] });

    const result = await mhdGrievancesService.requestFilerSignature({
      companyId: 'company-northstar',
      generationId: 'generation-4',
      documentHash: 'hash-4',
      userId: 'user-marisol',
    });

    expect(esignatureMock).toHaveBeenCalledWith({
      companyId: 'company-northstar',
      generationId: 'generation-4',
      documentHash: 'hash-4',
      signers: [{ kind: 'internal', userId: 'user-marisol' }],
      signingOrder: 'SEQUENTIAL',
    });
    expect(result).toEqual({ requestId: 'request-9', invitationErrors: [] });
  });
});
