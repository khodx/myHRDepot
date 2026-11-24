import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const CASE_ID = 'd4b91e60-2c73-4a58-9e1f-6a0c8d35b27e';
const DOC_ID = '8d2f7c19-3a64-4e0b-b5d8-1c9e6a7f3b02';

const { roles, recordAsync, record } = vi.hoisted(() => ({
  roles: { current: [] as string[] },
  recordAsync: vi.fn(),
  record: { current: null as unknown },
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ roles: roles.current, profile: { companyId: null } }),
}));
vi.mock('@/features/attachments/Hook', () => ({
  useMhdAttachments: () => ({
    attachments: [
      {
        id: DOC_ID,
        originalFileName: 'payroll-register-2026.pdf',
        uploadedAt: '2026-11-20T10:00:00Z',
      },
    ],
    isUploading: false,
    uploadAttachment: vi.fn(),
  }),
}));
vi.mock('@/components/ui/MhdAttachmentUploader', () => ({ MhdAttachmentUploader: () => null }));
vi.mock('../WorkflowHook', () => ({
  useMhdLeavePayrollHours: () => ({ data: record.current }),
  useMhdRecordLeavePayrollHours: () => ({ mutateAsync: recordAsync, isPending: false }),
}));

const { MhdLeavePayrollHoursPanel } = await import('../components/MhdLeavePayrollHoursPanel');

beforeEach(() => {
  vi.clearAllMocks();
  record.current = null;
  recordAsync.mockResolvedValue({ ran: true, snapshotId: 's-1', blockers: [] });
});

describe('MhdLeavePayrollHoursPanel', () => {
  it.each(['Client Admin', 'Client User', 'Manager'])('is hidden from %s', (role) => {
    roles.current = [role];
    const { container } = render(<MhdLeavePayrollHoursPanel caseId={CASE_ID} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('is shown to HR Partner with the empty-state requirement', () => {
    roles.current = ['HR Partner'];
    render(<MhdLeavePayrollHoursPanel caseId={CASE_ID} />);
    expect(
      screen.getByText('Payroll hours are required before FMLA/CFRA eligibility can be completed.'),
    ).toBeInTheDocument();
  });

  it('saves the record with the payroll document that is selected', async () => {
    roles.current = ['HR Partner'];
    render(<MhdLeavePayrollHoursPanel caseId={CASE_ID} />);
    fireEvent.change(screen.getByLabelText('12-month hours'), { target: { value: '1412' } });
    fireEvent.change(screen.getByLabelText('Period start'), { target: { value: '2025-11-01' } });
    fireEvent.change(screen.getByLabelText('Period end'), { target: { value: '2026-10-31' } });
    expect(screen.getByLabelText('Payroll document')).toHaveValue(DOC_ID);
    fireEvent.click(screen.getByRole('button', { name: 'Save Payroll Hours' }));
    await waitFor(() =>
      expect(recordAsync).toHaveBeenCalledWith({
        caseId: CASE_ID,
        hoursWorked12Months: 1412,
        periodStart: '2025-11-01',
        periodEnd: '2026-10-31',
        attachmentId: DOC_ID,
        note: null,
      }),
    );
    expect(await screen.findByText('Evaluation updated.')).toBeInTheDocument();
  });

  it('words a blocker in plain language instead of showing its code', async () => {
    roles.current = ['HR Partner'];
    recordAsync.mockResolvedValueOnce({
      ran: false,
      blockers: ['SCHEDULE_ASSIGNMENT_REQUIRED', 'REASON_CODE_REQUIRED'],
    });
    render(<MhdLeavePayrollHoursPanel caseId={CASE_ID} />);
    fireEvent.change(screen.getByLabelText('12-month hours'), { target: { value: '1200' } });
    fireEvent.change(screen.getByLabelText('Period start'), { target: { value: '2025-11-01' } });
    fireEvent.change(screen.getByLabelText('Period end'), { target: { value: '2026-10-31' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Payroll Hours' }));
    expect(await screen.findByText(/no work schedule assigned/i)).toBeInTheDocument();
    expect(screen.getByText(/leave reason is missing/i)).toBeInTheDocument();
    expect(screen.queryByText(/SCHEDULE_ASSIGNMENT_REQUIRED|REASON_CODE_REQUIRED/)).toBeNull();
  });

  it('shows a validation message instead of saving incomplete hours', async () => {
    roles.current = ['HR Admin'];
    render(<MhdLeavePayrollHoursPanel caseId={CASE_ID} />);
    fireEvent.change(screen.getByLabelText('12-month hours'), { target: { value: '9000' } });
    fireEvent.change(screen.getByLabelText('Period start'), { target: { value: '2025-11-01' } });
    fireEvent.change(screen.getByLabelText('Period end'), { target: { value: '2026-10-31' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Payroll Hours' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(recordAsync).not.toHaveBeenCalled();
  });

  it('shows the server refusal', async () => {
    roles.current = ['HR Partner'];
    recordAsync.mockRejectedValueOnce(new Error('Payroll hours can be recorded by HR only.'));
    render(<MhdLeavePayrollHoursPanel caseId={CASE_ID} />);
    fireEvent.change(screen.getByLabelText('12-month hours'), { target: { value: '1200' } });
    fireEvent.change(screen.getByLabelText('Period start'), { target: { value: '2025-11-01' } });
    fireEvent.change(screen.getByLabelText('Period end'), { target: { value: '2026-10-31' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Payroll Hours' }));
    expect(
      await screen.findByText('Payroll hours can be recorded by HR only.'),
    ).toBeInTheDocument();
  });
});
