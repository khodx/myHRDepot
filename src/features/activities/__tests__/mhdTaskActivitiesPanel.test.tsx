import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdActivity, MhdActivityBoardFilters } from '../Types';

const { mockUseMhdActivities } = vi.hoisted(() => ({
  mockUseMhdActivities: vi.fn(),
}));

vi.mock('../Hook', () => ({
  useMhdActivities: (filters: MhdActivityBoardFilters) => mockUseMhdActivities(filters),
}));

const { MhdTaskActivitiesPanel } = await import('../components/MhdTaskActivitiesPanel');

const linkedActivity: MhdActivity = {
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
  isConfidential: false,
  createdAt: '2026-07-18T14:00:00.000Z',
  createdBy: 'user-1',
  updatedAt: '2026-07-18T14:00:00.000Z',
  updatedBy: 'user-1',
  participantDisplayNames: ['Pat Person'],
  subActivityTotalCount: 0,
  subActivityDoneCount: 0,
  noteCount: 2,
  attachmentCount: 1,
};

describe('MhdTaskActivitiesPanel', () => {
  beforeEach(() => {
    mockUseMhdActivities.mockReset();
  });

  it('renders activities linked to the task through the task-scoped board query', () => {
    mockUseMhdActivities.mockReturnValue({
      data: [linkedActivity],
      isLoading: false,
      error: null,
    });

    render(
      <MemoryRouter>
        <MhdTaskActivitiesPanel taskId="task-1" companyId="company-1" />
      </MemoryRouter>,
    );

    expect(mockUseMhdActivities).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: 'company-1', taskId: 'task-1' }),
    );
    expect(screen.getByRole('link', { name: 'Quarterly check-in' })).toHaveAttribute(
      'href',
      '/activities/activity-1',
    );
    expect(screen.getByText('ACTV-000001')).toBeInTheDocument();
  });
});
