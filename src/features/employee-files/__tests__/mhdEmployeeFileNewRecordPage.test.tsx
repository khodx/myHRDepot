import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const PERSON_ID = '7c1d5e92-3b48-4f6a-a0d7-19e8c2b45f60';
const PERSON_COMPANY_ID = 'b48f2c17-9d05-4e3a-8a61-5d7e0c9f3a24';
const VIEWER_COMPANY_ID = 'e93a6d05-1c7b-42f8-b504-8f2a1d6c7e39';
const DEFAULT_FORM_ID = 'a52e8f13-6b90-4d27-91c4-3e7d5a0b8c61';

const { getPersonById, listFormsForCompany, defaultLookup } = vi.hoisted(() => ({
  getPersonById: vi.fn(),
  listFormsForCompany: vi.fn(),
  defaultLookup: vi.fn(),
}));

// The signed-in user belongs to a DIFFERENT company than the person whose file
// is being opened; nothing on this page may read the viewer's company.
vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ profile: { companyId: VIEWER_COMPANY_ID }, roles: ['Platform Admin'] }),
}));

vi.mock('@/features/people/Service', () => ({
  mhdPersonService: { getPersonById },
}));

vi.mock('@/features/forms/Service', () => ({
  mhdFormService: { listFormsForCompany },
}));

vi.mock('../Hook', () => ({
  useMhdEmployeeFileCategoryDefault: (companyId: string | null, category: string | null) => {
    defaultLookup(companyId, category);
    return { data: null, isLoading: false, isSuccess: true, isError: false };
  },
}));

const { MhdEmployeeFileNewRecordPage } = await import('../components/MhdEmployeeFileNewRecordPage');

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/employees/${PERSON_ID}/files/new?category=medical`]}>
        <Routes>
          <Route path="/employees/:personId/files/new" element={<MhdEmployeeFileNewRecordPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getPersonById.mockResolvedValue({
    id: PERSON_ID,
    companyId: PERSON_COMPANY_ID,
    displayName: 'Jordan Martinez',
    firstName: 'Jordan',
    lastName: 'Martinez',
  });
  listFormsForCompany.mockResolvedValue([
    {
      id: DEFAULT_FORM_ID,
      name: 'Medical Leave Certification',
      description: null,
      status: 'ACTIVE',
      employeeFileCategory: 'medical',
    },
  ]);
});

describe('MhdEmployeeFileNewRecordPage company scope', () => {
  it("looks up forms and the default with the person's company, not the viewer's", async () => {
    renderPage();

    await waitFor(() => expect(listFormsForCompany).toHaveBeenCalled());
    expect(listFormsForCompany).toHaveBeenCalledWith(PERSON_COMPANY_ID, 'ACTIVE');
    expect(listFormsForCompany).not.toHaveBeenCalledWith(VIEWER_COMPANY_ID, expect.anything());

    const companiesAsked = defaultLookup.mock.calls.map(([companyId]) => companyId);
    expect(companiesAsked).toContain(PERSON_COMPANY_ID);
    expect(companiesAsked).not.toContain(VIEWER_COMPANY_ID);
    expect(await screen.findByText('Medical Leave Certification')).toBeInTheDocument();
  });

  it('asks for no default until the person, and therefore the company, is known', () => {
    getPersonById.mockReturnValue(new Promise(() => undefined));
    renderPage();
    expect(defaultLookup).toHaveBeenCalledWith(null, 'medical');
    expect(listFormsForCompany).not.toHaveBeenCalled();
  });
});
