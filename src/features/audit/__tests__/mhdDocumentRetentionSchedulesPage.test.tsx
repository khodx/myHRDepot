import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdRetentionHistoryEvent, MhdRetentionReviewItem } from '../Types';

const { listReviewMock, listHistoryMock, recordMock } = vi.hoisted(() => ({
  listReviewMock: vi.fn(),
  listHistoryMock: vi.fn(),
  recordMock: vi.fn(),
}));

vi.mock('../Service', () => ({
  mhdAuditService: {
    listRetentionReview: listReviewMock,
    listRetentionDecisionHistory: listHistoryMock,
    recordRetentionDecision: recordMock,
  },
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ profile: { companyId: 'company-1' } }),
}));

const { MhdDocumentRetentionSchedulesPage } =
  await import('../components/MhdDocumentRetentionSchedulesPage');

function item(overrides: Partial<MhdRetentionReviewItem> = {}): MhdRetentionReviewItem {
  return {
    scheduleId: 'schedule-1',
    companyId: 'company-1',
    entityType: 'I9_RECORD',
    entityId: 'i9-1',
    personId: 'person-1',
    personName: 'Marisol Quintero',
    retentionBasis: 'IRCA: 3 years from hire or 1 year from termination, whichever is later',
    retentionExpiresAt: '2026-01-15',
    effectiveExpiresAt: '2026-01-15',
    computedAt: '2025-01-15T00:00:00Z',
    dispositionStatus: 'PENDING_REVIEW',
    extendedUntil: null,
    holdReference: null,
    decidedAt: null,
    decidedByName: null,
    decisionReason: null,
    awaitingReview: true,
    blockedReason: null,
    ...overrides,
  };
}

function setRows(awaiting: MhdRetentionReviewItem[], all: MhdRetentionReviewItem[] = awaiting) {
  listReviewMock.mockImplementation(async (_companyId: string, scope: string) =>
    scope === 'awaiting' ? awaiting : all,
  );
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MhdDocumentRetentionSchedulesPage />
    </QueryClientProvider>,
  );
}

const REASON = 'Records requested by outside counsel';

beforeEach(() => {
  vi.clearAllMocks();
  recordMock.mockResolvedValue('event-1');
  listHistoryMock.mockResolvedValue([]);
});

describe('MhdDocumentRetentionSchedulesPage', () => {
  it('describes the page correctly and says disposal never deletes anything', async () => {
    setRows([]);
    renderPage();
    expect(await screen.findByText(/this application never deletes a record/i)).toBeInTheDocument();
    expect(screen.queryByText(/I-9 records only/i)).not.toBeInTheDocument();
  });

  it('shows the awaiting empty state by default', async () => {
    setRows([], []);
    renderPage();
    expect(await screen.findByText('No records are awaiting review.')).toBeInTheDocument();
    expect(listReviewMock).toHaveBeenCalledWith('company-1', 'awaiting');
  });

  it('shows loading and error states', async () => {
    listReviewMock.mockRejectedValue(new Error('Access denied for company company-1'));
    renderPage();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(await screen.findAllByText('Access denied for company company-1')).not.toHaveLength(0);
  });

  it('shows tab counts and switches between the queue and the register', async () => {
    setRows(
      [item()],
      [
        item(),
        item({
          scheduleId: 'schedule-2',
          entityType: 'DISCIPLINE_RECORD',
          personName: 'Tobias Reinholt',
          dispositionStatus: 'DISPOSED',
          awaitingReview: false,
        }),
      ],
    );
    renderPage();

    expect(await screen.findByText('Marisol Quintero')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Awaiting Review/ })).toHaveTextContent('1');
    expect(screen.getByRole('tab', { name: /Register/ })).toHaveTextContent('2');
    expect(screen.getByText('I9 Record')).toBeInTheDocument();
    expect(screen.queryByText('Tobias Reinholt')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Register/ }));
    expect(await screen.findByText('Tobias Reinholt')).toBeInTheDocument();
    expect(screen.getByText('Discipline Record')).toBeInTheDocument();
    expect(screen.getByText('Disposed')).toBeInTheDocument();
  });

  it('offers actions that match each status', async () => {
    setRows(
      [],
      [
        item({ scheduleId: 'a', personName: 'Pending Person' }),
        item({
          scheduleId: 'b',
          personName: 'Held Person',
          dispositionStatus: 'LEGAL_HOLD',
          holdReference: 'Case 24-118',
          awaitingReview: false,
        }),
        item({
          scheduleId: 'c',
          personName: 'Approved Person',
          dispositionStatus: 'APPROVED_FOR_DISPOSAL',
          awaitingReview: false,
        }),
        item({
          scheduleId: 'd',
          personName: 'Disposed Person',
          dispositionStatus: 'DISPOSED',
          awaitingReview: false,
        }),
      ],
    );
    renderPage();
    fireEvent.click(await screen.findByRole('tab', { name: /Register/ }));

    const rowFor = async (name: string) =>
      (await screen.findByText(name)).closest('tr') as HTMLElement;
    const labels = async (name: string) =>
      within(await rowFor(name))
        .getAllByRole('button')
        .map((button) => button.textContent);

    expect(await labels('Pending Person')).toEqual([
      'Extend',
      'Legal Hold',
      'Approve Disposal',
      'History',
    ]);
    expect(await labels('Held Person')).toEqual(['Release Hold', 'History']);
    expect(await labels('Approved Person')).toEqual(['Confirm Disposed', 'Legal Hold', 'History']);
    expect(await labels('Disposed Person')).toEqual(['History']);
    expect(screen.getByText('Hold: Case 24-118')).toBeInTheDocument();
  });

  it('disables Approve Disposal and shows the reason when disposal is blocked', async () => {
    setRows([item({ blockedReason: 'Open investigation INV-2026-014' })]);
    renderPage();
    const approve = await screen.findByRole('button', { name: 'Approve Disposal' });
    expect(approve).toBeDisabled();
    expect(
      screen.getByText(/Disposal blocked: Open investigation INV-2026-014/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Extend' })).toBeEnabled();
  });

  it('rejects a reason shorter than the minimum without calling the server', async () => {
    setRows([item()]);
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Approve Disposal' }));
    fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: 'too short' } });
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Approve Disposal' }),
    );

    expect(await screen.findByText('Enter at least 10 characters.')).toBeInTheDocument();
    expect(recordMock).not.toHaveBeenCalled();
  });

  it('submits Approve Disposal with the reason and says nothing is deleted', async () => {
    setRows([item()]);
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Approve Disposal' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/Nothing is deleted by this application/)).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText(/Reason/), { target: { value: REASON } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Approve Disposal' }));

    await waitFor(() =>
      expect(recordMock).toHaveBeenCalledWith({
        scheduleId: 'schedule-1',
        decision: 'APPROVE_DISPOSAL',
        reason: REASON,
        extendUntil: null,
      }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('requires a future date after the current retention date to extend', async () => {
    setRows([item()]);
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Extend' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/Reason/), { target: { value: REASON } });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Extend' }));
    expect(await within(dialog).findByText('Choose a new retention date.')).toBeInTheDocument();

    fireEvent.change(within(dialog).getByLabelText(/Retain Until/), {
      target: { value: '01012020' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Extend' }));
    expect(
      await within(dialog).findByText('The new retention date must be after today.'),
    ).toBeInTheDocument();
    expect(recordMock).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByLabelText(/Retain Until/), {
      target: { value: '01012099' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Extend' }));
    await waitFor(() =>
      expect(recordMock).toHaveBeenCalledWith({
        scheduleId: 'schedule-1',
        decision: 'EXTEND',
        reason: REASON,
        extendUntil: '2099-01-01',
      }),
    );
  });

  it('places a legal hold with a reference', async () => {
    setRows([item()]);
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Legal Hold' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/Reason \/ Reference/), {
      target: { value: 'Litigation hold, matter 24-118' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Legal Hold' }));
    await waitFor(() =>
      expect(recordMock).toHaveBeenCalledWith({
        scheduleId: 'schedule-1',
        decision: 'HOLD',
        reason: 'Litigation hold, matter 24-118',
        extendUntil: null,
      }),
    );
  });

  it('releases a hold and confirms a disposal', async () => {
    setRows(
      [],
      [
        item({
          scheduleId: 'held',
          personName: 'Held Person',
          dispositionStatus: 'LEGAL_HOLD',
          awaitingReview: false,
        }),
        item({
          scheduleId: 'done',
          personName: 'Approved Person',
          dispositionStatus: 'APPROVED_FOR_DISPOSAL',
          awaitingReview: false,
        }),
      ],
    );
    renderPage();
    fireEvent.click(await screen.findByRole('tab', { name: /Register/ }));

    const heldRow = (await screen.findByText('Held Person')).closest('tr') as HTMLElement;
    fireEvent.click(within(heldRow).getByRole('button', { name: 'Release Hold' }));
    let dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/Reason/), {
      target: { value: 'Litigation concluded' + '.' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Release Hold' }));
    await waitFor(() =>
      expect(recordMock).toHaveBeenCalledWith({
        scheduleId: 'held',
        decision: 'RELEASE_HOLD',
        reason: 'Litigation concluded.',
        extendUntil: null,
      }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    const doneRow = screen.getByText('Approved Person').closest('tr') as HTMLElement;
    fireEvent.click(within(doneRow).getByRole('button', { name: 'Confirm Disposed' }));
    dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/How Disposal Was Carried Out/), {
      target: { value: 'Cross-cut shredded by vendor, certificate on file' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm Disposed' }));
    await waitFor(() =>
      expect(recordMock).toHaveBeenCalledWith({
        scheduleId: 'done',
        decision: 'CONFIRM_DISPOSED',
        reason: 'Cross-cut shredded by vendor, certificate on file',
        extendUntil: null,
      }),
    );
  });

  it('shows the multi-factor authentication message and keeps the dialog open', async () => {
    setRows([item()]);
    recordMock.mockRejectedValue(new Error('This action requires multi-factor authentication.'));
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Approve Disposal' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/Reason/), { target: { value: REASON } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Approve Disposal' }));

    expect(
      await within(dialog).findByText('This action requires multi-factor authentication.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('opens the decision history for a record', async () => {
    setRows([item()]);
    const events: MhdRetentionHistoryEvent[] = [
      {
        eventId: 'event-1',
        decision: 'EXTEND',
        fromStatus: 'PENDING_REVIEW',
        toStatus: 'EXTENDED',
        reason: 'Audit pending',
        effectiveExpiryBefore: '2026-01-15',
        extendedUntil: '2027-01-15',
        actorEmail: 'priya@example.org',
        createdAt: '2026-10-01T10:00:00Z',
      },
    ];
    listHistoryMock.mockResolvedValue(events);
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'History' }));

    const dialog = screen.getByRole('dialog');
    expect(await within(dialog).findByText('Audit pending')).toBeInTheDocument();
    expect(within(dialog).getByText('Extend')).toBeInTheDocument();
    expect(within(dialog).getByText(/priya@example.org/)).toBeInTheDocument();
    expect(listHistoryMock).toHaveBeenCalledWith('schedule-1');
  });

  it('shows an empty history state', async () => {
    setRows([item()]);
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'History' }));
    expect(
      await screen.findByText('No decisions have been recorded for this record.'),
    ).toBeInTheDocument();
  });
});
