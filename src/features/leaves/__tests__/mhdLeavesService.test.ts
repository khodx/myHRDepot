import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

const { mhdLeavesService } = await import('../Service');

// A certification row exactly as mhd_leave_cert_list serialises it to a PA/HRP
// caller: the medical fields are present.
const privilegedCertRow = {
  id: 'cert-1',
  certification_type: 'INITIAL',
  due_date: '2026-08-01',
  received_at: '2026-07-20',
  sufficient: true,
  provider_note: 'Serious health condition; intermittent flare-ups expected.',
  drive_file_id: 'drive-abc-123',
};

// The SAME certification as the RPC returns it to a Client Admin: the server
// masks provider_note and drive_file_id to null (29 CFR 825.500(g)). The content
// never reaches the client — this is the highest-stakes masking in the platform.
const maskedCertRow = {
  ...privilegedCertRow,
  provider_note: null,
  drive_file_id: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('mhdLeavesService — the medical-certification partition (server-side mask)', () => {
  it('surfaces the provider note and document to a privileged (PA/HRP) caller', async () => {
    rpcMock.mockResolvedValueOnce({ data: [privilegedCertRow], error: null });

    const [cert] = await mhdLeavesService.listCertifications('case-1');

    expect(rpcMock).toHaveBeenCalledWith('mhd_leave_cert_list', { p_case_id: 'case-1' });
    expect(cert.providerNote).toBe('Serious health condition; intermittent flare-ups expected.');
    expect(cert.driveFileId).toBe('drive-abc-123');
    // Non-medical status fields are present for everyone who can view the case.
    expect(cert.certificationType).toBe('INITIAL');
    expect(cert.sufficient).toBe(true);
  });

  it('maps a Client Admin row to NULL medical fields — never a fabricated value', async () => {
    rpcMock.mockResolvedValueOnce({ data: [maskedCertRow], error: null });

    const [cert] = await mhdLeavesService.listCertifications('case-1');

    // The mask is applied server-side; the mapper copies the nulls through
    // verbatim and never infers content. The Client Admin genuinely receives no
    // medical narrative in the response body.
    expect(cert.providerNote).toBeNull();
    expect(cert.driveFileId).toBeNull();
    // The non-medical status still maps through — masking is surgical.
    expect(cert.certificationType).toBe('INITIAL');
    expect(cert.dueDate).toBe('2026-08-01');
    expect(cert.sufficient).toBe(true);
  });

  it('surfaces a 42501 denial a Client Admin hits when recording a certification', async () => {
    rpcMock.mockResolvedValueOnce({
      error: { code: '42501', message: 'permission denied for function mhd_leave_cert_record' },
    });

    await expect(
      mhdLeavesService.recordCertification({ caseId: 'case-1', certificationType: 'INITIAL' }),
    ).rejects.toMatchObject({ code: '42501' });
  });
});

describe('mhdLeavesService — the concurrent decrement', () => {
  it('designate returns the number of ledger rows written — one per designated basis', async () => {
    // A case designated FMLA + PDL: one designate call writes TWO rows, moving
    // both clocks at once. PostgREST may serialise the count as a string.
    rpcMock.mockResolvedValueOnce({ data: '2', error: null });

    const rowsWritten = await mhdLeavesService.designate({
      caseId: 'case-1',
      hours: 480,
      effectiveDate: '2026-07-20',
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_leave_designate', {
      p_case_id: 'case-1',
      p_hours: 480,
      p_effective_date: '2026-07-20',
    });
    expect(rowsWritten).toBe(2);
  });

  it('balance is queried per leave type independently — never a single aggregate', async () => {
    rpcMock.mockResolvedValueOnce({ data: '0', error: null });
    const fmla = await mhdLeavesService.balance('person-1', 'type-fmla', '2026-07-20');
    expect(rpcMock).toHaveBeenLastCalledWith('mhd_leave_balance', {
      p_person_id: 'person-1',
      p_leave_type_id: 'type-fmla',
      p_as_of: '2026-07-20',
    });
    expect(fmla).toBe(0);

    rpcMock.mockResolvedValueOnce({ data: '480', error: null });
    const cfra = await mhdLeavesService.balance('person-1', 'type-cfra', '2026-07-20');
    expect(rpcMock).toHaveBeenLastCalledWith('mhd_leave_balance', {
      p_person_id: 'person-1',
      p_leave_type_id: 'type-cfra',
      p_as_of: '2026-07-20',
    });
    // Each basis has its own clock: exhausting FMLA leaves CFRA whole.
    expect(cfra).toBe(480);
  });
});
