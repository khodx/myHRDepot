import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

const { mhdTrainingService } = await import('../Service');

beforeEach(() => vi.clearAllMocks());

describe('mhdTrainingService — audit engine', () => {
  it('sets and reports capped time on task as elapsed time', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdTrainingService.setTimeOnTask({ companyId: 'company-1' });
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_time_on_task_set', {
      p_company_id: 'company-1',
      p_max_session_minutes: 480,
    });

    rpcMock.mockResolvedValueOnce({
      data: [{ person_id: 'person-1', block_id: 'block-1', minutes: '42.5' }],
      error: null,
    });
    await expect(
      mhdTrainingService.timeOnTaskReport({
        companyId: 'company-1',
        personId: 'person-1',
        from: '2026-09-01',
        to: '2026-09-23',
      }),
    ).resolves.toEqual([{ personId: 'person-1', blockId: 'block-1', minutes: 42.5 }]);
    expect(rpcMock).toHaveBeenLastCalledWith('mhd_training_time_on_task_report', {
      p_company_id: 'company-1',
      p_person_id: 'person-1',
      p_from: '2026-09-01',
      p_to: '2026-09-23',
    });
  });

  it('returns the learner export bundle with raw snake_case rows unchanged', async () => {
    const bundle = {
      assignments: [{ person_id: 'person-1', source_type: 'MANUAL' }],
      completions: [{ person_id: 'person-1', completed_at: '2026-09-20T10:00:00Z' }],
      blockProgress: [{ block_id: 'block-1', started_at: null }],
      assessmentAttempts: [{ attempt_number: 1, score_percent: 90 }],
      auditStatements: [{ object_type: 'training_block', verb: 'completed' }],
    };
    rpcMock.mockResolvedValueOnce({ data: bundle, error: null });

    await expect(mhdTrainingService.learnerExport('person-1')).resolves.toBe(bundle);
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_learner_export', {
      p_person_id: 'person-1',
    });
  });

  it('creates, revokes, and reports an external auditor grant', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ id: 'grant-1', reference_id: 'EAG-0001' }],
      error: null,
    });
    await expect(
      mhdTrainingService.createExternalAuditorGrant({
        companyId: 'company-1',
        courseId: 'course-1',
        auditorLabel: '  OSHA auditor  ',
        validUntil: '2026-10-01T00:00:00Z',
      }),
    ).resolves.toEqual({ id: 'grant-1', referenceId: 'EAG-0001' });

    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await mhdTrainingService.revokeExternalAuditorGrant({ grantId: 'grant-1' });
    expect(rpcMock).toHaveBeenLastCalledWith('mhd_training_external_auditor_grant_revoke', {
      p_grant_id: 'grant-1',
    });

    rpcMock.mockResolvedValueOnce({
      data: [
        {
          person_id: 'person-1',
          person_display_name: 'Dana Doe',
          status: 'COMPLETED',
          completed_at: '2026-09-20T10:00:00Z',
        },
      ],
      error: null,
    });
    await expect(mhdTrainingService.externalAuditorReport('grant-1')).resolves.toEqual([
      {
        personId: 'person-1',
        personDisplayName: 'Dana Doe',
        status: 'COMPLETED',
        completedAt: '2026-09-20T10:00:00Z',
      },
    ]);
  });

  it('surfaces a revoked or expired auditor grant error normally', async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'Grant is revoked or outside its valid window' },
    });
    await expect(mhdTrainingService.externalAuditorReport('grant-1')).rejects.toMatchObject({
      message: 'Grant is revoked or outside its valid window',
    });
  });

  it('lists external auditor grants for a company', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'grant-1',
          reference_id: 'EAG-0001',
          course_id: 'course-1',
          course_title: 'Forklift Safety Fundamentals',
          auditor_label: 'OSHA auditor',
          valid_from: '2026-09-01T00:00:00Z',
          valid_until: '2026-10-01T00:00:00Z',
          revoked_at: null,
          created_at: '2026-09-01T00:00:00Z',
        },
      ],
      error: null,
    });
    await expect(
      mhdTrainingService.listExternalAuditorGrants({ companyId: 'company-1' }),
    ).resolves.toEqual([
      {
        id: 'grant-1',
        referenceId: 'EAG-0001',
        courseId: 'course-1',
        courseTitle: 'Forklift Safety Fundamentals',
        auditorLabel: 'OSHA auditor',
        validFrom: '2026-09-01T00:00:00Z',
        validUntil: '2026-10-01T00:00:00Z',
        revokedAt: null,
        createdAt: '2026-09-01T00:00:00Z',
      },
    ]);
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_external_auditor_grant_list', {
      p_company_id: 'company-1',
    });
  });

  it('lists content licenses for global courses, including an unrestricted course with no expiry', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          course_id: 'course-1',
          course_title: 'Global Compliance Basics',
          is_active: true,
          expires_at: '2026-12-31T00:00:00Z',
          updated_at: '2026-09-01T00:00:00Z',
        },
        {
          course_id: 'course-2',
          course_title: 'Global Orientation',
          is_active: true,
          expires_at: null,
          updated_at: null,
        },
      ],
      error: null,
    });
    await expect(
      mhdTrainingService.listContentLicenses({ companyId: 'company-1' }),
    ).resolves.toEqual([
      {
        courseId: 'course-1',
        courseTitle: 'Global Compliance Basics',
        isActive: true,
        expiresAt: '2026-12-31T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
      },
      {
        courseId: 'course-2',
        courseTitle: 'Global Orientation',
        isActive: true,
        expiresAt: null,
        updatedAt: null,
      },
    ]);
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_content_license_list', {
      p_company_id: 'company-1',
    });
  });

  it('reads back the current time-on-task setting, defaulting when no row exists', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ max_session_minutes: 240, updated_at: '2026-09-01T00:00:00Z' }],
      error: null,
    });
    await expect(mhdTrainingService.getTimeOnTask({ companyId: 'company-1' })).resolves.toEqual({
      maxSessionMinutes: 240,
      updatedAt: '2026-09-01T00:00:00Z',
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_time_on_task_get', {
      p_company_id: 'company-1',
    });

    rpcMock.mockResolvedValueOnce({ data: [], error: null });
    await expect(mhdTrainingService.getTimeOnTask({ companyId: 'company-2' })).resolves.toEqual({
      maxSessionMinutes: 480,
      updatedAt: null,
    });
  });
});
