import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MhdDocumentQueuePage } from '../components/MhdDocumentQueuePage';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdDismissQueuedDocument,
  useMhdDocumentQueue,
  useMhdGenerateQueuedDocument,
} from '../Hook';

vi.mock('../Hook', () => ({
  useMhdDocumentQueue: vi.fn(),
  useMhdGenerateQueuedDocument: vi.fn(),
  useMhdDismissQueuedDocument: vi.fn(),
}));
vi.mock('@/features/authentication/Hook', () => ({ useMhdAuth: vi.fn() }));

const companyId = crypto.randomUUID();
const queueId = crypto.randomUUID();
const generateMock = { mutate: vi.fn(), isPending: false, variables: undefined, error: null };
const dismissMock = { mutate: vi.fn(), isPending: false, error: null };

interface QueueQueryState {
  data: Array<Record<string, unknown>> | undefined;
  isLoading: boolean;
  error: Error | null;
}

const queuedItem = {
  id: queueId,
  referenceId: 'DOC-2026-0042',
  companyId,
  templateKey: 'ONBOARDING_MASTER',
  templateName: 'New Hire Welcome Packet',
  entityType: 'EMPLOYEE',
  entityId: crypto.randomUUID(),
  subjectPersonId: crypto.randomUUID(),
  subjectPersonName: 'Marisol Alvarez',
  sourceWizard: 'ONBOARDING',
  status: 'QUEUED',
  outputFormat: 'DOCX',
  requiresSignature: true,
  employeeFileCategory: 'hr',
  generationId: null,
  generationStatus: null,
  outputFileName: null,
  outputDriveFileId: null,
  failureReason: null,
  queuedBy: crypto.randomUUID(),
  queuedByName: 'Jordan Kim',
  queuedAt: '2026-09-30T18:30:00.000Z',
  generatedAt: null,
};

function renderPage(
  query: QueueQueryState = { data: [queuedItem], isLoading: false, error: null },
) {
  vi.mocked(useMhdDocumentQueue).mockReturnValue(query as never);
  return render(
    <MemoryRouter>
      <MhdDocumentQueuePage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useMhdAuth).mockReturnValue({ profile: { companyId }, roles: [] } as never);
  vi.mocked(useMhdGenerateQueuedDocument).mockReturnValue(generateMock as never);
  vi.mocked(useMhdDismissQueuedDocument).mockReturnValue(dismissMock as never);
});

describe('MhdDocumentQueuePage', () => {
  it('shows loading state', () => {
    renderPage({ data: undefined, isLoading: true, error: null });
    expect(screen.getByText('Loading documents…')).toBeInTheDocument();
  });

  it('shows an empty state', () => {
    renderPage({ data: [], isLoading: false, error: null });
    expect(screen.getByText('Nothing waiting')).toBeInTheDocument();
  });

  it('renders mapped labels and queue notes', () => {
    renderPage();
    expect(screen.getByText('New Hire Welcome Packet')).toBeInTheDocument();
    expect(screen.getByText('Onboarding Wizard')).toBeInTheDocument();
    expect(screen.getByText('Employee')).toBeInTheDocument();
    const row = screen.getByText('DOC-2026-0042').closest('tr') as HTMLElement;
    expect(within(row).getByText('Queued')).toBeInTheDocument();
    expect(screen.getByText('Signature required')).toBeInTheDocument();
    expect(screen.getByText('Files to: HR File')).toBeInTheDocument();
  });

  it('shows everything still needing action by default, and asks the server for one status when chosen', () => {
    renderPage({
      data: [
        queuedItem,
        {
          ...queuedItem,
          id: crypto.randomUUID(),
          referenceId: 'DOC-2026-0050',
          status: 'FAILED',
          failureReason: 'The document could not be rendered.',
        },
        {
          ...queuedItem,
          id: crypto.randomUUID(),
          referenceId: 'DOC-2026-0051',
          status: 'GENERATED',
        },
        {
          ...queuedItem,
          id: crypto.randomUUID(),
          referenceId: 'DOC-2026-0052',
          status: 'DISMISSED',
        },
      ],
      isLoading: false,
      error: null,
    });
    expect(vi.mocked(useMhdDocumentQueue)).toHaveBeenLastCalledWith(companyId, { status: 'ALL' });
    expect(screen.getByText('DOC-2026-0042')).toBeInTheDocument();
    expect(screen.getByText('DOC-2026-0050')).toBeInTheDocument();
    expect(screen.getByText('The document could not be rendered.')).toBeInTheDocument();
    expect(screen.queryByText('DOC-2026-0051')).not.toBeInTheDocument();
    expect(screen.queryByText('DOC-2026-0052')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'FAILED' } });
    expect(vi.mocked(useMhdDocumentQueue)).toHaveBeenLastCalledWith(companyId, {
      status: 'FAILED',
    });
  });

  it('generates queued documents with the queue id and entity type', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Generate Now' }));
    expect(generateMock.mutate).toHaveBeenCalledWith({ queueId, entityType: 'EMPLOYEE' });
  });

  it('offers resume generation for generating rows', () => {
    renderPage({ data: [{ ...queuedItem, status: 'GENERATING' }], isLoading: false, error: null });
    fireEvent.click(screen.getByRole('button', { name: 'Resume Generation' }));
    expect(generateMock.mutate).toHaveBeenCalledWith({ queueId, entityType: 'EMPLOYEE' });
    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument();
  });

  it('links generated documents to Drive', () => {
    renderPage({
      data: [
        {
          ...queuedItem,
          status: 'GENERATED',
          outputDriveFileId: 'drive-file-42',
          outputFileName: 'welcome.docx',
        },
      ],
      isLoading: false,
      error: null,
    });
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'GENERATED' } });
    expect(screen.getByRole('link', { name: 'View Document' })).toHaveAttribute(
      'href',
      'https://drive.google.com/file/d/drive-file-42/view',
    );
  });

  it('opens dismiss modal, requires a reason, submits it and closes on success', async () => {
    dismissMock.mutate.mockImplementation((_input: unknown, options?: { onSuccess?: () => void }) =>
      options?.onSuccess?.(),
    );
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    const submit = screen.getByRole('button', { name: 'Dismiss Document' });
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Duplicate request' } });
    expect(submit).not.toBeDisabled();
    fireEvent.click(submit);
    expect(dismissMock.mutate).toHaveBeenCalledWith(
      { queueId, reason: 'Duplicate request' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Dismiss Document' })).not.toBeInTheDocument(),
    );
  });

  it('keeps the dismiss dialog open when the server refuses', () => {
    dismissMock.mutate.mockImplementation(() => undefined);
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'No longer needed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss Document' }));
    expect(screen.getByRole('button', { name: 'Dismiss Document' })).toBeInTheDocument();
  });

  it('replaces the compliance gate error message', () => {
    renderPage({
      data: [],
      isLoading: false,
      error: new Error('blocked by the pre-live compliance review gate'),
    });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'This document is blocked until its compliance content has been approved. Ask a Platform Admin to review it.',
    );
  });

  it('shows generic errors', () => {
    renderPage({ data: [], isLoading: false, error: new Error('Queue unavailable') });
    expect(screen.getByRole('alert')).toHaveTextContent('Queue unavailable');
  });

  it('does not show actions for dismissed rows', () => {
    renderPage({ data: [{ ...queuedItem, status: 'DISMISSED' }], isLoading: false, error: null });
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'DISMISSED' } });
    expect(screen.getByText('DOC-2026-0042')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Generate Now' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument();
  });
});
