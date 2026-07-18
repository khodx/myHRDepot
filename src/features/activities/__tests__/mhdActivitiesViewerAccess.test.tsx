import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import type { MhdActivity } from '../Types';

const {
  mockUseMhdActivities,
  mockUseMhdActivity,
  mockUseMhdActivityActions,
  mockUseMhdActivityParticipants,
  mockUseMhdActivityPeople,
  mockUseMhdActivityTasks,
  mockUseMhdActivityUsers,
  mockUseMhdAuth,
  mockUseMhdCompanies,
  mockUseMhdSubActivities,
} = vi.hoisted(() => ({
  mockUseMhdActivities: vi.fn(),
  mockUseMhdActivity: vi.fn(),
  mockUseMhdActivityActions: vi.fn(),
  mockUseMhdActivityParticipants: vi.fn(),
  mockUseMhdActivityPeople: vi.fn(),
  mockUseMhdActivityTasks: vi.fn(),
  mockUseMhdActivityUsers: vi.fn(),
  mockUseMhdAuth: vi.fn(),
  mockUseMhdCompanies: vi.fn(),
  mockUseMhdSubActivities: vi.fn(),
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => mockUseMhdAuth(),
}));

vi.mock('@/features/companies/Hook', () => ({
  useMhdCompanies: (...args: unknown[]) => mockUseMhdCompanies(...args),
}));

vi.mock('../Hook', () => ({
  useMhdActivities: (...args: unknown[]) => mockUseMhdActivities(...args),
  useMhdActivity: (...args: unknown[]) => mockUseMhdActivity(...args),
  useMhdActivityActions: () => mockUseMhdActivityActions(),
  useMhdActivityParticipants: (...args: unknown[]) => mockUseMhdActivityParticipants(...args),
  useMhdActivityPeople: (...args: unknown[]) => mockUseMhdActivityPeople(...args),
  useMhdActivityTasks: (...args: unknown[]) => mockUseMhdActivityTasks(...args),
  useMhdActivityUsers: (...args: unknown[]) => mockUseMhdActivityUsers(...args),
  useMhdSubActivities: (...args: unknown[]) => mockUseMhdSubActivities(...args),
}));

vi.mock('../components/MhdActivityNotesPanel', () => ({
  MhdActivityNotesPanel: ({ readOnly }: { readOnly?: boolean }) => (
    <div>{readOnly ? 'Notes Panel Read Only' : 'Notes Panel Editable'}</div>
  ),
}));

vi.mock('../components/MhdActivityAttachmentsPanel', () => ({
  MhdActivityAttachmentsPanel: ({ readOnly }: { readOnly?: boolean }) => (
    <div>{readOnly ? 'Attachments Panel Read Only' : 'Attachments Panel Editable'}</div>
  ),
}));

const { MhdActivitiesPage } = await import('../components/MhdActivitiesPage');
const { MhdActivityDetailPage } = await import('../components/MhdActivityDetailPage');

const baseActivity: MhdActivity = {
  id: 'activity-1',
  referenceId: 'ACTV-000001',
  companyId: 'company-1',
  companyName: 'Acme Co',
  personId: 'person-1',
  personDisplayName: 'Pat Person',
  parentTaskId: 'task-1',
  activityType: 'MEETING',
  title: 'Quarterly check-in',
  descriptionPlainText: 'Discuss goals',
  descriptionRichText: null,
  status: 'PLANNED',
  scheduledAt: '2026-07-18T15:00:00.000Z',
  occurredAt: null,
  durationMinutes: null,
  location: 'Conference Room',
  outcomeSummary: null,
  followUpTaskId: null,
  isConfidential: true,
  createdAt: '2026-07-18T14:00:00.000Z',
  createdBy: 'user-1',
  updatedAt: '2026-07-18T14:00:00.000Z',
  updatedBy: 'user-1',
  participantDisplayNames: ['Pat Person'],
  subActivityTotalCount: 1,
  subActivityDoneCount: 0,
  noteCount: 2,
  attachmentCount: 1,
};

function mockAuth(roles: MhdAuthRoleName[]) {
  mockUseMhdAuth.mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    userEmail: 'user@myhrdepot.com',
    authUserId: 'auth-user-1',
    profile: {
      userId: 'user-1',
      companyId: 'company-1',
      companyName: 'Acme Co',
      isAdmin: false,
      personId: 'person-1',
      displayName: 'Vera Viewer',
      firstName: 'Vera',
      lastName: 'Viewer',
      email: 'user@myhrdepot.com',
      roleNames: roles,
    },
    roles,
  });
}

function mockActions() {
  return {
    createActivity: { mutateAsync: vi.fn(), isPending: false },
    updateActivity: { mutateAsync: vi.fn(), isPending: false },
    deleteActivity: { mutateAsync: vi.fn(), isPending: false },
    addParticipant: { mutateAsync: vi.fn(), isPending: false },
    removeParticipant: { mutateAsync: vi.fn(), isPending: false },
    createSubActivity: { mutateAsync: vi.fn(), isPending: false },
    updateSubActivity: { mutateAsync: vi.fn(), isPending: false },
    deleteSubActivity: { mutateAsync: vi.fn(), isPending: false },
    createFollowUpTask: { mutateAsync: vi.fn(), isPending: false },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseMhdCompanies.mockReturnValue({ data: [], isLoading: false, error: null });
  mockUseMhdActivities.mockReturnValue({ data: [baseActivity], isLoading: false, error: null });
  mockUseMhdActivity.mockReturnValue({ data: baseActivity, isLoading: false, error: null });
  mockUseMhdActivityParticipants.mockReturnValue({ data: [], isLoading: false, error: null });
  mockUseMhdActivityPeople.mockReturnValue({ data: [], isLoading: false, error: null });
  mockUseMhdActivityTasks.mockReturnValue({ data: [], isLoading: false, error: null });
  mockUseMhdActivityUsers.mockReturnValue({ data: [], isLoading: false, error: null });
  mockUseMhdSubActivities.mockReturnValue({ data: [], isLoading: false, error: null });
  mockUseMhdActivityActions.mockReturnValue(mockActions());
});

describe('MhdActivitiesPage role gating', () => {
  it('hides the create affordance for a Viewer while keeping the board readable', () => {
    mockAuth(['Viewer']);

    render(
      <MemoryRouter>
        <MhdActivitiesPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Activities')).toBeInTheDocument();
    expect(screen.queryByText('New Activity')).not.toBeInTheDocument();
    expect(screen.getByText('Quarterly check-in')).toBeInTheDocument();
  });

  it('shows the create affordance for a Client User', () => {
    mockAuth(['Client User']);

    render(
      <MemoryRouter>
        <MhdActivitiesPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('New Activity')).toBeInTheDocument();
  });
});

describe('MhdActivityDetailPage role gating and confidentiality handling', () => {
  it('keeps detail controls read-only for a Viewer and passes readOnly to notes/attachments panels', () => {
    mockAuth(['Viewer']);

    render(
      <MemoryRouter initialEntries={['/activities/activity-1']}>
        <Routes>
          <Route path="/activities/:activityId" element={<MhdActivityDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Quarterly check-in')).toBeInTheDocument();
    expect(screen.getByText('Confidential')).toBeInTheDocument();
    expect(screen.queryByText('Edit Activity')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    expect(screen.queryByText('Add Participant')).not.toBeInTheDocument();
    expect(screen.queryByText('Mark Completed')).not.toBeInTheDocument();
    expect(screen.queryByText('Create Follow-up Task')).not.toBeInTheDocument();
    expect(screen.getByText('Notes Panel Read Only')).toBeInTheDocument();
    expect(screen.getByText('Attachments Panel Read Only')).toBeInTheDocument();
  });

  it('renders the confidentiality-aware access error when the activity query is denied', () => {
    mockAuth(['Viewer']);
    mockUseMhdActivity.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Activity not found or you do not have access to it.'),
    });

    render(
      <MemoryRouter initialEntries={['/activities/activity-1']}>
        <Routes>
          <Route path="/activities/:activityId" element={<MhdActivityDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Activity not found or you do not have access to it.')).toBeInTheDocument();
    expect(screen.getByText('Back to Activities')).toBeInTheDocument();
  });
});
