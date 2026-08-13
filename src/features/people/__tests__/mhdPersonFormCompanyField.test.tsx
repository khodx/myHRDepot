import { fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdCompany } from '@/features/companies/Types';
import type { MhdPerson } from '../Types';
import { MhdPersonForm } from '../components/MhdPersonForm';

const { mockUseMhdPeoplePicker } = vi.hoisted(() => ({
  mockUseMhdPeoplePicker: vi.fn(),
}));

vi.mock('../Hook', () => ({
  useMhdPeoplePicker: (...args: unknown[]) => mockUseMhdPeoplePicker(...args),
}));

const COMPANIES: MhdCompany[] = [
  {
    id: 'company-simplyhr',
    referenceId: 'COMP-0001',
    companyName: 'SimplyHR',
    industry: null,
    employeeCount: null,
    headquartersLocation: null,
    createdAt: '',
    createdBy: '',
    updatedAt: '',
    updatedBy: '',
  },
  {
    id: 'company-acme',
    referenceId: 'COMP-0002',
    companyName: 'Acme Corp',
    industry: null,
    employeeCount: null,
    headquartersLocation: null,
    createdAt: '',
    createdBy: '',
    updatedAt: '',
    updatedBy: '',
  },
];

function person(overrides: Partial<MhdPerson>): MhdPerson {
  return {
    id: 'person-1',
    referenceId: 'PERS-0001',
    companyId: 'company-acme',
    companyName: 'Acme Corp',
    firstName: 'Jordan',
    middleName: null,
    lastName: 'Smith',
    preferredName: null,
    displayName: 'Jordan Smith',
    primaryEmail: null,
    primaryPhone: null,
    primaryMobile: null,
    createdAt: '',
    createdBy: '',
    updatedAt: '',
    updatedBy: '',
    ...overrides,
  };
}

const noop = {
  onCreate: vi.fn(),
  onUpdate: vi.fn(),
  onCancel: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUseMhdPeoplePicker.mockReturnValue({ data: [] });
});

function renderForm(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('MhdPersonForm — Company field default / read-only behavior', () => {
  it('defaults a new person to the current user company and locks it when canEditCompany is false', () => {
    renderForm(
      <MhdPersonForm
        companies={COMPANIES}
        person={null}
        currentUserCompanyId="company-acme"
        canEditCompany={false}
        {...noop}
      />,
    );

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /select company/i })).toBeNull();
  });

  it('defaults a new person to the first company and renders an editable searchable select when canEditCompany is true', () => {
    renderForm(
      <MhdPersonForm
        companies={COMPANIES}
        person={null}
        currentUserCompanyId="company-acme"
        canEditCompany
        {...noop}
      />,
    );

    expect(screen.getByRole('button', { name: 'Company' })).toHaveTextContent('SimplyHR');
  });

  it('keeps an existing person on their own company (not the viewer company) while locked', () => {
    renderForm(
      <MhdPersonForm
        companies={COMPANIES}
        person={person({ companyId: 'company-acme', companyName: 'Acme Corp' })}
        currentUserCompanyId="company-simplyhr"
        canEditCompany={false}
        {...noop}
      />,
    );

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.queryByText('SimplyHR')).toBeNull();
  });

  it('lets a platform-org user reassign an existing person to a different company', () => {
    renderForm(
      <MhdPersonForm
        companies={COMPANIES}
        person={person({ companyId: 'company-acme', companyName: 'Acme Corp' })}
        currentUserCompanyId="company-simplyhr"
        canEditCompany
        {...noop}
      />,
    );

    expect(screen.getByRole('button', { name: 'Company' })).toHaveTextContent('Acme Corp');
  });
});

describe('MhdPersonForm — Manager field behavior', () => {
  it('excludes the person currently being edited from Manager options', () => {
    mockUseMhdPeoplePicker.mockReturnValue({
      data: [
        {
          id: 'person-1',
          referenceId: 'PERS-0001',
          displayName: 'Jordan Smith',
          primaryEmail: 'jordan@example.com',
        },
        {
          id: 'person-2',
          referenceId: 'PERS-0002',
          displayName: 'Robin Manager',
          primaryEmail: 'robin@example.com',
        },
      ],
    });

    renderForm(
      <MhdPersonForm
        companies={COMPANIES}
        person={person({ id: 'person-1', displayName: 'Jordan Smith' })}
        currentUserCompanyId="company-acme"
        canEditCompany
        {...noop}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Manager' }));

    const managerOptions = screen.getByRole('listbox');
    expect(within(managerOptions).queryByRole('option', { name: /Jordan Smith/i })).toBeNull();
    expect(
      within(managerOptions).getByRole('option', { name: /Robin Manager/i }),
    ).toBeInTheDocument();
  });

  it('renders the Manager field read-only when canEditCompany is false', () => {
    mockUseMhdPeoplePicker.mockReturnValue({
      data: [
        {
          id: 'person-2',
          referenceId: 'PERS-0002',
          displayName: 'Robin Manager',
          primaryEmail: 'robin@example.com',
        },
      ],
    });

    renderForm(
      <MhdPersonForm
        companies={COMPANIES}
        person={person({ managerId: 'person-2', managerDisplayName: 'Robin Manager' })}
        currentUserCompanyId="company-acme"
        canEditCompany={false}
        {...noop}
      />,
    );

    expect(screen.getByText('Robin Manager')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Manager' })).toBeNull();
  });

  it('renders and selects the current manager fallback when the manager is not in the picker page', () => {
    mockUseMhdPeoplePicker.mockReturnValue({
      data: [
        {
          id: 'person-3',
          referenceId: 'PERS-0003',
          displayName: 'Alex Peer',
          primaryEmail: 'alex@example.com',
        },
      ],
    });

    renderForm(
      <MhdPersonForm
        companies={COMPANIES}
        person={person({ managerId: 'person-2', managerDisplayName: 'Robin Manager' })}
        currentUserCompanyId="company-acme"
        canEditCompany
        {...noop}
      />,
    );

    expect(screen.getByRole('button', { name: 'Manager' })).toHaveTextContent('Robin Manager');

    fireEvent.click(screen.getByRole('button', { name: 'Manager' }));

    expect(screen.getByRole('option', { name: 'Robin Manager' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});
