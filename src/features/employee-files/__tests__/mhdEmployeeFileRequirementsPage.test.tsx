import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const COMPANY_ID = '3f6b1a52-8c04-4d7e-9a13-2b5e7d90c481';
const PERSON_A = 'c81d4e07-52fa-4b69-a3d0-6e19b7f2058c';
const PERSON_B = '0b9e6a14-d3c7-4285-91fa-7c4d2e8b6035';
const GAP_I9 = '5a92e0c3-17b8-4f46-8d2e-b03c6a71d954';
const GAP_W4 = 'f2c8d015-9e36-47ab-b7d4-1a60e5c3928b';
const RULE_DEFAULT = '81a4c7e2-6d09-4b35-a1f8-d52e03b9c764';
const FORM_ID = 'e07b3d68-4a15-49c2-b6f1-90d8e2a5c317';

const { gapsState, requirementsState, upsertMutateAsync, listFormsForCompany } = vi.hoisted(() => ({
  gapsState: { current: {} as Record<string, unknown> },
  requirementsState: { current: {} as Record<string, unknown> },
  upsertMutateAsync: vi.fn(),
  listFormsForCompany: vi.fn(),
}));

vi.mock('@/features/companies/Hook', () => ({
  useMhdCompanies: () => ({
    data: [{ id: COMPANY_ID, companyName: 'Harbor Ridge Dental' }],
    isLoading: false,
    isError: false,
    error: null,
  }),
}));

vi.mock('@/features/forms/Service', () => ({
  mhdFormService: { listFormsForCompany },
}));

vi.mock('../Hook', () => ({
  useMhdEmployeeFileRequirementGaps: () => gapsState.current,
  useMhdEmployeeFileRequirements: () => requirementsState.current,
  useMhdUpsertEmployeeFileRequirement: () => ({
    mutateAsync: upsertMutateAsync,
    isPending: false,
  }),
}));

const { MhdEmployeeFileRequirementsPage } =
  await import('../components/MhdEmployeeFileRequirementsPage');

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <MhdEmployeeFileRequirementsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  gapsState.current = {
    isLoading: false,
    isError: false,
    error: null,
    data: [
      {
        personId: PERSON_A,
        personName: 'Priya Raman',
        requirementId: GAP_I9,
        label: 'Form I-9',
        category: 'i9',
        dueDate: '2026-09-30',
        status: 'OVERDUE',
      },
      {
        personId: PERSON_B,
        personName: 'Tomas Eriksen',
        requirementId: GAP_W4,
        label: 'Form W-4',
        category: 'payroll',
        dueDate: null,
        status: 'MISSING',
      },
    ],
  };
  requirementsState.current = {
    isLoading: false,
    isError: false,
    error: null,
    data: [
      {
        requirementId: RULE_DEFAULT,
        companyId: null,
        category: 'payroll',
        label: 'Form W-4',
        satisfiedByKind: 'W4_ELECTION',
        formId: null,
        templateKey: null,
        appliesToStates: ['ACTIVE', 'ON_LEAVE'],
        dueDaysAfterHire: 3,
        isActive: true,
        isOverride: false,
      },
    ],
  };
  listFormsForCompany.mockResolvedValue([
    { id: FORM_ID, name: 'Signed Handbook Acknowledgment', status: 'ACTIVE' },
  ]);
  upsertMutateAsync.mockResolvedValue(RULE_DEFAULT);
});

describe('MhdEmployeeFileRequirementsPage gaps', () => {
  it('lists each gap with a link to the employee and a status badge', () => {
    renderPage();

    expect(screen.getByRole('link', { name: 'Priya Raman' })).toHaveAttribute(
      'href',
      `/employees/${PERSON_A}`,
    );
    const overdueRow = screen.getByText('Form I-9').closest('tr')!;
    expect(within(overdueRow).getByText('I9 File')).toBeInTheDocument();
    expect(within(overdueRow).getByText('Overdue')).toBeInTheDocument();
    const missingRow = screen.getByText('Form W-4').closest('tr')!;
    expect(within(missingRow).getByText('Missing')).toBeInTheDocument();
  });

  it('filters by status and by category', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText('Status'), 'OVERDUE');
    expect(screen.getByText('Priya Raman')).toBeInTheDocument();
    expect(screen.queryByText('Tomas Eriksen')).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Status'), 'ALL');
    await user.selectOptions(screen.getByLabelText('Category'), 'payroll');
    expect(screen.getByText('Tomas Eriksen')).toBeInTheDocument();
    expect(screen.queryByText('Priya Raman')).not.toBeInTheDocument();
  });

  it('shows an empty state when there are no gaps', () => {
    gapsState.current = { isLoading: false, isError: false, error: null, data: [] };
    renderPage();
    expect(screen.getByText('No Requirement Gaps')).toBeInTheDocument();
  });

  it('shows a loading state', () => {
    gapsState.current = { isLoading: true, isError: false, error: null, data: undefined };
    renderPage();
    expect(screen.getByText('Loading Requirement Gaps...')).toBeInTheDocument();
  });

  it('surfaces a load error', () => {
    gapsState.current = {
      isLoading: false,
      isError: true,
      error: new Error('Not permitted to see employee file gaps'),
      data: undefined,
    };
    renderPage();
    expect(screen.getByRole('alert')).toHaveTextContent('Not permitted to see employee file gaps');
  });
});

describe('MhdEmployeeFileRequirementsPage requirements', () => {
  async function openRequirementsTab() {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('tab', { name: 'Requirements' }));
    return user;
  }

  it('lists rules with how they are satisfied, states, due days and source', async () => {
    await openRequirementsTab();

    const row = screen.getByText('Form W-4').closest('tr')!;
    expect(within(row).getByText('W-4 Election')).toBeInTheDocument();
    expect(within(row).getByText('Active, On Leave')).toBeInTheDocument();
    expect(within(row).getByText('3')).toBeInTheDocument();
    expect(within(row).getByText('Platform Default')).toBeInTheDocument();
  });

  it('validates the add modal before calling the upsert', async () => {
    const user = await openRequirementsTab();
    await user.click(screen.getByRole('button', { name: 'Add Requirement' }));

    const dialog = screen.getByRole('dialog', { name: 'Add Requirement' });
    await user.click(within(dialog).getByRole('button', { name: 'Save Requirement' }));

    expect(within(dialog).getByText('Enter a label.')).toBeInTheDocument();
    expect(within(dialog).getByText('Choose at least one employment state.')).toBeInTheDocument();
    expect(upsertMutateAsync).not.toHaveBeenCalled();
  });

  it('requires a company form when satisfied by a form submission', async () => {
    const user = await openRequirementsTab();
    await user.click(screen.getByRole('button', { name: 'Add Requirement' }));
    const dialog = screen.getByRole('dialog', { name: 'Add Requirement' });

    await user.selectOptions(within(dialog).getByLabelText(/Satisfied By/), 'FORM_SUBMISSION');
    await user.click(within(dialog).getByRole('button', { name: 'Save Requirement' }));

    expect(within(dialog).getByText('Choose a form.')).toBeInTheDocument();
    expect(upsertMutateAsync).not.toHaveBeenCalled();
  });

  it('saves a new form-based requirement through the upsert', async () => {
    const user = await openRequirementsTab();
    await user.click(screen.getByRole('button', { name: 'Add Requirement' }));
    const dialog = screen.getByRole('dialog', { name: 'Add Requirement' });

    await user.type(within(dialog).getByLabelText(/^Label/), 'Handbook Acknowledgment');
    await user.selectOptions(within(dialog).getByLabelText(/Category/), 'hr');
    await user.selectOptions(within(dialog).getByLabelText(/Satisfied By/), 'FORM_SUBMISSION');
    await within(dialog).findByRole('option', { name: 'Signed Handbook Acknowledgment' });
    await user.selectOptions(within(dialog).getByLabelText(/^Form/), FORM_ID);
    await user.click(
      within(dialog).getByRole('button', { name: /selected|Select Employment States/ }),
    );
    await user.click(await screen.findByRole('option', { name: /Active/ }));
    await user.type(within(dialog).getByLabelText('Due Days After Hire'), '14');
    await user.click(within(dialog).getByRole('button', { name: 'Save Requirement' }));

    await waitFor(() => expect(upsertMutateAsync).toHaveBeenCalledTimes(1));
    expect(upsertMutateAsync).toHaveBeenCalledWith({
      label: 'Handbook Acknowledgment',
      category: 'hr',
      satisfiedByKind: 'FORM_SUBMISSION',
      formId: FORM_ID,
      templateKey: null,
      appliesToStates: ['ACTIVE'],
      dueDaysAfterHire: 14,
      isActive: true,
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('switches a default off by saving its override inactive, keeping the label fixed', async () => {
    const user = await openRequirementsTab();
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit Requirement' });

    expect(within(dialog).getByLabelText(/^Label/)).toBeDisabled();
    await user.click(within(dialog).getByRole('checkbox', { name: 'Active' }));
    await user.click(within(dialog).getByRole('button', { name: 'Save Requirement' }));

    await waitFor(() => expect(upsertMutateAsync).toHaveBeenCalledTimes(1));
    expect(upsertMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'Form W-4',
        satisfiedByKind: 'W4_ELECTION',
        formId: null,
        appliesToStates: ['ACTIVE', 'ON_LEAVE'],
        dueDaysAfterHire: 3,
        isActive: false,
      }),
    );
  });

  it('shows the server error and keeps the modal open when the upsert fails', async () => {
    upsertMutateAsync.mockRejectedValueOnce(
      new Error('Not permitted to change employee file requirements'),
    );
    const user = await openRequirementsTab();
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit Requirement' });
    await user.click(within(dialog).getByRole('button', { name: 'Save Requirement' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Not permitted to change employee file requirements',
    );
    expect(screen.getByRole('dialog', { name: 'Edit Requirement' })).toBeInTheDocument();
  });
});
