import { useState } from 'react';
import { Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { MhdAuthLayout } from './MhdAuthLayout';
import { MhdAuthCard } from './MhdAuthCard';
import { mhdForgotPasswordSchema, type MhdForgotPasswordFormValues } from '../Schemas';
import { useMhdAuth } from '../Hook';
import { mhdToUserFacingAuthError } from '../AuthErrors';

export function MhdForgotPasswordPage() {
  const { sendPasswordReset } = useMhdAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  const form = useForm<MhdForgotPasswordFormValues>({
    resolver: zodResolver(mhdForgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: MhdForgotPasswordFormValues) {
    setFormError(null);
    setIsSent(false);
    try {
      await sendPasswordReset(values);
      setIsSent(true);
    } catch (error) {
      setFormError(mhdToUserFacingAuthError(error));
    }
  }

  return (
    <MhdAuthLayout>
      <MhdAuthCard title="Reset password" description="Enter your email and we will send a reset link.">
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium text-foreground" htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" {...form.register('email')} />
            {form.formState.errors.email && <p className="mt-1 text-sm text-red-600">{form.formState.errors.email.message}</p>}
          </div>
          {formError && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
          {isSent && <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">Password reset email sent.</p>}
          <button type="submit" disabled={form.formState.isSubmitting} className="w-full rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-on hover:bg-accent-hover disabled:opacity-60">
            {form.formState.isSubmitting ? 'Sending...' : 'Send reset link'}
          </button>
          <div className="text-center text-sm"><Link className="text-accent hover:underline" to="/login">Back to sign in</Link></div>
        </form>
      </MhdAuthCard>
    </MhdAuthLayout>
  );
}
