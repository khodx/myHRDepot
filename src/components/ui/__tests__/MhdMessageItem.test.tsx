import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdMessage } from '@/features/messaging/Types';

const { editMutateAsyncMock, deleteMutateMock, sendMutateAsyncMock, repliesDataRef } = vi.hoisted(() => ({
  editMutateAsyncMock: vi.fn(),
  deleteMutateMock: vi.fn(),
  sendMutateAsyncMock: vi.fn(),
  repliesDataRef: { current: [] as MhdMessage[] },
}));

vi.mock('@/features/messaging/Hook', () => ({
  useMhdEditMessage: () => ({ mutateAsync: editMutateAsyncMock, isPending: false }),
  useMhdDeleteMessage: () => ({ mutate: deleteMutateMock, isPending: false }),
  useMhdMessageReplies: () => ({ data: repliesDataRef.current, isLoading: false }),
  useMhdSendMessage: () => ({ mutateAsync: sendMutateAsyncMock, isPending: false }),
}));

const { MhdMessageItem } = await import('../MhdMessageItem');

function buildMessage(overrides: Partial<MhdMessage> = {}): MhdMessage {
  return {
    id: 'message-1',
    referenceId: 'MSG-000001',
    threadId: 'thread-1',
    companyId: 'company-1',
    senderUserId: 'user-2',
    body: 'Hello there',
    isSystem: false,
    createdAt: '2026-08-01T10:00:00.000Z',
    editedAt: null,
    deletedAt: null,
    parentMessageId: null,
    replyCount: 0,
    ...overrides,
  };
}

describe('MhdMessageItem', () => {
  beforeEach(() => {
    editMutateAsyncMock.mockReset();
    deleteMutateMock.mockReset();
    sendMutateAsyncMock.mockReset();
    repliesDataRef.current = [];
  });

  it('renders the message body and sender label', () => {
    render(
      <ul>
        <MhdMessageItem
          message={buildMessage()}
          threadId="thread-1"
          currentUserId="user-1"
          resolveSenderName={() => 'Priya Natarajan'}
          currentUserIsOwner={false}
          canDelete={false}
        />
      </ul>,
    );

    expect(screen.getByText('Hello there')).toBeInTheDocument();
    expect(screen.getByText('Priya Natarajan')).toBeInTheDocument();
  });

  it('labels the sender "You" for the current user\'s own message', () => {
    render(
      <ul>
        <MhdMessageItem
          message={buildMessage({ senderUserId: 'user-1' })}
          threadId="thread-1"
          currentUserId="user-1"
          resolveSenderName={() => 'Should not be used'}
          currentUserIsOwner={false}
          canDelete
        />
      </ul>,
    );

    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('shows Reply and Edit for the sender, and saves an edit', async () => {
    const user = userEvent.setup();
    editMutateAsyncMock.mockResolvedValueOnce(undefined);

    render(
      <ul>
        <MhdMessageItem
          message={buildMessage({ senderUserId: 'user-1', body: 'Original text' })}
          threadId="thread-1"
          currentUserId="user-1"
          resolveSenderName={() => null}
          currentUserIsOwner={false}
          canDelete
        />
      </ul>,
    );

    await user.click(screen.getByRole('button', { name: 'More actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));

    const textarea = screen.getByDisplayValue('Original text');
    await user.clear(textarea);
    await user.type(textarea, 'Updated text');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(editMutateAsyncMock).toHaveBeenCalledWith({
        messageId: 'message-1',
        body: 'Updated text',
        parentMessageId: undefined,
      });
    });
  });

  it('deletes the message via the kebab menu when canDelete is true', async () => {
    const user = userEvent.setup();

    render(
      <ul>
        <MhdMessageItem
          message={buildMessage()}
          threadId="thread-1"
          currentUserId="user-1"
          resolveSenderName={() => 'Priya Natarajan'}
          currentUserIsOwner
          canDelete
        />
      </ul>,
    );

    await user.click(screen.getByRole('button', { name: 'More actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));

    expect(deleteMutateMock).toHaveBeenCalledWith(
      { messageId: 'message-1', parentMessageId: undefined },
      expect.any(Object),
    );
  });

  it('does not show Edit when the current user is not the sender', async () => {
    const user = userEvent.setup();

    render(
      <ul>
        <MhdMessageItem
          message={buildMessage({ senderUserId: 'user-2' })}
          threadId="thread-1"
          currentUserId="user-1"
          resolveSenderName={() => 'Priya Natarajan'}
          currentUserIsOwner
          canDelete
        />
      </ul>,
    );

    await user.click(screen.getByRole('button', { name: 'More actions' }));
    expect(screen.queryByRole('menuitem', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
  });

  it('shows the deleted placeholder, hides Edit/Delete, but keeps Reply available on a deleted top-level message', async () => {
    const user = userEvent.setup();

    render(
      <ul>
        <MhdMessageItem
          message={buildMessage({ senderUserId: 'user-1', deletedAt: '2026-08-01T11:00:00.000Z' })}
          threadId="thread-1"
          currentUserId="user-1"
          resolveSenderName={() => null}
          currentUserIsOwner={false}
          canDelete
        />
      </ul>,
    );

    expect(screen.getByText('Message deleted')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'More actions' }));
    expect(screen.queryByRole('menuitem', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Delete' })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Reply' })).toBeInTheDocument();
  });

  it('renders no actions menu at all for a deleted reply row', () => {
    render(
      <ul>
        <MhdMessageItem
          message={buildMessage({
            id: 'reply-1',
            parentMessageId: 'message-1',
            senderUserId: 'user-1',
            deletedAt: '2026-08-01T11:00:00.000Z',
          })}
          threadId="thread-1"
          currentUserId="user-1"
          resolveSenderName={() => null}
          currentUserIsOwner={false}
          canDelete
          isReply
        />
      </ul>,
    );

    expect(screen.queryByRole('button', { name: 'More actions' })).not.toBeInTheDocument();
  });

  it('expands the subthread and lists replies when Reply is clicked', async () => {
    const user = userEvent.setup();
    repliesDataRef.current = [
      buildMessage({ id: 'reply-1', parentMessageId: 'message-1', body: 'A reply', senderUserId: 'user-2' }),
    ];

    render(
      <ul>
        <MhdMessageItem
          message={buildMessage({ replyCount: 1 })}
          threadId="thread-1"
          currentUserId="user-1"
          resolveSenderName={() => 'Priya Natarajan'}
          currentUserIsOwner={false}
          canDelete={false}
        />
      </ul>,
    );

    expect(screen.getByRole('button', { name: /1 reply/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'More actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Reply' }));

    expect(await screen.findByText('A reply')).toBeInTheDocument();
  });

  it('does not render a Reply action or subthread toggle on a reply row', async () => {
    const user = userEvent.setup();

    render(
      <ul>
        <MhdMessageItem
          message={buildMessage({ id: 'reply-1', parentMessageId: 'message-1' })}
          threadId="thread-1"
          currentUserId="user-1"
          resolveSenderName={() => 'Priya Natarajan'}
          currentUserIsOwner={false}
          canDelete
          isReply
        />
      </ul>,
    );

    await user.click(screen.getByRole('button', { name: 'More actions' }));
    expect(screen.queryByRole('menuitem', { name: 'Reply' })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /repl(y|ies)/i })).not.toBeInTheDocument();
  });
});
