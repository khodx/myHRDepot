import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mhdCompanyService } from '../Service';

// vi.hoisted: the vi.mock factory is hoisted above these declarations.
const { returnsMock, fromMock } = vi.hoisted(() => {
  const returnsMock = vi.fn();
  const singleMock = vi.fn();
  const orderMock = vi.fn((): unknown => ({ returns: returnsMock, eq: eqMock, ilike: ilikeMock }));
  const eqMock = vi.fn((): unknown => ({
    order: orderMock,
    returns: returnsMock,
    eq: eqMock,
    ilike: ilikeMock,
  }));
  const ilikeMock = vi.fn((): unknown => ({
    order: orderMock,
    returns: returnsMock,
    eq: eqMock,
    ilike: ilikeMock,
  }));
  const selectMock = vi.fn(() => ({
    order: orderMock,
    eq: eqMock,
    ilike: ilikeMock,
    single: singleMock,
    returns: returnsMock,
  }));
  const insertMock = vi.fn(() => ({ select: selectMock }));
  const eqUpdateMock = vi.fn(() => ({ select: selectMock }));
  const updateMock = vi.fn(() => ({ eq: eqUpdateMock }));
  const fromMock = vi.fn(() => ({ select: selectMock, insert: insertMock, update: updateMock }));
  return { returnsMock, fromMock };
});

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { from: fromMock },
}));

describe('mhdCompanyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps database company rows to application companies', async () => {
    returnsMock.mockResolvedValueOnce({
      data: [
        {
          id: '01HZXCOMPANY00000000000001',
          reference_id: 'COMP-000001',
          company_name: 'Mission Pediatrics',
          industry: 'Healthcare',
          employee_count: 42,
          headquarters_location: 'Austin, TX',
          created_at: '2026-07-05T00:00:00.000Z',
          created_by: 'SYSTEM',
          updated_at: '2026-07-05T00:00:00.000Z',
          updated_by: 'SYSTEM',
        },
      ],
      error: null,
    });

    const companies = await mhdCompanyService.listCompanies({ searchTerm: '' });

    expect(companies).toEqual([
      {
        id: '01HZXCOMPANY00000000000001',
        referenceId: 'COMP-000001',
        companyName: 'Mission Pediatrics',
        industry: 'Healthcare',
        employeeCount: 42,
        headquartersLocation: 'Austin, TX',
        createdAt: '2026-07-05T00:00:00.000Z',
        createdBy: 'SYSTEM',
        updatedAt: '2026-07-05T00:00:00.000Z',
        updatedBy: 'SYSTEM',
      },
    ]);
  });
});
