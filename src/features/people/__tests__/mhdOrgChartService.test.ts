import { beforeEach, describe, expect, it, vi } from 'vitest';

const { returnsMock, rpcMock } = vi.hoisted(() => {
  const returnsMock = vi.fn();
  const rpcMock = vi.fn<(name: string, args?: unknown) => unknown>();
  return { returnsMock, rpcMock };
});

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: {
    rpc: rpcMock,
  },
}));

const { mhdPersonService } = await import('../Service');

beforeEach(() => {
  vi.clearAllMocks();
  returnsMock.mockReset();
  rpcMock.mockReset();
  rpcMock.mockImplementation(() => ({ returns: returnsMock }));
});

describe('mhdPersonService org chart RPCs', () => {
  it('lists direct reports through the direct reports RPC and maps rows to camelCase', async () => {
    returnsMock.mockResolvedValueOnce({
      data: [
        {
          person_id: 'person-2',
          reference_id: 'PERS-000002',
          display_name: 'Robin Report',
          job_title: 'HR Generalist',
        },
        {
          person_id: 'person-3',
          reference_id: 'PERS-000003',
          display_name: 'Casey No Job',
          job_title: null,
        },
      ],
      error: null,
    });

    const result = await mhdPersonService.listDirectReports('person-1');

    expect(rpcMock).toHaveBeenCalledWith('mhd_list_direct_reports', {
      p_person_id: 'person-1',
    });
    expect(result).toEqual([
      {
        personId: 'person-2',
        referenceId: 'PERS-000002',
        displayName: 'Robin Report',
        jobTitle: 'HR Generalist',
      },
      {
        personId: 'person-3',
        referenceId: 'PERS-000003',
        displayName: 'Casey No Job',
        jobTitle: null,
      },
    ]);
  });

  it('lists org chart rows through the org chart RPC and leaves children empty', async () => {
    returnsMock.mockResolvedValueOnce({
      data: [
        {
          person_id: 'person-2',
          reference_id: 'PERS-000002',
          display_name: 'Robin Report',
          job_title: 'HR Generalist',
          manager_id: 'person-1',
          company_id: 'company-1',
        },
      ],
      error: null,
    });

    const result = await mhdPersonService.listOrgChart('company-1');

    expect(rpcMock).toHaveBeenCalledWith('mhd_list_people_org_chart', {
      p_company_id: 'company-1',
    });
    expect(result[0]).toEqual({
      personId: 'person-2',
      referenceId: 'PERS-000002',
      displayName: 'Robin Report',
      jobTitle: 'HR Generalist',
      managerId: 'person-1',
      companyId: 'company-1',
      children: [],
    });
    expect(result[0].children).toEqual([]);
  });

  it('throws a direct-reports-specific error when the RPC fails', async () => {
    returnsMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'permission denied for direct reports' },
    });

    await expect(mhdPersonService.listDirectReports('person-1')).rejects.toThrow(
      'Unable to load direct reports: permission denied for direct reports',
    );
  });

  it('throws an org-chart-specific error when the RPC fails', async () => {
    returnsMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'permission denied for org chart' },
    });

    await expect(mhdPersonService.listOrgChart('company-1')).rejects.toThrow(
      'Unable to load org chart: permission denied for org chart',
    );
  });
});
