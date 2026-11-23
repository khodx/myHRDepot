import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MhdLeaveBenefitObligationStatusControl,
  MhdLeaveSegmentStatusControl,
} from '../components/MhdLeaveWorkflowStatusControls';
import type {
  MhdLeaveWorkflow,
  MhdLeaveSegmentStatus,
  MhdLeaveBenefitObligationStatus,
} from '../WorkflowTypes';
import {
  mhdLeaveDraftServiceMock as drafts,
  mhdRenderWithQueryClient,
  mhdResetLeaveDraftService,
  mhdTestLeaveDraft,
} from './leaveDraftTestKit';

vi.mock('@/features/drafts/Service', async () => ({
  mhdDraftService: (await import('./leaveDraftTestKit')).mhdLeaveDraftServiceMock,
}));

const CASE_ID = '3f8c1d27-6b94-4e05-a2d1-9c7e40b58f63';
const COMPANY_ID = '9b5e2c71-3d84-4f1a-a6c0-58d27e4f1b93';
const scope = { caseId: CASE_ID, companyId: COMPANY_ID };

const segment = (
  status: MhdLeaveSegmentStatus,
  actual_hours: number | null = null,
): MhdLeaveWorkflow['segments'][number] => ({
  id: 'seg-1',
  segment_mode: 'CONTINUOUS',
  start_at: '2026-08-03T08:00:00Z',
  end_at: '2026-08-03T16:00:00Z',
  planned_hours: 8,
  actual_hours,
  status,
  designated_at: null,
});
const obligation = (
  status: MhdLeaveBenefitObligationStatus,
): MhdLeaveWorkflow['benefits'][number] => ({
  id: 'obl-1',
  benefit_type: 'MEDICAL',
  coverage_start: '2026-08-03',
  coverage_end: null,
  employer_amount: 10,
  employee_amount: 2,
  frequency: 'MONTHLY',
  status,
  transactions: [],
  benefit_label: null,
  status_reason: null,
  due_date: null,
  grace_period_days: null,
  continuation_basis: null,
  seniority_credit_through: null,
});

function optionValues(labelText: string) {
  return Array.from(screen.getByLabelText(labelText).querySelectorAll('option')).map(
    (option) => option.value,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mhdResetLeaveDraftService();
});

describe('leave status controls', () => {
  it('hides terminal statuses and offers exact segment transitions in a dialog', () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { rerender } = mhdRenderWithQueryClient(
      <MhdLeaveSegmentStatusControl
        {...scope}
        segment={segment('DENIED')}
        isPending={false}
        onSubmit={onSubmit}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Change Status' })).not.toBeInTheDocument();
    for (const terminal of ['CANCELLED', 'TAKEN'] as const) {
      rerender(
        <MhdLeaveSegmentStatusControl
          {...scope}
          segment={segment(terminal)}
          isPending={false}
          onSubmit={onSubmit}
        />,
      );
      expect(screen.queryByRole('button', { name: 'Change Status' })).not.toBeInTheDocument();
    }
    rerender(
      <MhdLeaveSegmentStatusControl
        {...scope}
        segment={segment('REQUESTED')}
        isPending={false}
        onSubmit={onSubmit}
      />,
    );
    expect(screen.queryByLabelText('New status')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Change Status' }));
    expect(within(screen.getByRole('dialog')).getByLabelText('New status')).toBeInTheDocument();
    expect(optionValues('New status')).toEqual(['APPROVED', 'DENIED', 'CANCELLED', 'TAKEN']);
    rerender(
      <MhdLeaveSegmentStatusControl
        {...scope}
        segment={segment('APPROVED')}
        isPending={false}
        onSubmit={onSubmit}
      />,
    );
    expect(optionValues('New status')).toEqual(['TAKEN', 'CANCELLED']);
  });

  it('prefills and requires taken actual hours, then discards the draft and closes', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    mhdRenderWithQueryClient(
      <MhdLeaveSegmentStatusControl
        {...scope}
        segment={segment('APPROVED')}
        isPending={false}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Change Status' }));
    fireEvent.change(screen.getByLabelText('New status'), { target: { value: 'TAKEN' } });
    expect(screen.getByLabelText('Actual Hours')).toHaveValue(8);
    fireEvent.click(screen.getByRole('button', { name: 'Update Status' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'TAKEN', actualHours: 8 }),
      ),
    );
    await waitFor(() =>
      expect(drafts.discard).toHaveBeenCalledWith(
        'LEAVE_CASE_ACTION',
        `${CASE_ID}:segment-status:seg-1`,
      ),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('saves the typed status and hours as a draft', async () => {
    mhdRenderWithQueryClient(
      <MhdLeaveSegmentStatusControl
        {...scope}
        segment={segment('APPROVED')}
        isPending={false}
        onSubmit={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Change Status' }));
    fireEvent.change(screen.getByLabelText('New status'), { target: { value: 'TAKEN' } });
    fireEvent.change(screen.getByLabelText('Actual Hours'), { target: { value: '6.5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));
    await waitFor(() => expect(drafts.save).toHaveBeenCalledTimes(1));
    expect(drafts.save).toHaveBeenCalledWith(
      expect.objectContaining({
        draftKind: 'LEAVE_CASE_ACTION',
        draftKey: `${CASE_ID}:segment-status:seg-1`,
        companyId: COMPANY_ID,
        payload: { status: 'TAKEN', actualHours: '6.5' },
      }),
    );
  });

  it('resumes a saved draft into the form', async () => {
    drafts.get.mockResolvedValue(
      mhdTestLeaveDraft(`${CASE_ID}:obligation-status:obl-1`, {
        status: 'WAIVED',
        reason: 'Employee declined continuation in writing',
      }),
    );
    mhdRenderWithQueryClient(
      <MhdLeaveBenefitObligationStatusControl
        {...scope}
        obligation={obligation('ACTIVE')}
        isPending={false}
        onSubmit={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Change Status' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Resume Draft' }));
    expect(screen.getByLabelText('New status')).toHaveValue('WAIVED');
    expect(screen.getByLabelText('Reason')).toHaveValue(
      'Employee declined continuation in writing',
    );
  });

  it('shows the refusal and keeps typed values', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Obligation already ended'));
    mhdRenderWithQueryClient(
      <MhdLeaveBenefitObligationStatusControl
        {...scope}
        obligation={obligation('ACTIVE')}
        isPending={false}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Change Status' }));
    expect(optionValues('New status')).toEqual(['PAST_DUE', 'SATISFIED', 'WAIVED', 'ENDED']);
    fireEvent.change(screen.getByLabelText('New status'), { target: { value: 'WAIVED' } });
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'typed reason' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update Status' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'WAIVED', reason: 'typed reason' }),
      ),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('Obligation already ended');
    expect(screen.getByLabelText('Reason')).toHaveValue('typed reason');
    expect(screen.getByLabelText('New status')).toHaveValue('WAIVED');
    expect(drafts.discard).not.toHaveBeenCalled();
  });

  it('offers the exact obligation transitions and hides terminal obligations', () => {
    const onSubmit = vi.fn();
    const { rerender } = mhdRenderWithQueryClient(
      <MhdLeaveBenefitObligationStatusControl
        {...scope}
        obligation={obligation('PAST_DUE')}
        isPending={false}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Change Status' }));
    expect(optionValues('New status')).toEqual(['ACTIVE', 'SATISFIED', 'WAIVED', 'ENDED']);
    rerender(
      <MhdLeaveBenefitObligationStatusControl
        {...scope}
        obligation={obligation('SATISFIED')}
        isPending={false}
        onSubmit={onSubmit}
      />,
    );
    expect(optionValues('New status')).toEqual(['ENDED']);
    rerender(
      <MhdLeaveBenefitObligationStatusControl
        {...scope}
        obligation={obligation('ENDED')}
        isPending={false}
        onSubmit={onSubmit}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Change Status' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Update Status' })).not.toBeInTheDocument();
  });
});
