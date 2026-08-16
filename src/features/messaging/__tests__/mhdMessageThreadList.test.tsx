import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MhdMessageThreadList } from '../components/MhdMessageThreadList';
import type { MhdMessageThreadWithMeta } from '../Types';

const thread: MhdMessageThreadWithMeta = {
  id: 'thread-001',
  referenceId: 'MSGT-000001',
  companyId: 'company-001',
  subject: 'Benefits question',
  threadType: 'DIRECT',
  entityType: null,
  entityId: null,
  createdBy: 'user-001',
  createdAt: '2026-07-01T10:00:00.000Z',
  updatedAt: null,
  lastMessageAt: '2026-07-01T10:05:00.000Z',
  isArchived: false,
  unreadCount: 2,
  participantCount: 3,
  participants: [
    { userId: 'user-001', displayName: 'Priya Natarajan' },
    { userId: 'user-002', displayName: 'Desmond Ashworth' },
    { userId: 'user-003', displayName: 'Renata Oduya' },
  ],
  lastMessageBody: 'Can you review this?',
};

describe('MhdMessageThreadList', () => {
  it('should render a loading state', () => {
    render(
      <MhdMessageThreadList
        threads={[]}
        selectedThreadId={null}
        isLoading
        currentUserId={null}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('Loading conversations...')).toBeInTheDocument();
  });

  it('should render an empty state when there are no threads', () => {
    render(
      <MhdMessageThreadList threads={[]} selectedThreadId={null} currentUserId={null} onSelect={vi.fn()} />,
    );

    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
    expect(screen.getByText('Start a direct message with another user.')).toBeInTheDocument();
  });

  it('should render thread metadata and call onSelect', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <MhdMessageThreadList
        threads={[thread]}
        selectedThreadId={null}
        currentUserId="user-001"
        onSelect={onSelect}
      />,
    );

    expect(screen.getByRole('button', { name: /Benefits question/i })).toBeInTheDocument();
    expect(screen.getByText('Can you review this?')).toBeInTheDocument();
    expect(screen.getByText('Desmond Ashworth, Renata Oduya')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Benefits question/i }));

    expect(onSelect).toHaveBeenCalledWith('thread-001');
  });
});
