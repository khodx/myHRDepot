import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';

const { mockUseMhdAuth, mockUseMhdAnnouncements, mockUseMhdActiveAnnouncements } = vi.hoisted(() => ({
  mockUseMhdAuth: vi.fn(),
  mockUseMhdAnnouncements: vi.fn(),
  mockUseMhdActiveAnnouncements: vi.fn(),
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => mockUseMhdAuth(),
}));

vi.mock('../Hook', () => ({
  useMhdAnnouncements: (...args: unknown[]) => mockUseMhdAnnouncements(...args),
  useMhdActiveAnnouncements: (...args: unknown[]) => mockUseMhdActiveAnnouncements(...args),
}));

const { MhdAnnouncementsPage } = await import('../components/MhdAnnouncementsPage');

function mockAuth(roles: MhdAuthRoleName[]) {
  mockUseMhdAuth.mockReturnValue({
    profile: { companyId: 'company-1' },
    roles,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseMhdAnnouncements.mockReturnValue({ data: [], isLoading: false });
  mockUseMhdActiveAnnouncements.mockReturnValue({
    data: [
      {
        id: 'ann-1',
        referenceId: 'ANN-001',
        title: 'Office closed Friday',
        bodyPlainText: 'The office will be closed.',
        publishedAt: '2026-08-19T00:00:00.000Z',
        expiresAt: null,
      },
    ],
    isLoading: false,
  });
});

describe('MhdAnnouncementsPage role gating', () => {
  it('hides the New Announcement affordance for a Client User and shows the published feed', () => {
    mockAuth(['Employee']);

    render(
      <MemoryRouter>
        <MhdAnnouncementsPage />
      </MemoryRouter>,
    );

    expect(screen.queryByText('New Announcement')).not.toBeInTheDocument();
    expect(screen.getByText('Office closed Friday')).toBeInTheDocument();
    expect(screen.getByText('Read')).toBeInTheDocument();
    expect(mockUseMhdActiveAnnouncements).toHaveBeenCalledWith('company-1');
  });

  it('shows the New Announcement affordance and privileged list for HR Partner', () => {
    mockAuth(['HR Partner']);
    mockUseMhdAnnouncements.mockReturnValue({
      data: [
        {
          id: 'ann-2',
          referenceId: 'ANN-002',
          title: 'Draft notice',
          status: 'draft',
          audienceScope: 'company',
          audienceRoles: null,
          publishAt: '2026-08-19T00:00:00.000Z',
          publishedAt: null,
          expiresAt: null,
        },
      ],
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <MhdAnnouncementsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('New Announcement')).toBeInTheDocument();
    expect(screen.getByText('Draft notice')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(mockUseMhdAnnouncements).toHaveBeenCalledWith('company-1');
  });
});
