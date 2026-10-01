import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mhdIsAcknowledgmentOverdue, type MhdHandbook } from '../Types';

const { policyMutate, generateMutate, templateState } = vi.hoisted(() => ({
  policyMutate: vi.fn(),
  generateMutate: vi.fn(),
  templateState: { data: 'tpl-1' as string | null | undefined, isSuccess: true },
}));

vi.mock('../Hook', () => ({
  useMhdSetHandbookAckPolicy: () => ({
    mutateAsync: policyMutate,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ profile: { userId: 'user-1', companyId: 'company-1' } }),
}));

vi.mock('@/features/documents/Hook', () => ({
  useMhdDocumentTemplateIdByKey: () => templateState,
  useMhdDocumentGenerationActions: () => ({
    generate: { mutateAsync: generateMutate, isPending: false, isError: false, error: null },
  }),
}));

const { MhdHandbookAckPolicyCard } = await import('../components/MhdHandbookAckPolicyCard');
const { MhdHandbookPdfDownloadButton } = await import('../components/MhdHandbookPdfDownloadButton');

const HANDBOOK: MhdHandbook = {
  id: 'hbk-1',
  referenceId: 'HBK-0001' as MhdHandbook['referenceId'],
  handbookType: 'EMPLOYEE',
  title: '2026 Employee Handbook',
  jurisdictions: ['FEDERAL'],
  status: 'PUBLISHED',
  currentVersionId: 'ver-1',
  effectiveDate: null,
  createdAt: '2026-07-20T00:00:00Z',
  acknowledgmentDueDays: 30,
};

beforeEach(() => {
  vi.clearAllMocks();
  templateState.data = 'tpl-1';
  templateState.isSuccess = true;
});

describe('mhdIsAcknowledgmentOverdue', () => {
  const now = new Date('2026-10-01T12:00:00Z');

  it('is overdue only when pending and past the deadline', () => {
    expect(mhdIsAcknowledgmentOverdue('2026-09-30T00:00:00Z', 'PENDING', now)).toBe(true);
    expect(mhdIsAcknowledgmentOverdue('2026-10-01T12:00:00Z', 'PENDING', now)).toBe(true);
  });

  it('is never overdue once acknowledged, before the deadline, or without one', () => {
    expect(mhdIsAcknowledgmentOverdue('2026-09-30T00:00:00Z', 'ACKNOWLEDGED', now)).toBe(false);
    expect(mhdIsAcknowledgmentOverdue('2026-10-15T00:00:00Z', 'PENDING', now)).toBe(false);
    expect(mhdIsAcknowledgmentOverdue(null, 'PENDING', now)).toBe(false);
    expect(mhdIsAcknowledgmentOverdue('not a date', 'PENDING', now)).toBe(false);
  });
});

describe('MhdHandbookAckPolicyCard', () => {
  it('shows the current deadline and keeps Save disabled until it changes', () => {
    render(<MhdHandbookAckPolicyCard handbook={HANDBOOK} canManage />);

    expect(screen.getByLabelText(/acknowledgment deadline/i)).toHaveValue(30);
    expect(screen.getByRole('button', { name: /save deadline/i })).toBeDisabled();
  });

  it('saves a valid new deadline', async () => {
    policyMutate.mockResolvedValueOnce(undefined);
    render(<MhdHandbookAckPolicyCard handbook={HANDBOOK} canManage />);

    fireEvent.change(screen.getByLabelText(/acknowledgment deadline/i), {
      target: { value: '14' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save deadline/i }));

    await waitFor(() =>
      expect(policyMutate).toHaveBeenCalledWith({ handbookId: 'hbk-1', dueDays: 14 }),
    );
  });

  it('refuses a deadline outside 1–365 days, or a non-whole number, before calling the server', () => {
    render(<MhdHandbookAckPolicyCard handbook={HANDBOOK} canManage />);
    const input = screen.getByLabelText(/acknowledgment deadline/i);
    const save = screen.getByRole('button', { name: /save deadline/i });

    for (const bad of ['0', '366', '2.5', '']) {
      fireEvent.change(input, { target: { value: bad } });
      expect(save).toBeDisabled();
    }
    expect(screen.getByText(/whole number of days from 1 to 365/i)).toBeInTheDocument();
    expect(policyMutate).not.toHaveBeenCalled();
  });

  it('is read-only without the manage affordance', () => {
    render(<MhdHandbookAckPolicyCard handbook={HANDBOOK} canManage={false} />);

    expect(screen.getByLabelText(/acknowledgment deadline/i)).toBeDisabled();
    expect(screen.queryByRole('button', { name: /save deadline/i })).toBeNull();
  });
});

describe('MhdHandbookPdfDownloadButton', () => {
  it('requests a PDF of exactly this version, never Word, and then offers the file', async () => {
    generateMutate.mockResolvedValueOnce({ output_drive_file_id: 'file-1' });
    render(<MhdHandbookPdfDownloadButton versionId="ver-9" />);

    fireEvent.click(screen.getByRole('button', { name: /download pdf/i }));

    await waitFor(() =>
      expect(generateMutate).toHaveBeenCalledWith({
        templateId: 'tpl-1',
        companyId: 'company-1',
        entityType: 'HANDBOOK_VERSION',
        entityId: 'ver-9',
        mergeData: {},
        outputFormat: 'PDF',
      }),
    );
    const link = await screen.findByRole('link', { name: /open pdf/i });
    expect(link).toHaveAttribute('href', 'https://drive.google.com/file/d/file-1/view');
  });

  it('says the file is still being prepared when the wait ran out, instead of failing', async () => {
    generateMutate.mockResolvedValueOnce({ output_drive_file_id: null });
    render(<MhdHandbookPdfDownloadButton versionId="ver-9" />);

    fireEvent.click(screen.getByRole('button', { name: /download pdf/i }));

    expect(await screen.findByText(/still being prepared/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /open pdf/i })).toBeNull();
  });

  it('renders nothing when the company has no handbook template', () => {
    templateState.data = null;
    const { container } = render(<MhdHandbookPdfDownloadButton versionId="ver-9" />);

    expect(container).toBeEmptyDOMElement();
  });
});
