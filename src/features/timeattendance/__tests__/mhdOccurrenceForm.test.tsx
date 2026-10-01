import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MhdOccurrenceForm } from '../components/MhdOccurrenceForm';

const people = [
  { id: 'person-1', displayName: 'Imani Brooks' },
  { id: 'person-2', displayName: 'Mateo Alvarez' },
];

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  render(
    <MhdOccurrenceForm
      companyId="company-1"
      people={people}
      policy={null}
      onSubmit={onSubmit}
      onCancel={vi.fn()}
      isSubmitting={false}
    />,
  );
  return onSubmit;
}

describe('MhdOccurrenceForm', () => {
  it('shows field messages for an empty submit instead of failing silently', async () => {
    const onSubmit = renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Record occurrence' }));

    expect(await screen.findByText('Employee is required.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('records a plain absence with the minutes field blank and disabled', async () => {
    // Regression: the Minutes input is always rendered but disabled for types without minutes.
    // valueAsNumber turned its empty value into NaN, which failed validation, so a plain Absence
    // could not be recorded at all.
    const onSubmit = renderForm();

    fireEvent.change(screen.getByLabelText('Employee'), { target: { value: 'person-1' } });
    expect(screen.getByLabelText('Minutes')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Record occurrence' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]![0]).toMatchObject({
      personId: 'person-1',
      occurrenceType: 'ABSENCE',
      classification: 'UNEXCUSED',
      minutesVariance: null,
    });
  });

  it('passes the minutes through for a tardy', async () => {
    const onSubmit = renderForm();

    fireEvent.change(screen.getByLabelText('Employee'), { target: { value: 'person-2' } });
    fireEvent.change(screen.getByLabelText('What happened'), { target: { value: 'TARDY' } });
    fireEvent.change(screen.getByLabelText('Minutes'), { target: { value: '15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record occurrence' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]![0]).toMatchObject({
      occurrenceType: 'TARDY',
      minutesVariance: 15,
    });
  });

  it('requires a category for a protected absence', async () => {
    const onSubmit = renderForm();

    fireEvent.change(screen.getByLabelText('Employee'), { target: { value: 'person-1' } });
    fireEvent.change(screen.getByLabelText('Classification'), { target: { value: 'PROTECTED' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record occurrence' }));

    expect(await screen.findByText(/requires a category/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
