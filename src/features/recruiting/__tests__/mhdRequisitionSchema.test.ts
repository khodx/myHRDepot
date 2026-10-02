import { describe, expect, it } from 'vitest';
import { mhdRequisitionFormSchema } from '../requisitions/Schemas';

const base = {
  companyId: 'company-1',
  title: 'Field Service Technician',
  jobId: 'job-1',
  hiringManagerPersonId: '',
  department: '',
  location: '',
  employmentType: '',
  headcount: 1,
  requiresApproval: false,
};

describe('mhdRequisitionFormSchema', () => {
  it('accepts a requisition linked to a job', () => {
    expect(mhdRequisitionFormSchema.safeParse(base).success).toBe(true);
  });

  it.each(['', '   '])(
    'refuses a requisition with no job (%j): the hire is assigned to that job',
    (jobId) => {
      const result = mhdRequisitionFormSchema.safeParse({ ...base, jobId });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Select the job this requisition is for.');
      }
    },
  );

  it('still lets the hiring manager, department and location stay blank', () => {
    expect(
      mhdRequisitionFormSchema.safeParse({ ...base, hiringManagerPersonId: null, location: null })
        .success,
    ).toBe(true);
  });
});
