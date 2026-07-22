import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mhdCanSeePayFromRow, mhdFormatPayRange } from '../Types';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

const { mhdJobsService } = await import('../Service');

// A job row exactly as the RPC serialises it. `numeric` columns arrive as
// strings from PostgREST; the mapper normalises them.
const privilegedJobRow = {
  id: 'job-1',
  reference_id: 'JOB-000001',
  job_title: 'Line Cook',
  job_code: 'LC-1',
  job_family: 'Kitchen',
  job_level: null,
  department: 'Operations',
  flsa_classification: 'NON_EXEMPT',
  employment_type: 'FULL_TIME',
  is_safety_sensitive: true,
  industry: 'GENERAL',
  pay_min: '38000.00',
  pay_max: '45000.00',
  pay_period: 'ANNUAL',
  is_active: true,
  incumbent_count: '3',
  published_description_id: 'desc-1',
};

// The SAME job as the RPC returns it to a Client Admin: pay masked server-side.
// All three pay columns come back null together — the module's central promise
// that a UI bug cannot leak compensation, because the figures never reach the
// client at all.
const maskedJobRow = {
  ...privilegedJobRow,
  pay_min: null,
  pay_max: null,
  pay_period: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('mhdJobsService — pay masking (server-side, reflected in the mapper)', () => {
  it('surfaces numeric pay to a privileged caller, normalising the string serialisation', async () => {
    rpcMock.mockResolvedValueOnce({ data: [privilegedJobRow], error: null });

    const [job] = await mhdJobsService.listJobs('company-1');

    expect(rpcMock).toHaveBeenCalledWith(
      'mhd_job_list_jobs',
      expect.objectContaining({ p_company_id: 'company-1', p_active_only: true }),
    );
    expect(job.payMin).toBe(38000);
    expect(job.payMax).toBe(45000);
    expect(job.payPeriod).toBe('ANNUAL');
    expect(job.incumbentCount).toBe(3);
    expect(mhdCanSeePayFromRow(job)).toBe(true);
    expect(mhdFormatPayRange(job)).toContain('/yr');
  });

  it('maps a Client Admin row to NULL pay — never zero, never a fabricated range', async () => {
    rpcMock.mockResolvedValueOnce({ data: [maskedJobRow], error: null });

    const [job] = await mhdJobsService.listJobs('company-1');

    // The three fields are null together and nothing collapses them to 0, which
    // would render a $0 range and misrepresent both "masked" and "unset".
    expect(job.payMin).toBeNull();
    expect(job.payMax).toBeNull();
    expect(job.payPeriod).toBeNull();
    // Non-pay fields still map through — masking is surgical, not a blanket drop.
    expect(job.jobTitle).toBe('Line Cook');
    expect(job.isSafetySensitive).toBe(true);
    // The display helpers word themselves honestly off the nulls.
    expect(mhdCanSeePayFromRow(job)).toBe(false);
    expect(mhdFormatPayRange(job)).toBeNull();
  });

  it('setPayRange still sends the figures — writing a band is a separate authorisation the RPC guards', async () => {
    rpcMock.mockResolvedValueOnce({ error: null });

    await mhdJobsService.setPayRange({
      jobId: 'job-1',
      payMin: 40000,
      payMax: 50000,
      payPeriod: 'ANNUAL',
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_job_set_pay_range', {
      p_job_id: 'job-1',
      p_pay_min: 40000,
      p_pay_max: 50000,
      p_pay_period: 'ANNUAL',
    });
  });

  it('surfaces a 42501 denial a Client Admin hits when writing a pay range', async () => {
    rpcMock.mockResolvedValueOnce({
      error: { code: '42501', message: 'permission denied for function mhd_job_set_pay_range' },
    });

    await expect(
      mhdJobsService.setPayRange({ jobId: 'job-1', payMin: 40000, payMax: 50000, payPeriod: 'ANNUAL' }),
    ).rejects.toMatchObject({ code: '42501' });
  });
});

describe('mhdJobsService — the consumer contract', () => {
  it('resolves the version in force on the given date and flattens the jsonb children', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          job_id: 'job-1',
          job_title: 'Line Cook',
          flsa_classification: 'NON_EXEMPT',
          is_safety_sensitive: true,
          industry: 'GENERAL',
          description_id: 'desc-7',
          description_reference: 'JBDS-000007',
          version_number: 2,
          effective_from: '2026-01-01',
          summary: 'Prepares food to spec.',
          essential_functions: [{ text: 'Cook to order' }],
          marginal_functions: [{ text: 'Occasional prep' }],
          qualifications: [{ text: 'Food handler card', type: 'CERTIFICATION', required: true }],
          competencies: [
            { competency_id: 'comp-1', name: 'Food Safety', category: 'SAFETY', is_regulated: true, weight: '2.5' },
          ],
        },
      ],
      error: null,
    });

    const published = await mhdJobsService.getPublishedForPerson('person-1', '2026-03-15');

    expect(rpcMock).toHaveBeenCalledWith(
      'mhd_job_get_published_for_person',
      expect.objectContaining({ p_person_id: 'person-1', p_as_of: '2026-03-15' }),
    );
    expect(published?.descriptionId).toBe('desc-7');
    expect(published?.versionNumber).toBe(2);
    expect(published?.essentialFunctions).toEqual([{ text: 'Cook to order' }]);
    expect(published?.competencies[0]).toMatchObject({ name: 'Food Safety', isRegulated: true, weight: 2.5 });
  });

  it('returns null when the person has no published description in force', async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });
    await expect(mhdJobsService.getPublishedForPerson('person-1')).resolves.toBeNull();
  });
});
