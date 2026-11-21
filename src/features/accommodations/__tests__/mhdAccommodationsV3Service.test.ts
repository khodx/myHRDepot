import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mhdAccommodationDenialReasonsSchema,
  mhdAccommodationEquipmentSchema,
  mhdAccommodationProviderCertificationSchema,
  mhdAccommodationReasonsRequireContinuation,
  mhdAccommodationRequestDetailsSchema,
  prohibitedMedicalDetail,
} from '../Schemas';
import {
  MHD_ACCOMMODATION_DENIAL_REASON_RULES,
  MHD_ACCOMMODATION_DENIAL_REASONS,
  MHD_ACCOMMODATION_DOCUMENTATION_TYPES,
} from '../Types';

const { rpcMock, fromMock } = vi.hoisted(() => ({ rpcMock: vi.fn(), fromMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock, from: fromMock },
}));

const { mhdAccommodationsService } = await import('../Service');

const CASE = '5b8e1c52-1f0a-4a8c-9d0e-4f3a8c1b2d70';
const IMPL = '9c1d7e3a-0b5f-4e7a-8c21-6d4f9a2b3c10';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('denial reasons', () => {
  it('lists the eight pack reasons in form order, then the two statutory grounds', () => {
    expect([...MHD_ACCOMMODATION_DENIAL_REASONS]).toEqual([
      'INEFFECTIVE',
      'UNDUE_HARDSHIP',
      'MEDICAL_DOCUMENTATION_INADEQUATE',
      'REMOVES_ESSENTIAL_FUNCTION',
      'LOWERS_STANDARD',
      'NO_VACANT_POSITION',
      'EMPLOYEE_REJECTED_ALTERNATIVE',
      'OTHER',
      'NO_COVERED_DISABILITY',
      'DIRECT_THREAT',
    ]);
    expect(Object.keys(MHD_ACCOMMODATION_DENIAL_REASON_RULES).sort()).toEqual(
      [...MHD_ACCOMMODATION_DENIAL_REASONS].sort(),
    );
  });

  it('requires the specifics each code needs', () => {
    for (const code of MHD_ACCOMMODATION_DENIAL_REASONS) {
      const needsDetail = MHD_ACCOMMODATION_DENIAL_REASON_RULES[code].requiresDetail;
      const needsAlternative = MHD_ACCOMMODATION_DENIAL_REASON_RULES[code].requiresAlternative;
      const bare = mhdAccommodationDenialReasonsSchema.safeParse([{ code }]);
      expect(bare.success).toBe(!needsDetail && !needsAlternative);
      const full = mhdAccommodationDenialReasonsSchema.safeParse([
        { code, detail: 'Identified in the case file', alternativeOffered: 'A partitioned alcove' },
      ]);
      expect(full.success).toBe(true);
    }
  });

  it('needs both the offered alternative and the employee reason for a rejection', () => {
    expect(
      mhdAccommodationDenialReasonsSchema.safeParse([
        { code: 'EMPLOYEE_REJECTED_ALTERNATIVE', detail: 'Wants a door that closes' },
      ]).success,
    ).toBe(false);
    expect(
      mhdAccommodationDenialReasonsSchema.safeParse([
        { code: 'EMPLOYEE_REJECTED_ALTERNATIVE', alternativeOffered: 'A partition' },
      ]).success,
    ).toBe(false);
  });

  it('combines reasons, refuses an empty set and a repeated reason', () => {
    expect(
      mhdAccommodationDenialReasonsSchema.safeParse([
        { code: 'INEFFECTIVE' },
        { code: 'UNDUE_HARDSHIP', detail: 'Structural work exceeds the lease allowance' },
      ]).success,
    ).toBe(true);
    expect(mhdAccommodationDenialReasonsSchema.safeParse([]).success).toBe(false);
    expect(
      mhdAccommodationDenialReasonsSchema.safeParse([
        { code: 'INEFFECTIVE' },
        { code: 'INEFFECTIVE' },
      ]).success,
    ).toBe(false);
  });

  it('refuses diagnosis, causation and genetic information in a reason', () => {
    for (const detail of [
      'His diagnosis does not require this',
      'Caused by lifting at a previous employer',
      'The request rests on a genetic test result',
      'Family medical history was cited',
      'DNA screening',
    ]) {
      expect(
        mhdAccommodationDenialReasonsSchema.safeParse([{ code: 'OTHER', detail }]).success,
      ).toBe(false);
    }
  });

  it('knows that undue hardship keeps the interactive process open', () => {
    expect(
      mhdAccommodationReasonsRequireContinuation([
        { code: 'INEFFECTIVE' },
        { code: 'UNDUE_HARDSHIP' },
      ]),
    ).toBe(true);
    expect(mhdAccommodationReasonsRequireContinuation([{ code: 'INEFFECTIVE' }])).toBe(false);
  });

  it('sends the reasons to the decide RPC with their specifics', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'decision-1', error: null });
    await mhdAccommodationsService.decide({
      caseId: CASE,
      outcome: 'DENIED',
      decisionSummary: 'Not granted.',
      individualizedAnalysis: 'Reviewed the workplace and the options.',
      alternativesConsidered: true,
      interactiveProcessContinues: true,
      denialReasons: [
        { code: 'UNDUE_HARDSHIP', detail: ' Cost of structural work ' },
        {
          code: 'EMPLOYEE_REJECTED_ALTERNATIVE',
          detail: 'Wants a door',
          alternativeOffered: 'A partition',
        },
      ],
    });
    expect(rpcMock.mock.calls[0][1].p_denial_reasons).toEqual([
      { code: 'UNDUE_HARDSHIP', detail: 'Cost of structural work', alternative_offered: null },
      {
        code: 'EMPLOYEE_REJECTED_ALTERNATIVE',
        detail: 'Wants a door',
        alternative_offered: 'A partition',
      },
    ]);
  });

  it('reads the vocabulary table in form order and maps its columns', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          code: 'UNDUE_HARDSHIP',
          label: 'Accommodation would cause undue hardship',
          sort_order: 2,
          requires_detail: true,
          detail_prompt: 'Identify the hardship',
          requires_alternative: false,
          alternative_prompt: null,
        },
      ],
      error: null,
    });
    fromMock.mockReturnValueOnce({ select: () => ({ order }) });
    await expect(mhdAccommodationsService.listDenialReasonCodes()).resolves.toEqual([
      {
        code: 'UNDUE_HARDSHIP',
        label: 'Accommodation would cause undue hardship',
        sortOrder: 2,
        requiresDetail: true,
        detailPrompt: 'Identify the hardship',
        requiresAlternative: false,
        alternativePrompt: null,
      },
    ]);
    expect(fromMock).toHaveBeenCalledWith('accommodation_denial_reason_codes');
    expect(order).toHaveBeenCalledWith('sort_order');
  });
});

describe('medical-detail screen parity with the database', () => {
  it('catches the same terms as mhd_text_has_prohibited_medical_detail', () => {
    for (const text of [
      'She was diagnosed with a condition',
      'the medical records show',
      'caused by lifting',
      'Genetic information was shared',
      'a genetic test',
      'genetic screening',
      'genetics',
      'DNA',
      'family history',
      'family medical history',
    ]) {
      expect(prohibitedMedicalDetail.test(text)).toBe(true);
    }
    for (const text of ['Needs a seated workstation', 'Generic office chair', 'Redna']) {
      expect(prohibitedMedicalDetail.test(text)).toBe(false);
    }
  });

  it('offers the employee statement as a documentation type', () => {
    expect(MHD_ACCOMMODATION_DOCUMENTATION_TYPES).toContain('EMPLOYEE_STATEMENT');
  });
});

describe('Section A request details', () => {
  const base = { caseId: CASE };

  it('accepts a complete temporary-limitation request', () => {
    expect(
      mhdAccommodationRequestDetailsSchema.safeParse({
        ...base,
        limitationDuration: 'TEMPORARY',
        anticipatedRecoveryDate: '2027-02-01',
        workersCompClaim: true,
        workersCompClaimFiledOn: '2026-10-01',
        leaveRequested: true,
        leaveRequestDetails: 'Requested six weeks of CFRA leave on October 6',
        contactEmail: 'perpetua@example.com',
        workLocation: 'Warehouse, Dock 3',
        supervisorName: 'Marcus Delgado',
      }).success,
    ).toBe(true);
  });

  it('refuses a recovery date on a permanent limitation, a claim date without a claim, and leave without details', () => {
    expect(
      mhdAccommodationRequestDetailsSchema.safeParse({
        ...base,
        limitationDuration: 'PERMANENT',
        anticipatedRecoveryDate: '2027-02-01',
      }).success,
    ).toBe(false);
    expect(
      mhdAccommodationRequestDetailsSchema.safeParse({
        ...base,
        workersCompClaimFiledOn: '2026-10-01',
      }).success,
    ).toBe(false);
    expect(
      mhdAccommodationRequestDetailsSchema.safeParse({ ...base, leaveRequested: true }).success,
    ).toBe(false);
  });

  it('refuses medical detail in the free-text fields and a malformed email', () => {
    expect(
      mhdAccommodationRequestDetailsSchema.safeParse({
        ...base,
        leaveRequested: true,
        leaveRequestDetails: 'Leave after a genetic test',
      }).success,
    ).toBe(false);
    expect(
      mhdAccommodationRequestDetailsSchema.safeParse({ ...base, contactEmail: 'not-an-email' })
        .success,
    ).toBe(false);
  });

  it('sends Section A to the RPC with trimmed text', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'details-1', error: null });
    await mhdAccommodationsService.recordRequestDetails({
      caseId: CASE,
      limitationDuration: 'TEMPORARY',
      anticipatedRecoveryDate: '2027-02-01',
      workLocation: ' Billing office ',
    });
    expect(rpcMock).toHaveBeenCalledWith(
      'mhd_accommodation_request_details_record',
      expect.objectContaining({
        p_case_id: CASE,
        p_limitation_duration: 'TEMPORARY',
        p_anticipated_recovery_date: '2027-02-01',
        p_work_location: 'Billing office',
        p_workers_comp_claim: false,
        p_leave_requested: false,
      }),
    );
  });

  it('certifies through self-service by default and passes an administrator method through', async () => {
    rpcMock.mockResolvedValue({ data: '2026-11-20T10:00:00Z', error: null });
    await mhdAccommodationsService.certifyAsEmployee({ caseId: CASE });
    await mhdAccommodationsService.certifyAsEmployee({ caseId: CASE, method: 'IN_PERSON_PAPER' });
    expect(rpcMock.mock.calls[0][1]).toEqual({ p_case_id: CASE, p_method: 'SELF_SERVICE' });
    expect(rpcMock.mock.calls[1][1]).toEqual({ p_case_id: CASE, p_method: 'IN_PERSON_PAPER' });
  });
});

describe('Section B provider certification', () => {
  const base = { caseId: CASE };

  it('accepts a complete certification', () => {
    expect(
      mhdAccommodationProviderCertificationSchema.safeParse({
        ...base,
        providerName: 'Dr. Ingrid Solheim',
        certifiedAt: '2026-11-15',
        disabilityVerified: true,
        limitationDuration: 'TEMPORARY',
        limitationEndDate: '2027-01-15',
        accommodationBeginOn: '2026-11-20',
        accommodationEndOn: '2027-01-15',
        recommendation: 'A height-adjustable desk converter.',
      }).success,
    ).toBe(true);
  });

  it('refuses inconsistent dates, a continuous accommodation with an end date, and a missing provider', () => {
    const invalid = [
      { limitationDuration: 'PERMANENT', limitationEndDate: '2027-01-15' },
      { accommodationBeginOn: '2026-11-20', accommodationEndOn: '2026-11-10' },
      { accommodationContinuous: true, accommodationEndOn: '2027-01-15' },
      { certifiedAt: '2026-11-15' },
    ];
    for (const fields of invalid) {
      expect(
        mhdAccommodationProviderCertificationSchema.safeParse({ ...base, ...fields }).success,
      ).toBe(false);
    }
  });

  it('refuses a diagnosis, causation or genetic information in the recommendation', () => {
    for (const recommendation of [
      'Her diagnosis is a lumbar condition',
      'Family history is relevant',
      'caused by lifting',
    ]) {
      expect(
        mhdAccommodationProviderCertificationSchema.safeParse({ ...base, recommendation }).success,
      ).toBe(false);
    }
  });

  it('writes through the aal2 RPC and reveals only through the audited reveal', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'cert-1', error: null });
    await mhdAccommodationsService.recordProviderCertification({
      caseId: CASE,
      providerName: ' Dr. Ingrid Solheim ',
      disabilityVerified: true,
      limitationDuration: 'PERMANENT',
    });
    expect(rpcMock.mock.calls[0][0]).toBe('mhd_accommodation_provider_certification_record');
    expect(rpcMock.mock.calls[0][1]).toMatchObject({
      p_provider_name: 'Dr. Ingrid Solheim',
      p_disability_verified: true,
    });
    rpcMock.mockResolvedValueOnce({
      data: { provider_name: 'Dr. Ingrid Solheim', recommendation: 'x' },
      error: null,
    });
    await expect(mhdAccommodationsService.revealProviderCertification('cert-1')).resolves.toEqual({
      provider_name: 'Dr. Ingrid Solheim',
      recommendation: 'x',
    });
    expect(rpcMock).toHaveBeenLastCalledWith('mhd_accommodation_provider_certification_reveal', {
      p_certification_id: 'cert-1',
    });
  });
});

describe('Section D equipment and implementation', () => {
  it('requires an order before receipt and refuses receipt before the order', () => {
    expect(
      mhdAccommodationEquipmentSchema.safeParse({
        implementationId: IMPL,
        receivedOn: '2026-11-18',
      }).success,
    ).toBe(false);
    expect(
      mhdAccommodationEquipmentSchema.safeParse({
        implementationId: IMPL,
        orderedOn: '2026-11-18',
        receivedOn: '2026-11-10',
      }).success,
    ).toBe(false);
    expect(
      mhdAccommodationEquipmentSchema.safeParse({
        implementationId: IMPL,
        orderedOn: '2026-11-10',
        receivedOn: '2026-11-18',
      }).success,
    ).toBe(true);
  });

  it('sends equipment tracking and passes the equipment dates when implementing', async () => {
    rpcMock.mockResolvedValue({ data: 'ok', error: null });
    await mhdAccommodationsService.recordEquipment({
      implementationId: IMPL,
      orderedOn: '2026-11-10',
    });
    expect(rpcMock).toHaveBeenLastCalledWith('mhd_accommodation_implementation_record_equipment', {
      p_implementation_id: IMPL,
      p_ordered_on: '2026-11-10',
      p_ordered_by: undefined,
      p_received_on: undefined,
    });
    await mhdAccommodationsService.implement({
      caseId: CASE,
      optionId: 'option-1',
      startDate: '2026-11-20',
      managerInstruction: 'Allow the converter.',
      equipmentOrderedOn: '2026-11-10',
    });
    expect(rpcMock.mock.calls.at(-1)?.[1]).toMatchObject({ p_equipment_ordered_on: '2026-11-10' });
  });
});
