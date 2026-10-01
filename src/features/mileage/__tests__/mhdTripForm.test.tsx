import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MhdTripForm } from '../components/MhdTripForm';

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  render(
    <MhdTripForm
      companyId="company-1"
      people={[]}
      presetPersonId="person-1"
      onSubmit={onSubmit}
      onCancel={vi.fn()}
      isSubmitting={false}
    />,
  );
  return onSubmit;
}

describe('MhdTripForm numeric fields', () => {
  it('asks for the miles in words when they are left blank, not "expected number, received NaN"', async () => {
    const onSubmit = renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Record trip' }));

    expect(await screen.findByText('Enter the miles driven.')).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a trip with the optional odometer and commute-deduction fields left blank', async () => {
    // Regression guard: blank optional numbers must reach the schema as null, never NaN, or the
    // trip cannot be recorded without readings it does not require.
    const onSubmit = renderForm();

    fireEvent.change(screen.getByLabelText(/^Miles/), { target: { value: '12.5' } });
    fireEvent.change(screen.getByLabelText('From'), { target: { value: 'Main office' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: 'Client site' } });
    fireEvent.change(screen.getByLabelText(/Business purpose/i), {
      target: { value: 'On-site compliance audit' },
    });
    fireEvent.click(screen.getByLabelText(/This journey was not ordinary commuting/i));
    fireEvent.click(screen.getByRole('button', { name: 'Record trip' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const values = onSubmit.mock.calls[0]![0];
    expect(values.miles).toBe(12.5);
    expect(values.odometerStart ?? null).toBeNull();
    expect(values.odometerEnd ?? null).toBeNull();
    expect(values.commuteDeductionMiles ?? null).toBeNull();
  });
});
