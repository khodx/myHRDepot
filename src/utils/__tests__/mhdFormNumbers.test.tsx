import { zodResolver } from '@hookform/resolvers/zod';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { mhdNumberField, mhdOptionalNumberField } from '../mhdFormNumbers';

const apply = (options: { setValueAs?: (value: never) => unknown }, value: unknown) =>
  (options.setValueAs as (value: unknown) => unknown)(value);

describe('mhdOptionalNumberField', () => {
  it('maps a blank to null and never to NaN', () => {
    const options = mhdOptionalNumberField();
    expect(apply(options, '')).toBeNull();
    expect(apply(options, null)).toBeNull();
    expect(apply(options, undefined)).toBeNull();
    expect(apply(options, 'abc')).toBeNull();
    expect(apply(options, Number.NaN)).toBeNull();
  });

  it('parses real numbers, including zero and decimals', () => {
    const options = mhdOptionalNumberField();
    expect(apply(options, '15')).toBe(15);
    expect(apply(options, '0')).toBe(0);
    expect(apply(options, '0.67')).toBe(0.67);
  });
});

describe('mhdNumberField', () => {
  it('maps a blank to undefined so a default or a required message applies', () => {
    const options = mhdNumberField();
    expect(apply(options, '')).toBeUndefined();
    expect(apply(options, 'abc')).toBeUndefined();
  });

  it('parses real numbers, including zero', () => {
    const options = mhdNumberField();
    expect(apply(options, '12')).toBe(12);
    expect(apply(options, '0')).toBe(0);
  });
});

/** The behaviour that matters is end to end: what a person sees when they leave the field blank. */
const schema = z.object({
  required: z.number({ error: 'Enter a number.' }).positive('Must be above zero.'),
  optional: z.number().int().positive().optional().nullable(),
  defaulted: z.number().int().nonnegative().default(0),
});

function Harness({ onValid }: { onValid: (values: z.output<typeof schema>) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
  });
  return (
    <form onSubmit={handleSubmit(onValid)}>
      <input aria-label="Required" type="number" {...register('required', mhdNumberField())} />
      <input
        aria-label="Optional"
        type="number"
        {...register('optional', mhdOptionalNumberField())}
      />
      <input aria-label="Defaulted" type="number" {...register('defaulted', mhdNumberField())} />
      {errors.required ? <p role="alert">{errors.required.message}</p> : null}
      {errors.optional ? <p role="alert">{errors.optional.message}</p> : null}
      <button type="submit">Save</button>
    </form>
  );
}

describe('number fields in a zod form', () => {
  it('reads as a sentence when a required number is blank, not "expected number, received NaN"', async () => {
    const onValid = vi.fn();
    render(<Harness onValid={onValid} />);

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Enter a number.')).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
    expect(onValid).not.toHaveBeenCalled();
  });

  it('lets an optional number stay blank, and applies a default to a blank defaulted one', async () => {
    const onValid = vi.fn();
    render(<Harness onValid={onValid} />);

    fireEvent.change(screen.getByLabelText('Required'), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onValid).toHaveBeenCalledTimes(1));
    expect(onValid.mock.calls[0]![0]).toEqual({ required: 4, optional: null, defaulted: 0 });
  });

  it('still validates a number that is present', async () => {
    const onValid = vi.fn();
    render(<Harness onValid={onValid} />);

    fireEvent.change(screen.getByLabelText('Required'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Must be above zero.')).toBeInTheDocument();
    expect(onValid).not.toHaveBeenCalled();
  });
});
