import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mhdNeedsSignatureRequest,
  type MhdHandbookAckStatusRow,
  type MhdMyAcknowledgment,
} from '../Types';

const mocks = vi.hoisted(() => ({
  board: { data: [] as unknown[], isLoading: false },
  my: { data: [] as unknown[], isLoading: false },
  assignMutate: vi.fn(),
  signatureMutate: vi.fn(),
  acknowledgeMutate: vi.fn(),
}));

vi.mock('../Hook', () => ({
  useMhdHandbookAckStatus: () => mocks.board,
  useMhdHandbookPeople: () => ({ data: [{ id: 'p-new', displayName: 'New Hire' }] }),
  useMhdAssignAcknowledgment: () => ({
    mutateAsync: mocks.assignMutate,
    isPending: false,
    isError: false,
    error: null,
  }),
  useMhdRequestAcknowledgmentSignature: () => ({
    mutateAsync: mocks.signatureMutate,
    isPending: false,
  }),
  useMhdMyAcknowledgments: () => mocks.my,
  useMhdAcknowledgeHandbook: () => ({
    mutate: mocks.acknowledgeMutate,
    isPending: false,
    isError: false,
    error: null,
  }),
  useMhdHandbookVersion: () => ({ data: null, isLoading: false, isError: false, error: null }),
}));
vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ profile: { userId: 'admin-1', companyId: 'company-1' } }),
}));
vi.mock('../components/MhdHandbookPdfDownloadButton', () => ({
  MhdHandbookPdfDownloadButton: () => null,
}));

const { MhdHandbookAckBoard } = await import('../components/MhdHandbookAckBoard');
const { MhdMyHandbooksPage } = await import('../components/MhdMyHandbooksPage');

function boardRow(overrides: Partial<MhdHandbookAckStatusRow>): MhdHandbookAckStatusRow {
  return {
    id: 'ack-1',
    personId: 'p-1',
    personDisplayName: 'Alex Rivera',
    status: 'PENDING',
    acknowledgedAt: null,
    dueAt: null,
    esignatureRequestId: null,
    esignatureStatus: null,
    ...overrides,
  } as MhdHandbookAckStatusRow;
}

function myAck(overrides: Partial<MhdMyAcknowledgment>): MhdMyAcknowledgment {
  return {
    id: 'ack-1',
    handbookVersionId: 'ver-1',
    handbookTitle: '2026 Employee Handbook',
    handbookType: 'EMPLOYEE',
    versionNumber: 1,
    status: 'PENDING',
    esignatureRequestId: null,
    acknowledgedAt: null,
    dueAt: null,
    requiresSignature: true,
    ...overrides,
  } as MhdMyAcknowledgment;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.board.data = [];
  mocks.my.data = [];
});

describe('mhdNeedsSignatureRequest', () => {
  it('needs one when pending with no request, or when the last request ended unsigned', () => {
    expect(
      mhdNeedsSignatureRequest({
        status: 'PENDING',
        esignatureRequestId: null,
        esignatureStatus: null,
      }),
    ).toBe(true);
    for (const ended of ['DECLINED', 'VOIDED', 'EXPIRED']) {
      expect(
        mhdNeedsSignatureRequest({
          status: 'PENDING',
          esignatureRequestId: 'r-1',
          esignatureStatus: ended,
        }),
      ).toBe(true);
    }
  });

  it('does not need one while a request is live or complete, or once acknowledged', () => {
    for (const live of ['PENDING', 'IN_PROGRESS', 'COMPLETED']) {
      expect(
        mhdNeedsSignatureRequest({
          status: 'PENDING',
          esignatureRequestId: 'r-1',
          esignatureStatus: live,
        }),
      ).toBe(false);
    }
    expect(
      mhdNeedsSignatureRequest({
        status: 'ACKNOWLEDGED',
        esignatureRequestId: null,
        esignatureStatus: null,
      }),
    ).toBe(false);
  });
});

describe('MhdHandbookAckBoard — signature ceremony', () => {
  it('offers no signature controls when the handbook does not require one', () => {
    mocks.board.data = [boardRow({})];
    render(
      <MhdHandbookAckBoard companyId="company-1" versionId="ver-1" requiresSignature={false} />,
    );

    expect(screen.queryByText(/signature/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /request signature/i })).toBeNull();
    expect(screen.getByRole('button', { name: /^assign$/i })).toBeInTheDocument();
  });

  it('sends the receipt request for the new acknowledgment right after assigning', async () => {
    mocks.assignMutate.mockResolvedValueOnce({ id: 'ack-new', referenceId: 'HBA-1' });
    mocks.signatureMutate.mockResolvedValueOnce({
      esignatureRequestId: 'sig-1',
      invitationErrors: [],
    });
    render(<MhdHandbookAckBoard companyId="company-1" versionId="ver-1" requiresSignature />);

    fireEvent.change(screen.getByLabelText(/assign to/i), { target: { value: 'p-new' } });
    fireEvent.click(screen.getByRole('button', { name: /assign & request signature/i }));

    await waitFor(() =>
      expect(mocks.signatureMutate).toHaveBeenCalledWith({
        ackId: 'ack-new',
        companyId: 'company-1',
        personId: 'p-new',
        actorUserId: 'admin-1',
      }),
    );
    // Assigning does not pass any pre-made signature request: the receipt needs the row first.
    expect(mocks.assignMutate).toHaveBeenCalledWith({ versionId: 'ver-1', personId: 'p-new' });
  });

  it('keeps the assignment and says the signature request was not sent when that step fails', async () => {
    mocks.assignMutate.mockResolvedValueOnce({ id: 'ack-new', referenceId: 'HBA-1' });
    mocks.signatureMutate.mockRejectedValueOnce(new Error('Template not found'));
    render(<MhdHandbookAckBoard companyId="company-1" versionId="ver-1" requiresSignature />);

    fireEvent.change(screen.getByLabelText(/assign to/i), { target: { value: 'p-new' } });
    fireEvent.click(screen.getByRole('button', { name: /assign & request signature/i }));

    expect(
      await screen.findByText(
        /assigned, but the signature request was not sent: template not found/i,
      ),
    ).toBeInTheDocument();
  });

  it('shows signature status per row and a send control only where one is needed', () => {
    mocks.board.data = [
      boardRow({ id: 'a', personDisplayName: 'Jordan Blake' }),
      boardRow({
        id: 'b',
        personDisplayName: 'Morgan Chen',
        esignatureRequestId: 'r-b',
        esignatureStatus: 'PENDING',
      }),
      boardRow({
        id: 'c',
        personDisplayName: 'Taylor Reed',
        esignatureRequestId: 'r-c',
        esignatureStatus: 'DECLINED',
      }),
      boardRow({
        id: 'd',
        personDisplayName: 'Sam Ortiz',
        status: 'ACKNOWLEDGED',
        esignatureRequestId: 'r-d',
        esignatureStatus: 'COMPLETED',
      }),
    ];
    render(<MhdHandbookAckBoard companyId="company-1" versionId="ver-1" requiresSignature />);

    const rowOf = (name: string) => screen.getByText(name).closest('tr') as HTMLElement;
    expect(
      within(rowOf('Jordan Blake')).getByRole('button', { name: /request signature/i }),
    ).toBeInTheDocument();
    expect(
      within(rowOf('Taylor Reed')).getByRole('button', { name: /send again/i }),
    ).toBeInTheDocument();
    expect(within(rowOf('Morgan Chen')).queryByRole('button')).toBeNull();
    expect(within(rowOf('Sam Ortiz')).queryByRole('button')).toBeNull();
    // The row shows two statuses: the acknowledgment's and the signature's, both pending.
    expect(within(rowOf('Morgan Chen')).getAllByText('Pending')).toHaveLength(2);
    expect(within(rowOf('Sam Ortiz')).getByText('Completed')).toBeInTheDocument();
    expect(within(rowOf('Jordan Blake')).getByText('Not sent')).toBeInTheDocument();
  });

  it('sends every missing request one at a time and reports the ones that fail', async () => {
    mocks.board.data = [
      boardRow({ id: 'a', personId: 'p-a', personDisplayName: 'First Person' }),
      boardRow({ id: 'b', personId: 'p-b', personDisplayName: 'Second Person' }),
      boardRow({
        id: 'c',
        personId: 'p-c',
        personDisplayName: 'Has One',
        esignatureRequestId: 'r-c',
        esignatureStatus: 'PENDING',
      }),
    ];
    mocks.signatureMutate
      .mockResolvedValueOnce({ esignatureRequestId: 's-a', invitationErrors: [] })
      .mockRejectedValueOnce(new Error('has no primary email on record'));
    render(<MhdHandbookAckBoard companyId="company-1" versionId="ver-1" requiresSignature />);

    expect(
      screen.getByText(/2 pending acknowledgments have no live signature request/i),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /send all missing requests/i }));

    expect(
      await screen.findByText(/second person: has no primary email on record/i),
    ).toBeInTheDocument();
    expect(mocks.signatureMutate).toHaveBeenCalledTimes(2);
    expect(mocks.signatureMutate.mock.calls.map((call) => call[0].ackId)).toEqual(['a', 'b']);
  });
});

describe('MhdMyHandbooksPage — signature states', () => {
  it('says HR has not sent the request yet, and will not let the employee acknowledge', () => {
    mocks.my.data = [myAck({ requiresSignature: true, esignatureRequestId: null })];
    render(<MhdMyHandbooksPage />);

    expect(screen.getByText(/hr has not sent your signature request yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^acknowledge$/i })).toBeDisabled();
  });

  it('points to the emailed link once a request exists, and leaves the server to gate completion', () => {
    mocks.my.data = [myAck({ requiresSignature: true, esignatureRequestId: 'r-1' })];
    render(<MhdMyHandbooksPage />);

    expect(screen.getByText(/check your email for the signing link/i)).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /^acknowledge$/i });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(mocks.acknowledgeMutate).toHaveBeenCalledWith({ ackId: 'ack-1' });
  });

  it('shows no signature messaging when the handbook does not require one', () => {
    mocks.my.data = [myAck({ requiresSignature: false, esignatureRequestId: null })];
    render(<MhdMyHandbooksPage />);

    expect(screen.queryByText(/signature is required/i)).toBeNull();
    expect(screen.getByRole('button', { name: /^acknowledge$/i })).toBeEnabled();
  });
});
