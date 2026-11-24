import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const COMPANY_ID = '3a9d7e41-5b02-4c68-8f17-d2e60c4b9a13';

const { roles } = vi.hoisted(() => ({ roles: { current: [] as string[] } }));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ roles: roles.current, profile: { companyId: COMPANY_ID } }),
}));
vi.mock('@/features/people/Hook', () => ({
  useMhdPeoplePicker: () => ({ data: [] }),
}));
vi.mock('../Hook', () => ({
  useMhdCompanyWorksites: () => ({
    isLoading: false,
    data: [
      {
        id: 'w-1',
        companyId: COMPANY_ID,
        worksiteName: 'Sacramento Distribution Center',
        addressStreet: '4410 Power Inn Rd',
        addressCity: 'Sacramento',
        addressState: 'CA',
        addressZip: '95826',
        latitude: 38.52,
        longitude: -121.41,
        isActive: true,
      },
    ],
  }),
  useMhdCompanyWorksiteAssignments: () => ({ isLoading: false, data: [] }),
  useMhdSaveWorksite: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useMhdAssignWorksite: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const { MhdCompanyWorksitesPanel } = await import('../components/MhdCompanyWorksitesPanel');

beforeEach(() => vi.clearAllMocks());

describe('MhdCompanyWorksitesPanel', () => {
  it.each(['Client Admin', 'HR Partner', 'HR Admin', 'Platform Admin'])(
    'is visible to %s with the worksite and an Add Worksite button',
    (role) => {
      roles.current = [role];
      render(<MhdCompanyWorksitesPanel companyId={COMPANY_ID} />);
      expect(screen.getAllByText('Sacramento Distribution Center').length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: 'Add Worksite' })).toBeInTheDocument();
    },
  );

  it.each(['Client User', 'Manager', 'Viewer'])('is hidden from %s', (role) => {
    roles.current = [role];
    const { container } = render(<MhdCompanyWorksitesPanel companyId={COMPANY_ID} />);
    expect(container).toBeEmptyDOMElement();
  });
});
