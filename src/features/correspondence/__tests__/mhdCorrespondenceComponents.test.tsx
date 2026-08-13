import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MhdCorrespondenceComposer } from '../components/MhdCorrespondenceComposer';
import { MhdCorrespondenceThreadList } from '../components/MhdCorrespondenceThreadList';
import { MhdLinkCorrespondenceThreadDialog } from '../components/MhdLinkCorrespondenceThreadDialog';
import { MhdNewCorrespondenceDialog } from '../components/MhdNewCorrespondenceDialog';
import type { MhdCorrespondenceMessage, MhdCorrespondenceThreadWithPreview } from '../Types';

const { mockSendMutateAsync, mockLinkMutateAsync } = vi.hoisted(() => ({
  mockSendMutateAsync: vi.fn(),
  mockLinkMutateAsync: vi.fn(),
}));

vi.mock('../Hook', () => ({
  useMhdSendCorrespondence: () => ({ mutateAsync: mockSendMutateAsync, isPending: false }),
  useMhdLinkCorrespondenceThread: () => ({
    mutateAsync: mockLinkMutateAsync,
    isPending: false,
  }),
}));

const thread: MhdCorrespondenceThreadWithPreview = {
  id: 'thread-001',
  referenceId: 'CORT-000001',
  companyId: 'company-001',
  mailboxId: 'mailbox-001',
  subject: 'Benefits question',
  entityType: null,
  entityId: null,
  subjectPersonId: null,
  sensitivityLevel: 'STANDARD',
  origin: 'OUTBOUND',
  isArchived: false,
  createdBy: 'user-001',
  linkedAt: null,
  linkedBy: null,
  createdAt: '2026-07-01T10:00:00.000Z',
  updatedAt: null,
  lastMessageAt: '2026-07-01T10:05:00.000Z',
  lastMessagePreview: 'Can you review this?',
};

const inboundMessage: MhdCorrespondenceMessage = {
  id: 'message-001',
  referenceId: 'CORM-000001',
  threadId: 'thread-001',
  companyId: 'company-001',
  direction: 'INBOUND',
  senderUserId: null,
  senderDisplayName: 'Employee',
  senderEmail: 'employee@example.com',
  recipientEmails: ['hr@example.com'],
  ccEmails: [],
  subject: 'Benefits question',
  bodyText: 'Can you review this?',
  bodyHtml: null,
  externalMessageId: null,
  externalInReplyTo: null,
  externalReferences: null,
  replyToken: null,
  providerMessageId: null,
  status: 'RECEIVED',
  failureReason: null,
  isSystem: false,
  createdAt: '2026-07-01T10:05:00.000Z',
  sentAt: null,
  receivedAt: '2026-07-01T10:05:00.000Z',
};

describe('correspondence components', () => {
  it('renders thread list empty state', () => {
    render(
      <MhdCorrespondenceThreadList
        threads={[]}
        selectedThreadId={null}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('No correspondence yet')).toBeInTheDocument();
  });

  it('renders general-inbox badges and calls onSelect', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <MhdCorrespondenceThreadList
        threads={[thread]}
        selectedThreadId={null}
        showLinkBadges
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Can you review this?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Benefits question/i }));

    expect(onSelect).toHaveBeenCalledWith('thread-001');
  });

  it('submits a new correspondence send body', async () => {
    const user = userEvent.setup();
    mockSendMutateAsync.mockResolvedValueOnce('thread-001');
    const onCreated = vi.fn();

    render(
      <MhdNewCorrespondenceDialog
        open
        companyId="company-001"
        onClose={vi.fn()}
        onCreated={onCreated}
      />,
    );

    await user.type(screen.getByLabelText('To'), 'employee@example.com');
    await user.type(screen.getByLabelText('Subject'), 'Benefits question');
    await user.type(screen.getByLabelText('Message'), 'Hello');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(mockSendMutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      companyId: 'company-001',
      subject: 'Benefits question',
      recipientEmails: ['employee@example.com'],
      bodyText: 'Hello',
    }));
    expect(onCreated).toHaveBeenCalledWith('thread-001');
  });

  it('submits a reply with the parent message id', async () => {
    const user = userEvent.setup();
    mockSendMutateAsync.mockResolvedValueOnce('thread-001');

    render(<MhdCorrespondenceComposer threadId="thread-001" lastMessage={inboundMessage} />);

    await user.type(screen.getByLabelText('Reply'), 'Following up');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(mockSendMutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      threadId: 'thread-001',
      recipientEmails: ['employee@example.com'],
      bodyText: 'Following up',
      inReplyToMessageId: 'message-001',
    }));
  });

  it('links a general thread using the fixed target select and pasted id', async () => {
    const user = userEvent.setup();
    mockLinkMutateAsync.mockResolvedValueOnce({});
    const onClose = vi.fn();

    render(
      <MhdLinkCorrespondenceThreadDialog
        open
        threadId="thread-001"
        onClose={onClose}
      />,
    );

    await user.selectOptions(screen.getByLabelText('Record type'), 'LEAVE_CASE');
    await user.type(screen.getByLabelText('Record ID'), 'leave-001');
    await user.click(screen.getByRole('button', { name: 'Link' }));

    expect(mockLinkMutateAsync).toHaveBeenCalledWith({
      entityType: 'LEAVE_CASE',
      entityId: 'leave-001',
    });
    expect(onClose).toHaveBeenCalled();
  });
});
