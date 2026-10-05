import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';

const hooks = vi.hoisted(() => ({
  useMhdIncompleteProfiles: vi.fn(),
  useMhdProfileSectionDefinitions: vi.fn(),
  useMhdProfileRequirements: vi.fn(),
  useMhdUpsertProfileRequirement: vi.fn(),
  useMhdPersonProfileCompleteness: vi.fn(),
  useMhdPeople: vi.fn(),
  useMhdPersonPhotoUrls: vi.fn(),
  useMhdAuth: vi.fn(),
  useMhdCompanies: vi.fn(),
}));

vi.mock('@/features/people/Hook', () => ({
  useMhdIncompleteProfiles: (...a: unknown[]) => hooks.useMhdIncompleteProfiles(...a),
  useMhdProfileSectionDefinitions: () => hooks.useMhdProfileSectionDefinitions(),
  useMhdProfileRequirements: (...a: unknown[]) => hooks.useMhdProfileRequirements(...a),
  useMhdUpsertProfileRequirement: () => hooks.useMhdUpsertProfileRequirement(),
  useMhdPersonProfileCompleteness: (...a: unknown[]) => hooks.useMhdPersonProfileCompleteness(...a),
  useMhdPeople: (...a: unknown[]) => hooks.useMhdPeople(...a),
  useMhdPersonPhotoUrls: (...a: unknown[]) => hooks.useMhdPersonPhotoUrls(...a),
}));
vi.mock('@/features/authentication/Hook', () => ({ useMhdAuth: () => hooks.useMhdAuth() }));
vi.mock('@/features/companies/Hook', () => ({
  useMhdCompanies: (...a: unknown[]) => hooks.useMhdCompanies(...a),
}));

const { MhdIncompleteProfilesPanel } = await import('../components/MhdIncompleteProfilesPanel');
const { MhdProfileRequirementsPanel } = await import('../components/MhdProfileRequirementsPanel');
const { MhdProfileCompletenessCard } = await import('../components/MhdProfileCompletenessCard');
const { MhdPeoplePage } = await import('../components/MhdPeoplePage');
const { MhdProfileCompletenessError } = await import('../Service');
const { MHD_INCOMPLETE_PROFILES_PAGE_SIZE } = await import('../ProfileCompletenessAccess');

function mockAuth(roles: MhdAuthRoleName[]) {
  hooks.useMhdAuth.mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    profile: { companyId: 'company-1', roleNames: roles },
    roles,
  });
}

const requirement = {
  requirementId: 'r-1',
  companyId: 'company-1',
  relationshipState: 'EMPLOYEE',
  sectionKey: 'address',
  label: 'Home Address',
  isRequired: true,
  isActive: true,
  isOverride: false,
};

function renderWorklist() {
  return (
    <MemoryRouter>
      <MhdIncompleteProfilesPanel companyId="company-1" />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  hooks.useMhdProfileSectionDefinitions.mockReturnValue({
    data: [
      {
        sectionKey: 'emergency_contact',
        label: 'Emergency Contact',
        description: null,
        sortOrder: 1,
      },
      { sectionKey: 'address', label: 'Home Address', description: null, sortOrder: 2 },
    ],
    isError: false,
  });
  hooks.useMhdUpsertProfileRequirement.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  });
  hooks.useMhdCompanies.mockReturnValue({
    data: [{ id: 'company-1', companyName: 'Acme Co' }],
    isError: false,
  });
  hooks.useMhdPeople.mockReturnValue({
    people: [],
    filters: { companyId: 'ALL', searchTerm: '' },
    setFilters: vi.fn(),
    selectedPersonId: null,
    setSelectedPersonId: vi.fn(),
    isLoading: false,
    errorMessage: null,
  });
  hooks.useMhdPersonPhotoUrls.mockReturnValue({ data: {} });
});

describe('MhdIncompleteProfilesPanel', () => {
  it('renders rows with progress and readable missing-section labels', () => {
    hooks.useMhdIncompleteProfiles.mockReturnValue({
      data: [
        {
          personId: 'p-1',
          personName: 'Maria Lopez',
          relationshipState: 'FORMER_EMPLOYEE',
          missingSections: ['emergency_contact', 'unknown_key'],
          requiredTotal: 5,
          requiredComplete: 3,
        },
      ],
      isLoading: false,
      isError: false,
    });

    render(renderWorklist());

    expect(screen.getByRole('link', { name: 'Maria Lopez' })).toHaveAttribute(
      'href',
      '/people/p-1',
    );
    expect(screen.getByText('Former Employee')).toBeInTheDocument();
    expect(screen.getByText('3 of 5 required')).toBeInTheDocument();
    expect(screen.getByText('Emergency Contact')).toBeInTheDocument();
    expect(screen.getByText('unknown_key')).toBeInTheDocument();
    expect(screen.queryByText('emergency_contact')).not.toBeInTheDocument();
    expect(hooks.useMhdIncompleteProfiles).toHaveBeenCalledWith(
      'company-1',
      MHD_INCOMPLETE_PROFILES_PAGE_SIZE,
      0,
    );
  });

  it('shows the empty, loading and error states', () => {
    hooks.useMhdIncompleteProfiles.mockReturnValue({ data: [], isLoading: false, isError: false });
    const { rerender } = render(renderWorklist());
    expect(screen.getByText('No incomplete profiles')).toBeInTheDocument();

    hooks.useMhdIncompleteProfiles.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    rerender(renderWorklist());
    expect(screen.getByText('Loading incomplete profiles...')).toBeInTheDocument();

    hooks.useMhdIncompleteProfiles.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Unable to load incomplete profiles: boom'),
    });
    rerender(renderWorklist());
    expect(screen.getByRole('alert')).toHaveTextContent('boom');
  });

  it('requests the next page when a full page is returned', () => {
    const fullPage = Array.from({ length: MHD_INCOMPLETE_PROFILES_PAGE_SIZE }, (_, index) => ({
      personId: `p-${index}`,
      personName: `Person ${index}`,
      relationshipState: 'EMPLOYEE',
      missingSections: ['address'],
      requiredTotal: 2,
      requiredComplete: 1,
    }));
    hooks.useMhdIncompleteProfiles.mockReturnValue({
      data: fullPage,
      isLoading: false,
      isError: false,
    });

    render(renderWorklist());
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(hooks.useMhdIncompleteProfiles).toHaveBeenLastCalledWith(
      'company-1',
      MHD_INCOMPLETE_PROFILES_PAGE_SIZE,
      MHD_INCOMPLETE_PROFILES_PAGE_SIZE,
    );
  });
});

describe('MhdProfileRequirementsPanel', () => {
  it('lists rules and saves an override through the edit modal', () => {
    const mutate = vi.fn();
    hooks.useMhdUpsertProfileRequirement.mockReturnValue({
      mutate,
      isPending: false,
      isError: false,
      error: null,
    });
    hooks.useMhdProfileRequirements.mockReturnValue({
      data: [
        requirement,
        {
          ...requirement,
          requirementId: 'r-2',
          sectionKey: 'tax',
          label: 'Tax Withholding',
          isOverride: true,
          isRequired: false,
        },
      ],
      isLoading: false,
      isError: false,
    });

    render(<MhdProfileRequirementsPanel companyId="company-1" />);

    expect(screen.getByText('Platform Default')).toBeInTheDocument();
    expect(screen.getByText('Company Override')).toBeInTheDocument();
    expect(screen.getByText('Optional')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit Home Address for Employee' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit Profile Requirement' });
    fireEvent.click(within(dialog).getByLabelText('Required'));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Override' }));

    expect(mutate).toHaveBeenCalledWith(
      {
        companyId: 'company-1',
        relationshipState: 'EMPLOYEE',
        sectionKey: 'address',
        isRequired: false,
        isActive: true,
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it('shows the save error in the modal', () => {
    hooks.useMhdUpsertProfileRequirement.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: new Error('Unable to save profile requirement: denied'),
    });
    hooks.useMhdProfileRequirements.mockReturnValue({
      data: [requirement],
      isLoading: false,
      isError: false,
    });

    render(<MhdProfileRequirementsPanel companyId="company-1" />);
    fireEvent.click(screen.getByRole('button', { name: /Edit Home Address/ }));

    expect(screen.getByRole('alert')).toHaveTextContent('denied');
  });

  it('shows empty and error states', () => {
    hooks.useMhdProfileRequirements.mockReturnValue({ data: [], isLoading: false, isError: false });
    const { rerender } = render(<MhdProfileRequirementsPanel companyId="company-1" />);
    expect(screen.getByText('No profile requirements')).toBeInTheDocument();

    hooks.useMhdProfileRequirements.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('nope'),
    });
    rerender(<MhdProfileRequirementsPanel companyId="company-1" />);
    expect(screen.getByRole('alert')).toHaveTextContent('nope');
  });
});

describe('MhdProfileCompletenessCard', () => {
  it('lists each section with a complete or missing indicator', () => {
    hooks.useMhdPersonProfileCompleteness.mockReturnValue({
      data: [
        {
          sectionKey: 'address',
          label: 'Home Address',
          sortOrder: 2,
          isRequired: true,
          isComplete: false,
        },
        {
          sectionKey: 'emergency_contact',
          label: 'Emergency Contact',
          sortOrder: 1,
          isRequired: true,
          isComplete: true,
        },
      ],
      isLoading: false,
      isError: false,
    });

    render(<MhdProfileCompletenessCard personId="p-1" />);

    expect(screen.getByText('1 of 2 required complete')).toBeInTheDocument();
    expect(screen.getByText('Missing')).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('renders nothing when the server raises 42501', () => {
    hooks.useMhdPersonProfileCompleteness.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new MhdProfileCompletenessError('denied', '42501'),
    });

    const { container } = render(<MhdProfileCompletenessCard personId="p-1" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows other failures as an error', () => {
    hooks.useMhdPersonProfileCompleteness.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new MhdProfileCompletenessError('Unable to load profile completeness: boom', null),
    });

    render(<MhdProfileCompletenessCard personId="p-1" />);

    expect(screen.getByRole('alert')).toHaveTextContent('boom');
  });
});

describe('MhdPeoplePage role gating', () => {
  function renderPage() {
    hooks.useMhdIncompleteProfiles.mockReturnValue({ data: [], isLoading: false, isError: false });
    hooks.useMhdProfileRequirements.mockReturnValue({ data: [], isLoading: false, isError: false });
    return render(
      <MemoryRouter>
        <MhdPeoplePage />
      </MemoryRouter>,
    );
  }

  it.each<MhdAuthRoleName>(['Platform Admin', 'HR Partner', 'HR Admin', 'Client Admin'])(
    'shows the completeness tabs for %s',
    (role) => {
      mockAuth([role]);
      renderPage();

      expect(screen.getByRole('tab', { name: 'Directory' })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('tab', { name: 'Incomplete Profiles' }));
      expect(screen.getByText('No incomplete profiles')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('tab', { name: 'Profile Requirements' }));
      expect(screen.getByText('No profile requirements')).toBeInTheDocument();
    },
  );

  it.each<MhdAuthRoleName>(['Employee', 'Manager', 'Viewer', 'HR Specialist'])(
    'shows no tab strip for %s',
    (role) => {
      mockAuth([role]);
      renderPage();

      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
      expect(screen.getByText('Filter by company')).toBeInTheDocument();
    },
  );

  it('offers a company selector only to a Platform Admin', () => {
    mockAuth(['Platform Admin']);
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: 'Incomplete Profiles' }));
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(hooks.useMhdIncompleteProfiles).toHaveBeenLastCalledWith(
      'company-1',
      MHD_INCOMPLETE_PROFILES_PAGE_SIZE,
      0,
    );
  });

  it('pins an HR Admin to their own company with no selector', () => {
    mockAuth(['HR Admin']);
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: 'Incomplete Profiles' }));
    expect(screen.queryByText('Company')).not.toBeInTheDocument();
    expect(hooks.useMhdIncompleteProfiles).toHaveBeenLastCalledWith(
      'company-1',
      MHD_INCOMPLETE_PROFILES_PAGE_SIZE,
      0,
    );
  });
});
