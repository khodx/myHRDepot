import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

const { mhdTrainingService } = await import('../Service');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('mhdTrainingService — catalog mapping', () => {
  it('normalises PostgREST numeric-strings but PRESERVES the semantic null (one-time course)', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'course-1',
          reference_id: 'TRN-0001',
          company_id: null,
          course_key: 'ca-harassment',
          title: 'CA harassment',
          description: null,
          category: 'HARASSMENT',
          delivery_mode: 'ONLINE',
          duration_minutes: '120', // serialised as a string
          recurrence_months: 24,
          requires_evidence: true,
          external_url: null,
          is_active: true,
          is_global: true,
        },
        {
          id: 'course-2',
          reference_id: 'TRN-0002',
          company_id: 'company-1',
          course_key: 'orientation',
          title: 'Orientation',
          description: null,
          category: 'ONBOARDING',
          delivery_mode: 'DOCUMENT',
          duration_minutes: null,
          recurrence_months: null, // one-time — must stay null, never 0
          requires_evidence: false,
          external_url: null,
          is_active: true,
          is_global: false,
        },
      ],
      error: null,
    });

    const courses = await mhdTrainingService.listCourses({ companyId: 'company-1' });

    expect(rpcMock).toHaveBeenCalledWith('mhd_training_course_list', {
      p_company_id: 'company-1',
      p_include_inactive: false,
    });
    expect(courses[0]).toMatchObject({
      durationMinutes: 120,
      recurrenceMonths: 24,
      isGlobal: true,
    });
    // The one-time course keeps its null recurrence — collapsing to 0 would invent an expiry.
    expect(courses[1].recurrenceMonths).toBeNull();
    expect(courses[1].durationMinutes).toBeNull();
    expect(courses[1].isGlobal).toBe(false);
  });

  it('never queries without a company — returns an empty catalog', async () => {
    const courses = await mhdTrainingService.listCourses({ companyId: null });
    expect(courses).toEqual([]);
    expect(rpcMock).not.toHaveBeenCalled();
  });
});

describe('mhdTrainingService — server-derived compliance passthrough', () => {
  it('copies the RPC compliance_status VERBATIM onto the assignment — no client recompute', async () => {
    // The row is EXPIRED per the server even though a naive client re-derivation
    // from a far-future-looking record might disagree; the mapper must not touch it.
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'assign-1',
          reference_id: 'TRA-0001',
          course_id: 'course-1',
          course_title: 'CA harassment',
          category: 'HARASSMENT',
          person_id: 'person-1',
          person_display_name: 'Dana Doe',
          assigned_by: 'user-1',
          due_date: null,
          status: 'COMPLETED',
          compliance_status: 'EXPIRED',
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
      error: null,
    });

    const [assignment] = await mhdTrainingService.listAssignments({ companyId: 'company-1' });
    expect(assignment.complianceStatus).toBe('EXPIRED');
    expect(assignment.status).toBe('COMPLETED');
  });

  it('carries the FROZEN expires_at through the completion result unchanged', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ id: 'comp-1', reference_id: 'TRC-0001', expires_at: '2027-01-15T00:00:00Z' }],
      error: null,
    });

    const result = await mhdTrainingService.complete({ assignmentId: 'assign-1' });
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_complete', {
      p_assignment_id: 'assign-1',
      p_completion_method: 'ATTESTED',
      p_attachment_id: undefined,
      p_completed_at: undefined,
    });
    expect(result.expiresAt).toBe('2027-01-15T00:00:00Z');
  });

  it('renders the server is_expired flag verbatim on completion history', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'comp-1',
          reference_id: 'TRC-0001',
          course_id: 'course-1',
          course_title: 'CA harassment',
          completed_at: '2024-01-15T00:00:00Z',
          completion_method: 'CERTIFICATE',
          expires_at: '2026-01-15T00:00:00Z',
          attachment_id: 'att-1',
          is_expired: true,
        },
      ],
      error: null,
    });

    const [completion] = await mhdTrainingService.listCompletions('person-1');
    expect(completion.isExpired).toBe(true);
    expect(completion.attachmentId).toBe('att-1');
  });
});

describe('mhdTrainingService — waiver contract', () => {
  it('sends the trimmed reason to the RPC', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdTrainingService.waiveAssignment({ assignmentId: 'a', reason: '  Left company  ' });
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_waive_assignment', {
      p_assignment_id: 'a',
      p_reason: 'Left company',
    });
  });

  it('surfaces the RPC error verbatim (e.g. cancel refused on a completed assignment)', async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'A completed assignment cannot be cancelled' },
    });
    await expect(mhdTrainingService.cancelAssignment('a')).rejects.toMatchObject({
      message: 'A completed assignment cannot be cancelled',
    });
  });
});
