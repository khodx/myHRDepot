import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MhdCompany } from '@/features/companies/Types';
import type { MhdPerson } from '../Types';
import { MhdPersonForm } from '../components/MhdPersonForm';

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

describe('MhdPersonForm — Company field default / read-only behavior', () => {
  it('defaults a new person to the current user company and locks it when canEditCompany is false', () => {
    render(
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
    render(
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
    render(
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
    render(
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
