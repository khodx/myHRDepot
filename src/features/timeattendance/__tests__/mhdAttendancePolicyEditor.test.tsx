import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MhdAttendancePolicyEditor } from '../components/MhdAttendancePolicyEditor';
import type { MhdAttendancePolicy } from '../Types';

const current: MhdAttendancePolicy = {
  id: 'policy-1',
  policyName: 'Standard attendance policy',
  effectiveFrom: '2026-01-01',
  rollOffMonths: 12,
  excusedUnpaidAccrues: false,
  excusedPaidAccrues: false,
  pointRules: [
    { occurrenceType: 'ABSENCE', points: 1 },
    { occurrenceType: 'TARDY', points: 0.5 },
  ],
  thresholds: [
    { id: 'th-1', pointsAt: 4, actionLevel: 'VERBAL_WARNING' },
    { id: 'th-2', pointsAt: 6, actionLevel: 'WRITTEN_WARNING' },
  ],
};

function renderEditor(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  render(
    <MhdAttendancePolicyEditor
      companyId="company-1"
      current={current}
      onSubmit={onSubmit}
      onCancel={vi.fn()}
      isSubmitting={false}
    />,
  );
  return onSubmit;
}

const publish = () => screen.getByRole('button', { name: /publish|save/i });

describe('MhdAttendancePolicyEditor numeric fields', () => {
  it('publishes the loaded policy unchanged', async () => {
    const onSubmit = renderEditor();

    fireEvent.click(publish());

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]![0]).toMatchObject({
      rollOffMonths: 12,
      pointRules: [
        { occurrenceType: 'ABSENCE', points: 1 },
        { occurrenceType: 'TARDY', points: 0.5 },
      ],
      thresholds: [
        { pointsAt: 4, actionLevel: 'VERBAL_WARNING' },
        { pointsAt: 6, actionLevel: 'WRITTEN_WARNING' },
      ],
    });
  });

  it('asks for the roll-off in words when it is cleared, not "expected number, received NaN"', async () => {
    const onSubmit = renderEditor();

    fireEvent.change(screen.getByLabelText('Points roll off after (months)'), {
      target: { value: '' },
    });
    fireEvent.click(publish());

    expect(await screen.findByText('Enter the roll-off window in months.')).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('asks for a point value when a rule is cleared, on the row it belongs to', async () => {
    const onSubmit = renderEditor();

    // roll-off is the first number input; the point rules follow it.
    fireEvent.change(screen.getAllByRole('spinbutton')[1]!, { target: { value: '' } });
    fireEvent.click(publish());

    expect(await screen.findByText('Enter a point value.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('asks for a point total when a threshold is cleared', async () => {
    const onSubmit = renderEditor();

    // The thresholds are the last number inputs on the form; clear the final one.
    const numberInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(numberInputs[numberInputs.length - 1]!, { target: { value: '' } });
    fireEvent.click(publish());

    expect(await screen.findByText('Enter a point total.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
