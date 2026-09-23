import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

const { mhdTrainingService } = await import('../Service');
const { mhdAssignTrainingSchema, mhdCreateTrainingComplianceRuleSchema } = await import(
  '../Schemas'
);

beforeEach(() => vi.clearAllMocks());

describe('LMS v2 assignment-engine schemas', () => {
  it('requires exactly one matching compliance-rule target', () => {
    const base = {
      companyId: 'company-1',
      title: 'California harassment',
      targetType: 'ORG_UNIT' as const,
      courseId: 'course-1',
    };

    expect(
      mhdCreateTrainingComplianceRuleSchema.safeParse({
        ...base,
        targetDepartment: '  People Ops  ',
      }).success,
    ).toBe(true);
    expect(
      mhdCreateTrainingComplianceRuleSchema.safeParse({
        ...base,
        targetDepartment: 'People Ops',
        targetJobId: 'job-1',
      }).success,
    ).toBe(false);
    expect(
      mhdCreateTrainingComplianceRuleSchema.safeParse({
        ...base,
        targetJobId: 'job-1',
      }).success,
    ).toBe(false);
    expect(
      mhdCreateTrainingComplianceRuleSchema.safeParse({
        ...base,
        targetType: 'JURISDICTION',
        targetJurisdiction: 'CA',
      }).success,
    ).toBe(true);
  });

  it('accepts the optional assignment-engine fields while preserving omission defaults', () => {
    expect(
      mhdAssignTrainingSchema.parse({
        companyId: 'company-1',
        courseId: 'course-1',
        personId: 'person-1',
        dueDate: null,
      }),
    ).toMatchObject({ dueDate: null });
  });
});

describe('mhdTrainingService — assignment engine mapping', () => {
  it('passes assignment source and emergency priority args and maps them from list rows', async () => {
    rpcMock.mockResolvedValueOnce({ data: [{ id: 'assignment-1', reference_id: 'TRA-1' }], error: null });
    await mhdTrainingService.assign({
      companyId: 'company-1',
      courseId: 'course-1',
      personId: 'person-1',
      sourceType: 'COMPLIANCE_RULE',
      sourceId: 'rule-1',
      isEmergencyPriority: true,
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_assign', {
      p_company_id: 'company-1',
      p_course_id: 'course-1',
      p_person_id: 'person-1',
      p_due_date: undefined,
      p_source_type: 'COMPLIANCE_RULE',
      p_source_id: 'rule-1',
      p_is_emergency_priority: true,
    });

    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'assignment-1', reference_id: 'TRA-1', course_id: 'course-1', course_title: 'Course',
          category: 'SAFETY', person_id: 'person-1', person_display_name: 'Dana Doe',
          assigned_by: 'user-1', due_date: null, status: 'ASSIGNED', compliance_status: 'ASSIGNED',
          source_type: 'COMPLIANCE_RULE', source_id: 'rule-1', is_emergency_priority: true,
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
      error: null,
    });
    await expect(mhdTrainingService.listAssignments({ companyId: 'company-1' })).resolves.toMatchObject([
      { sourceType: 'COMPLIANCE_RULE', sourceId: 'rule-1', isEmergencyPriority: true },
    ]);
  });

  it('maps compliance rules, self-enrollment requests, and program assignments', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ id: 'rule-1', reference_id: 'TCR-1', company_id: 'company-1', title: 'Rule', target_type: 'JOB_TITLE', target_department: null, target_job_id: 'job-1', target_jurisdiction: null, course_id: 'course-1', course_title: 'Course', due_offset_days: '30', is_active: true }],
      error: null,
    });
    await expect(mhdTrainingService.listComplianceRules('company-1')).resolves.toMatchObject([
      { referenceId: 'TCR-1', targetJobId: 'job-1', dueOffsetDays: 30 },
    ]);

    rpcMock.mockResolvedValueOnce({
      data: [{ id: 'request-1', reference_id: 'TSR-1', course_id: 'course-1', course_title: 'Course', person_id: 'person-1', person_display_name: 'Dana Doe', status: 'PENDING', requested_at: '2026-01-01T00:00:00Z', decided_at: null, decision_notes: null }],
      error: null,
    });
    await expect(mhdTrainingService.listSelfEnrollments({ companyId: 'company-1' })).resolves.toMatchObject([
      { referenceId: 'TSR-1', status: 'PENDING', decidedAt: null },
    ]);

    rpcMock.mockResolvedValueOnce({ data: [{ course_id: 'course-1', assignment_id: 'assignment-1' }], error: null });
    await expect(mhdTrainingService.assignProgram({ companyId: 'company-1', programId: 'program-1', personId: 'person-1' })).resolves.toEqual([
      { courseId: 'course-1', assignmentId: 'assignment-1' },
    ]);
  });
});
