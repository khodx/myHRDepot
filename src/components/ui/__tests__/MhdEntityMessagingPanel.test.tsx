import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { entityThreadQueryMock } = vi.hoisted(() => ({
  entityThreadQueryMock: vi.fn(),
}));

vi.mock('@/features/messaging/Hook', () => ({
  useMhdEntityMessageThread: (input: unknown) => entityThreadQueryMock(input),
}));

vi.mock('@/components/ui/MhdMessageThreadView', () => ({
  MhdMessageThreadView: ({
    threadId,
    currentUserId,
  }: {
    threadId: string | null;
    currentUserId: string | null;
  }) => (
    <div data-testid="thread-view">
      thread:{threadId ?? 'none'} user:{currentUserId ?? 'none'}
    </div>
  ),
}));

const { MhdEntityMessagingPanel } = await import('../MhdEntityMessagingPanel');

describe('MhdEntityMessagingPanel', () => {
  beforeEach(() => {
    entityThreadQueryMock.mockReset();
    entityThreadQueryMock.mockReturnValue({ data: undefined, isLoading: false, error: null });
  });

  it('renders collapsed by default and does not resolve a real thread yet', () => {
    render(
      <MhdEntityMessagingPanel
        entityType="TASK"
        entityId="task-1"
        companyId="company-1"
        currentUserId="user-1"
      />,
    );

    expect(screen.getByRole('button', { name: /show/i })).toBeInTheDocument();
    expect(screen.queryByTestId('thread-view')).not.toBeInTheDocument();
    expect(entityThreadQueryMock).toHaveBeenCalledWith(null);
  });

  it('expands and resolves the thread when Show is clicked', async () => {
    const user = userEvent.setup();
    entityThreadQueryMock.mockReturnValue({ data: 'thread-9', isLoading: false, error: null });

    render(
      <MhdEntityMessagingPanel
        entityType="TASK"
        entityId="task-1"
        companyId="company-1"
        currentUserId="user-1"
      />,
    );

    await user.click(screen.getByRole('button', { name: /show/i }));

    expect(entityThreadQueryMock).toHaveBeenLastCalledWith({
      entityType: 'TASK',
      entityId: 'task-1',
      companyId: 'company-1',
    });
    expect(await screen.findByTestId('thread-view')).toHaveTextContent('thread:thread-9 user:user-1');
  });

  it('renders expanded by default when defaultExpanded is true', () => {
    entityThreadQueryMock.mockReturnValue({ data: 'thread-9', isLoading: false, error: null });

    render(
      <MhdEntityMessagingPanel
        entityType="TASK"
        entityId="task-1"
        companyId="company-1"
        currentUserId="user-1"
        defaultExpanded
      />,
    );

    expect(screen.getByRole('button', { name: /hide/i })).toBeInTheDocument();
    expect(screen.getByTestId('thread-view')).toBeInTheDocument();
  });

  it('shows a loading message while the entity thread is resolving', async () => {
    const user = userEvent.setup();
    entityThreadQueryMock.mockReturnValue({ data: undefined, isLoading: true, error: null });

    render(
      <MhdEntityMessagingPanel
        entityType="TASK"
        entityId="task-1"
        companyId="company-1"
        currentUserId="user-1"
      />,
    );

    await user.click(screen.getByRole('button', { name: /show/i }));
    expect(screen.getByText(/loading messages/i)).toBeInTheDocument();
  });

  it('shows an error message when the entity-thread query fails', async () => {
    const user = userEvent.setup();
    entityThreadQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Unable to get or create the entity message thread: nope'),
    });

    render(
      <MhdEntityMessagingPanel
        entityType="TASK"
        entityId="task-1"
        companyId="company-1"
        currentUserId="user-1"
      />,
    );

    await user.click(screen.getByRole('button', { name: /show/i }));
    expect(screen.getByText(/unable to get or create the entity message thread/i)).toBeInTheDocument();
  });
});
