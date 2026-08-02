import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { MhdAuthLayout } from './MhdAuthLayout';
import { MhdAuthCard } from './MhdAuthCard';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { cn } from '@/utils/cn';
import { mhdResetPasswordSchema, type MhdResetPasswordFormValues } from '../Schemas';
import { useMhdAuth } from '../Hook';
import { mhdToUserFacingAuthError } from '../AuthErrors';

export function MhdResetPasswordPage() {
  const navigate = useNavigate();
  const { updatePassword } = useMhdAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<MhdResetPasswordFormValues>({
    resolver: zodResolver(mhdResetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  async function onSubmit(values: MhdResetPasswordFormValues) {
    setFormError(null);
    try {
      await updatePassword(values);
      navigate('/login', { replace: true });
    } catch (error) {
      setFormError(mhdToUserFacingAuthError(error));
    }
  }

  return (
    <MhdAuthLayout>
      <MhdAuthCard title="Create new password" description="Enter and confirm your new password.">
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium text-foreground" htmlFor="password">
              New password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.password.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground" htmlFor="confirmPassword">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              {...form.register('confirmPassword')}
            />
            {form.formState.errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
          {formError && (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{formError}</p>
          )}
          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className={cn(buttonBaseClasses, buttonVariantClasses.primary, 'w-full')}
          >
            {form.formState.isSubmitting ? 'Updating...' : 'Update password'}
          </button>
          <div className="text-center text-sm">
            <Link className="text-accent hover:underline" to="/login">
              Back to sign in
            </Link>
          </div>
        </form>
      </MhdAuthCard>
    </MhdAuthLayout>
  );
}
