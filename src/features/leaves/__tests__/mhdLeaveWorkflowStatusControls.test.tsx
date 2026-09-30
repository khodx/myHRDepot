import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  MhdLeaveBenefitObligationStatusControl,
  MhdLeaveSegmentStatusControl,
} from '../components/MhdLeaveWorkflowStatusControls';
import type { MhdLeaveWorkflow, MhdLeaveSegmentStatus, MhdLeaveBenefitObligationStatus } from '../WorkflowTypes';

const segment = (status: MhdLeaveSegmentStatus, actual_hours: number | null = null): MhdLeaveWorkflow['segments'][number] => ({
  id: 'seg-1', segment_mode: 'CONTINUOUS', start_at: '2026-08-03T08:00:00Z',
  end_at: '2026-08-03T16:00:00Z', planned_hours: 8, actual_hours, status, designated_at: null,
});
const obligation = (status: MhdLeaveBenefitObligationStatus): MhdLeaveWorkflow['benefits'][number] => ({
  id: 'obl-1', benefit_type: 'MEDICAL', coverage_start: '2026-08-03', coverage_end: null,
  employer_amount: 10, employee_amount: 2, frequency: 'MONTHLY', status, transactions: [],
});

describe('leave status controls', () => {
  it('hides terminal statuses and offers exact segment transitions', () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    const { rerender } = render(<MhdLeaveSegmentStatusControl segment={segment('DENIED')} isPending={false} onSubmit={onSubmit} />);
    expect(screen.queryByRole('button', { name: 'Update Status' })).not.toBeInTheDocument();
    rerender(<MhdLeaveSegmentStatusControl segment={segment('CANCELLED')} isPending={false} onSubmit={onSubmit} />);
    expect(screen.queryByRole('button', { name: 'Update Status' })).not.toBeInTheDocument();
    rerender(<MhdLeaveSegmentStatusControl segment={segment('TAKEN')} isPending={false} onSubmit={onSubmit} />);
    expect(screen.queryByRole('button', { name: 'Update Status' })).not.toBeInTheDocument();
    rerender(<MhdLeaveSegmentStatusControl segment={segment('REQUESTED')} isPending={false} onSubmit={onSubmit} />);
    expect(Array.from(screen.getByLabelText('New status').querySelectorAll('option')).map((option) => option.value)).toEqual(['APPROVED', 'DENIED', 'CANCELLED', 'TAKEN']);
    rerender(<MhdLeaveSegmentStatusControl segment={segment('APPROVED')} isPending={false} onSubmit={onSubmit} />);
    expect(Array.from(screen.getByLabelText('New status').querySelectorAll('option')).map((option) => option.value)).toEqual(['TAKEN', 'CANCELLED']);
  });

  it('prefills and requires taken actual hours, then clears on success', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<MhdLeaveSegmentStatusControl segment={segment('APPROVED')} isPending={false} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('New status'), { target: { value: 'TAKEN' } });
    expect(screen.getByLabelText('Actual Hours')).toHaveValue(8);
    fireEvent.click(screen.getByRole('button', { name: 'Update Status' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ status: 'TAKEN', actualHours: 8 })));
    await waitFor(() => expect(screen.getByLabelText('Actual Hours')).toHaveValue(null));
  });

  it('keeps typed values when submit is rejected', async () => {
    const onSubmit = vi.fn().mockResolvedValue(false);
    render(<MhdLeaveBenefitObligationStatusControl obligation={obligation('ACTIVE')} isPending={false} onSubmit={onSubmit} />);
    expect(Array.from(screen.getByLabelText('New status').querySelectorAll('option')).map((option) => option.value)).toEqual(['PAST_DUE', 'SATISFIED', 'WAIVED', 'ENDED']);
    fireEvent.change(screen.getByLabelText('New status'), { target: { value: 'WAIVED' } });
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'typed reason' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update Status' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ status: 'WAIVED', reason: 'typed reason' })));
    expect(screen.getByLabelText('Reason')).toHaveValue('typed reason');
    expect(screen.getByLabelText('New status')).toHaveValue('WAIVED');
  });

  it('offers the exact obligation transitions and hides terminal obligations', () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    const { rerender } = render(<MhdLeaveBenefitObligationStatusControl obligation={obligation('PAST_DUE')} isPending={false} onSubmit={onSubmit} />);
    expect(Array.from(screen.getByLabelText('New status').querySelectorAll('option')).map((option) => option.value)).toEqual(['ACTIVE', 'SATISFIED', 'WAIVED', 'ENDED']);
    rerender(<MhdLeaveBenefitObligationStatusControl obligation={obligation('SATISFIED')} isPending={false} onSubmit={onSubmit} />);
    expect(Array.from(screen.getByLabelText('New status').querySelectorAll('option')).map((option) => option.value)).toEqual(['ENDED']);
    rerender(<MhdLeaveBenefitObligationStatusControl obligation={obligation('ENDED')} isPending={false} onSubmit={onSubmit} />);
    expect(screen.queryByRole('button', { name: 'Update Status' })).not.toBeInTheDocument();
  });
});
