import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MhdPlatformUser } from '../Types';

// MhdUserForm pulls companies via react-query (useMhdCompanies) and people via
// a local-state hook (useMhdPeople); mock both so the form renders against
// controlled data with no network / query client.
const { companiesMock, peopleMock } = vi.hoisted(() => ({
  companiesMock: vi.fn(),
  peopleMock: vi.fn(),
}));

vi.mock('@/features/companies/Hook', () => ({
  useMhdCompanies: companiesMock,
}));

vi.mock('@/features/people/Hook', () => ({
  useMhdPeople: peopleMock,
}));

const { MhdUserForm } = await import('../components/MhdUserForm');

const COMPANIES = [
  { id: 'company-simplyhr', companyName: 'SimplyHR' },
  { id: 'company-acme', companyName: 'Acme Corp' },
];

function user(overrides: Partial<MhdPlatformUser>): MhdPlatformUser {
  return {
    id: 'user-1',
    email: 'jordan@acme.test',
    companyId: 'company-acme',
    companyName: 'Acme Corp',
    isAdmin: false,
    personId: null,
    personDisplayName: null,
    deactivatedAt: null,
    deactivatedBy: null,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

const noop = { isSubmitting: false, onSubmit: vi.fn(), onCancel: vi.fn() };

describe('MhdUserForm — Company field read-only behavior', () => {
  it('locks the field to the user own company and does not expose an editable control when canEditCompany is false', () => {
    companiesMock.mockReturnValue({ data: COMPANIES });
    peopleMock.mockReturnValue({ people: [], isLoading: false });

    render(<MhdUserForm user={user({ companyId: 'company-acme' })} canEditCompany={false} {...noop} />);

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Company' })).toBeNull();
  });

  it('exposes an editable searchable select showing the record own company when canEditCompany is true', () => {
    companiesMock.mockReturnValue({ data: COMPANIES });
    peopleMock.mockReturnValue({ people: [], isLoading: false });

    render(<MhdUserForm user={user({ companyId: 'company-acme' })} canEditCompany {...noop} />);

    expect(screen.getByRole('button', { name: 'Company' })).toHaveTextContent('Acme Corp');
  });
});
