import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mhdPersonService } from '../Service';

// vi.hoisted: the vi.mock factory is hoisted above these declarations.
const { returnsMock, rpcMock } = vi.hoisted(() => {
  const returnsMock = vi.fn();
  return { returnsMock, rpcMock: vi.fn(() => ({ returns: returnsMock })) };
});

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: {
    rpc: rpcMock,
  },
}));

describe('mhdPersonService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists people using the approved directory RPC', async () => {
    returnsMock.mockResolvedValueOnce({
      data: [
        {
          id: '01PERSON',
          reference_id: 'PERS-000001',
          company_id: '01COMPANY',
          company_name: 'Acme Clinic',
          first_name: 'Maria',
          middle_name: null,
          last_name: 'Lopez',
          preferred_name: null,
          display_name: 'Maria Lopez',
          primary_email: 'maria@example.com',
          primary_phone: null,
          primary_mobile: null,
          created_at: '2026-01-01T00:00:00Z',
          created_by: '01USER',
          updated_at: '2026-01-01T00:00:00Z',
          updated_by: '01USER',
        },
      ],
      error: null,
    });

    const people = await mhdPersonService.listPeople({ companyId: 'ALL', searchTerm: 'maria' });

    // 'ALL' omits p_company_id (undefined) so the SQL default NULL applies —
    // the generated RPC arg types are optional, not nullable.
    expect(rpcMock).toHaveBeenCalledWith('mhd_list_people_directory', {
      p_company_id: undefined,
      p_search_term: 'maria',
    });
    expect(people[0].displayName).toBe('Maria Lopez');
    expect(people[0].referenceId).toBe('PERS-000001');
  });

  it('throws a useful error when the RPC fails', async () => {
    returnsMock.mockResolvedValueOnce({ data: null, error: { message: 'permission denied' } });

    await expect(mhdPersonService.listPeople({ companyId: 'ALL', searchTerm: '' })).rejects.toThrow(
      'Unable to load people: permission denied',
    );
  });
});
