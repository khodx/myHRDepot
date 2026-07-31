import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { MhdAuthLayout } from './MhdAuthLayout';
import { MhdAuthCard } from './MhdAuthCard';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { mhdLoginSchema, type MhdLoginFormValues } from '../Schemas';
import { useMhdAuth } from '../Hook';
import { mhdToUserFacingAuthError } from '../AuthErrors';

// Demo-phase convenience: the login form comes pre-filled with the shared demo
// account and shows it on screen. Remove MHD_DEMO_LOGIN (or blank its values)
// before real customer data enters the system.
const MHD_DEMO_LOGIN = {
  email: 'tech@simply-hr.org',
  password: 'DemoPass123!',
};

export function MhdLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useMhdAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<MhdLoginFormValues>({
    resolver: zodResolver(mhdLoginSchema),
    defaultValues: { email: MHD_DEMO_LOGIN.email, password: MHD_DEMO_LOGIN.password },
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
        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          <p className="font-semibold">Demo access (pre-filled)</p>
          <p className="mt-1">
            Email: <span className="font-mono">{MHD_DEMO_LOGIN.email}</span>
            <br />
            Password: <span className="font-mono">{MHD_DEMO_LOGIN.password}</span>
          </p>
        </div>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium text-foreground" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.password.message}</p>
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
            {form.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
          <div className="text-center text-sm">
            <Link className="text-accent hover:underline" to="/forgot-password">
              Forgot your password?
            </Link>
          </div>
        </form>
      </MhdAuthCard>
    </MhdAuthLayout>
  );
}
