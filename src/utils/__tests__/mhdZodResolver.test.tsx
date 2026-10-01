import { zodResolver } from '@hookform/resolvers/zod';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

/**
 * Guards the pairing of @hookform/resolvers with zod. Resolvers 3.x only understood zod 3's
 * `error.errors`; against zod 4 `zodResolver` re-threw the ZodError, so every form built on it
 * silently did nothing on an invalid submit (no field message, an unhandled rejection in the
 * console). Nothing exercised that path, which is how it went unnoticed across ~50 forms.
 * If this fails after a dependency change, the pairing is broken again.
 */
const schema = z
  .object({
    name: z.string().trim().min(1, 'Name is required.'),
    wantsEmail: z.boolean().default(false),
    email: z.string().optional(),
  })
  // A cross-field refinement: the shape most of the app's forms use for conditional requirements.
  .refine((v) => !v.wantsEmail || Boolean(v.email), {
    message: 'Email is required when email is requested.',
    path: ['email'],
  });

function Harness({ onValid }: { onValid: (values: z.output<typeof schema>) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', wantsEmail: false, email: '' },
  });
  return (
    <form onSubmit={handleSubmit(onValid)}>
      <input aria-label="Name" {...register('name')} />
      <input aria-label="Wants email" type="checkbox" {...register('wantsEmail')} />
      <input aria-label="Email" {...register('email')} />
      {errors.name ? <p role="alert">{errors.name.message}</p> : null}
      {errors.email ? <p role="alert">{errors.email.message}</p> : null}
      <button type="submit">Save</button>
    </form>
  );
}

describe('zodResolver with zod 4', () => {
  const unhandled = vi.fn();
  process.on('unhandledRejection', unhandled);
  afterEach(() => unhandled.mockClear());

  it('shows the field message for an invalid submit and never calls the valid handler', async () => {
    const onValid = vi.fn();
    render(<Harness onValid={onValid} />);

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Name is required.')).toBeInTheDocument();
    expect(onValid).not.toHaveBeenCalled();
    expect(unhandled).not.toHaveBeenCalled();
  });

  it('shows a cross-field refinement message on the field it names', async () => {
    const onValid = vi.fn();
    render(<Harness onValid={onValid} />);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ada' } });
    fireEvent.click(screen.getByLabelText('Wants email'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('Email is required when email is requested.'),
    ).toBeInTheDocument();
    expect(onValid).not.toHaveBeenCalled();
  });

  it('submits parsed values, applying schema defaults, once the form is valid', async () => {
    const onValid = vi.fn();
    render(<Harness onValid={onValid} />);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: '  Ada  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onValid).toHaveBeenCalledTimes(1));
    expect(onValid.mock.calls[0]![0]).toMatchObject({ name: 'Ada', wantsEmail: false });
  });
});
