import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { MhdAuthLayout } from './MhdAuthLayout';
import { MhdAuthCard } from './MhdAuthCard';
import { mhdLoginSchema, type MhdLoginFormValues } from '../Schemas';
import { useMhdAuth } from '../Hook';
import { mhdToUserFacingAuthError } from '../AuthErrors';

export function MhdLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useMhdAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<MhdLoginFormValues>({
    resolver: zodResolver(mhdLoginSchema),
    defaultValues: { email: '', password: '' },
  });

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';

  async function onSubmit(values: MhdLoginFormValues) {
    setFormError(null);
    try {
      await signIn(values);
      navigate(from, { replace: true });
    } catch (error) {
      setFormError(mhdToUserFacingAuthError(error));
    }
  }

  return (
    <MhdAuthLayout>
      <MhdAuthCard title="Sign in" description="Access your secure My HR Depot workspace.">
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" {...form.register('email')} />
            {form.formState.errors.email && <p className="mt-1 text-sm text-red-600">{form.formState.errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="current-password" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" {...form.register('password')} />
            {form.formState.errors.password && <p className="mt-1 text-sm text-red-600">{form.formState.errors.password.message}</p>}
          </div>
          {formError && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
          <button type="submit" disabled={form.formState.isSubmitting} className="w-full rounded-md bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-60">
            {form.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
          <div className="text-center text-sm">
            <Link className="text-blue-700 hover:underline" to="/forgot-password">Forgot your password?</Link>
          </div>
        </form>
      </MhdAuthCard>
    </MhdAuthLayout>
  );
}
