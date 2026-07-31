import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import type { MhdTask } from '@/features/tasks/Types';
import type { MhdTaskAuditEntry } from '../Types';

const {
  rolesRef,
  profileRef,
  timelineRef,
  getTaskByIdMock,
  mutateAsyncMock,
  mutationDataRef,
  isPendingRef,
} = vi.hoisted(() => ({
  rolesRef: { current: ['Platform Admin'] as MhdAuthRoleName[] },
  profileRef: {
    current: { userId: 'user-1', displayName: 'Harper HR', email: 'harper@fixtures.myhr.local' } as
      | { userId: string; displayName: string | null; email: string }
      | null,
  },
  timelineRef: { current: [] as MhdTaskAuditEntry[] },
  getTaskByIdMock: vi.fn(),
  mutateAsyncMock: vi.fn(),
  mutationDataRef: { current: undefined as { status: string; output_drive_file_id: string | null } | undefined },
  isPendingRef: { current: false },
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ roles: rolesRef.current, profile: profileRef.current }),
}));

vi.mock('@/features/tasks/Service', () => ({
  mhdTaskService: { getTaskById: getTaskByIdMock },
}));

vi.mock('../Hook', () => ({
  useMhdTaskAuditTimeline: () => ({ data: timelineRef.current, isLoading: false, error: null }),
  useMhdRequestTaskAuditReport: () => ({
    mutateAsync: mutateAsyncMock,
    isPending: isPendingRef.current,
    data: mutationDataRef.current,
  }),
}));

const { MhdTaskAuditPage } = await import('../components/MhdTaskAuditPage');

const task: Pick<
  MhdTask,
  | 'id'
  | 'companyId'
  | 'referenceId'
  | 'title'
  | 'assignedDate'
  | 'startDate'
  | 'dueDate'
  | 'completedDate'
  | 'statusName'
> = {
  id: 'task-1' as MhdTask['id'],
  companyId: 'company-1' as MhdTask['companyId'],
  referenceId: 'TASK-000001' as MhdTask['referenceId'],
  title: 'Quarterly filing',
  assignedDate: '2026-07-01',
  startDate: '2026-07-02',
  dueDate: '2026-07-31',
  completedDate: null,
  statusName: 'In Progress',
};

function entry(overrides: Partial<MhdTaskAuditEntry>): MhdTaskAuditEntry {
  return {
    id: 'audit-1',
    entityType: 'TASK',
    entityId: 'task-1',
    actionType: 'FIELD_CHANGED',
    fieldName: 'status_name',
    oldValue: 'Open',
    newValue: 'In Progress',
    summary: null,
    performedBy: 'user-1',
    performedByName: 'Test User',
    performedAt: '2026-07-29T12:00:00.000Z',
    ipAddress: '10.0.0.1',
    userAgent: 'Mozilla/5.0',
    sourceModule: 'TASKS',
    metadata: null,
    ...overrides,
  };
}

/** The page never renders the task title itself (only the static "Task
 *  Audit" header) — waiting for the "Loading task..." placeholder to clear
 *  is the reliable signal that the mocked getTaskById promise has resolved
 *  and the page has settled into its loaded state. */
async function waitForTaskLoaded() {
  await waitFor(() => expect(getTaskByIdMock).toHaveBeenCalled());
  await waitFor(() => expect(screen.queryByText('Loading task...')).not.toBeInTheDocument());
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/tasks/task-1/audit']}>
        <Routes>
          <Route path="/tasks/:taskId/audit" element={<MhdTaskAuditPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  rolesRef.current = ['Platform Admin'];
  profileRef.current = {
    userId: 'user-1',
    displayName: 'Harper HR',
    email: 'harper@fixtures.myhr.local',
  };
  timelineRef.current = [];
  mutationDataRef.current = undefined;
  isPendingRef.current = false;
  getTaskByIdMock.mockResolvedValue(task);
});

describe('MhdTaskAuditPage — timeline rendering', () => {
  it('renders one row per timeline entry with its field-level change', async () => {
    timelineRef.current = [
      entry({ id: 'audit-1', entityType: 'TASK', actionType: 'FIELD_CHANGED' }),
      entry({
        id: 'audit-2',
        entityType: 'NOTE',
        entityId: 'note-1',
        actionType: 'CREATED',
        fieldName: null,
        oldValue: null,
        newValue: null,
        userAgent: 'AuditFixtureAgent/1.0',
        performedAt: '2026-07-28T09:00:00.000Z',
      }),
    ];
    renderPage();

    await waitForTaskLoaded();
    // Row 1: the field-level change renders across its own three columns.
    expect(screen.getByText('status_name')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    // Row 2: a non-field-change event — its null field/old/new render as the
    // "—" placeholder rather than empty cells, and its own user agent proves
    // the second row rendered independently.
    expect(screen.getByText('AuditFixtureAgent/1.0')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3);
  });

  it('shows an empty-state message when there are no entries', async () => {
    timelineRef.current = [];
    renderPage();
    await waitForTaskLoaded();
    expect(
      screen.getByText('No audit entries match the current filters.'),
    ).toBeInTheDocument();
  });
});

describe('MhdTaskAuditPage — filters', () => {
  it('narrows the table to the selected linked entity type', async () => {
    timelineRef.current = [
      entry({ id: 'audit-task', entityType: 'TASK', actionType: 'FIELD_CHANGED' }),
      entry({
        id: 'audit-note',
        entityType: 'NOTE',
        actionType: 'CREATED',
        fieldName: null,
        userAgent: 'AuditFixtureAgent/1.0',
      }),
    ];
    renderPage();
    await waitForTaskLoaded();

    expect(screen.getByText('status_name')).toBeInTheDocument();
    expect(screen.getByText('AuditFixtureAgent/1.0')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Linked Entity'), { target: { value: 'NOTE' } });

    expect(screen.queryByText('status_name')).not.toBeInTheDocument();
    expect(screen.getByText('AuditFixtureAgent/1.0')).toBeInTheDocument();
  });

  it('narrows the table to the selected action type', async () => {
    timelineRef.current = [
      entry({ id: 'audit-1', actionType: 'FIELD_CHANGED' }),
      entry({
        id: 'audit-2',
        actionType: 'CREATED',
        fieldName: null,
        userAgent: 'AuditFixtureAgent/1.0',
      }),
    ];
    renderPage();
    await waitForTaskLoaded();

    fireEvent.change(screen.getByLabelText('Action Type'), { target: { value: 'CREATED' } });

    expect(screen.queryByText('status_name')).not.toBeInTheDocument();
    expect(screen.getByText('AuditFixtureAgent/1.0')).toBeInTheDocument();
  });
});

describe('MhdTaskAuditPage — Generate Report', () => {
  it('triggers the report mutation with the loaded task and the caller display name', async () => {
    renderPage();
    await waitForTaskLoaded();

    fireEvent.click(screen.getByRole('button', { name: /generate report/i }));

    expect(mutateAsyncMock).toHaveBeenCalledWith({
      task,
      generatedByDisplayName: 'Harper HR',
    });
  });

  it('falls back to email when the caller has no display name', async () => {
    profileRef.current = { userId: 'user-1', displayName: null, email: 'harper@fixtures.myhr.local' };
    renderPage();
    await waitForTaskLoaded();

    fireEvent.click(screen.getByRole('button', { name: /generate report/i }));

    expect(mutateAsyncMock).toHaveBeenCalledWith({
      task,
      generatedByDisplayName: 'harper@fixtures.myhr.local',
    });
  });

  it('shows a download link once the report has generated', async () => {
    mutationDataRef.current = { status: 'GENERATED', output_drive_file_id: 'drive-1' };
    renderPage();
    await waitForTaskLoaded();

    expect(screen.getByText('Audit report generated.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Download' })).toHaveAttribute(
      'href',
      'https://drive.google.com/file/d/drive-1/view',
    );
  });

  it('disables the button while the mutation is pending', async () => {
    isPendingRef.current = true;
    renderPage();
    await waitForTaskLoaded();

    expect(screen.getByRole('button', { name: /generating/i })).toBeDisabled();
  });
});

describe('MhdTaskAuditPage — access', () => {
  it('redirects a non-Platform-Admin/HR-Partner caller away from the page', async () => {
    rolesRef.current = ['Client Admin'];
    renderPage();

    expect(screen.queryByText('Task Audit')).not.toBeInTheDocument();
  });
});
