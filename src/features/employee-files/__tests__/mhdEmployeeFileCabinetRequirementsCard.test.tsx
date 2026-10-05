import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const PERSON_ID = '7c1d5e92-3b48-4f6a-a0d7-19e8c2b45f60';
const COMPANY_ID = 'b48f2c17-9d05-4e3a-8a61-5d7e0c9f3a24';

const { getPersonById, listEmployeeFileSubmissions, getPersonCompleteness } = vi.hoisted(() => ({
  getPersonById: vi.fn(),
  listEmployeeFileSubmissions: vi.fn(),
  getPersonCompleteness: vi.fn(),
}));

vi.mock('@/features/people/Service', () => ({ mhdPersonService: { getPersonById } }));
vi.mock('@/features/forms/Service', () => ({ mhdFormService: { listEmployeeFileSubmissions } }));
vi.mock('../Service', () => ({ mhdEmployeeFilesService: { getPersonCompleteness } }));

const { MhdEmployeeFileCabinetPage } = await import('../components/MhdEmployeeFileCabinetPage');

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/employees/${PERSON_ID}`]}>
        <Routes>
          <Route path="/employees/:personId" element={<MhdEmployeeFileCabinetPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getPersonById.mockResolvedValue({
    id: PERSON_ID,
    companyId: COMPANY_ID,
    displayName: 'Jordan Martinez',
    referenceId: 'PER-0042',
    companyName: 'Harbor Ridge Dental',
  });
  listEmployeeFileSubmissions.mockResolvedValue([]);
});

describe('MhdEmployeeFileCabinetPage file requirements card', () => {
  it("shows this person's checklist with label, category, due date and status", async () => {
    getPersonCompleteness.mockResolvedValue([
      {
        requirementId: 'a1',
        label: 'Form I-9',
        category: 'i9',
        dueDate: '2026-09-30',
        status: 'OVERDUE',
      },
      {
        requirementId: 'a2',
        label: 'Form W-4',
        category: 'payroll',
        dueDate: null,
        status: 'SATISFIED',
      },
    ]);
    renderPage();

    expect(await screen.findByRole('heading', { name: 'File Requirements' })).toBeInTheDocument();
    expect(getPersonCompleteness).toHaveBeenCalledWith(PERSON_ID);
    expect(screen.getByText('Form I-9')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText('Satisfied')).toBeInTheDocument();
    expect(screen.getByText('1 of 2 Requirements Outstanding')).toBeInTheDocument();
  });

  it('renders nothing, and no error, when the call is refused', async () => {
    getPersonCompleteness.mockRejectedValue({
      message: 'Not permitted to see employee file completeness',
    });
    renderPage();

    await waitFor(() => expect(getPersonCompleteness).toHaveBeenCalled());
    expect(await screen.findByText('Jordan Martinez Employee Files')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'File Requirements' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Not permitted/)).not.toBeInTheDocument();
  });
});
