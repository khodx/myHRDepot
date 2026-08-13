import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { cn } from '@/utils/cn';
import { useMhdAuth } from '../Hook';
import { mhdGetDeviceLabel } from '../deviceToken';
import type { MhdTotpEnrollment } from '../Types';
import { MhdAuthLayout } from './MhdAuthLayout';
import { MhdAuthCard } from './MhdAuthCard';

const inputClass =
  'mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

export function MhdEnrollMfaPage() {
  const navigate = useNavigate();
  const { enrollTotpFactor, verifyTotpFactor, registerTrustedDevice, refreshProfile } =
    useMhdAuth();
  const [enrollment, setEnrollment] = useState<MhdTotpEnrollment | null>(null);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // No per-instance "already started" guard here: this effect can and does
  // run more than once per real page visit (the mfa-gate check that routes a
  // user here re-evaluates around the same time, causing this page to
  // mount/unmount/remount before settling — see mhdEnrollTotpFactor's own
  // request-coalescing in Service.ts). A ref-based guard scoped to a single
  // component instance risked reusing a ref from a torn-down instance's
  // stale closure while the CURRENT instance's own request never fired,
  // leaving the page stuck on "Preparing...". Idempotency belongs at the
  // Service layer (shared across every caller, not just this component), so
  // every mount simply calls enrollTotpFactor() and lets that layer decide
  // whether a real network request is needed.
  useEffect(() => {
    let isMounted = true;

    async function enroll() {
      setFormError(null);
      setIsLoading(true);

      try {
        const nextEnrollment = await enrollTotpFactor();
        if (isMounted) setEnrollment(nextEnrollment);
      } catch (error) {
        if (isMounted) {
          setFormError(
            error instanceof Error ? error.message : 'Unable to set up multi-factor authentication.',
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void enroll();

    return () => {
      isMounted = false;
    };
  }, [enrollTotpFactor]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enrollment) return;
    if (!/^\d{6}$/.test(code.trim())) {
      setFormError('Enter the 6-digit code from your authenticator app.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      await verifyTotpFactor(enrollment.factorId, code.trim());
      try {
        await registerTrustedDevice(mhdGetDeviceLabel());
      } catch (error) {
        console.error('Unable to register trusted device after MFA enrollment.', error);
      }
      await refreshProfile();
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to verify your code.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <MhdAuthLayout>
      <MhdAuthCard
        title="Set up multi-factor authentication"
        description="Every account on this platform requires an authenticator app. Scan the code below, then enter the 6-digit code it shows."
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {isLoading ? (
            <div className="rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              Preparing your authenticator setup...
            </div>
          ) : enrollment ? (
            <div className="space-y-3">
              <div
                className="flex justify-center rounded-md border border-border bg-white p-4"
                dangerouslySetInnerHTML={{ __html: enrollment.qrCodeSvg }}
              />
              <p className="text-sm text-muted-foreground">
                Manual entry key: <span className="font-mono">{enrollment.secret}</span>
              </p>
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-medium text-foreground" htmlFor="mhd-mfa-code">
              Authentication code
            </label>
            <input
              id="mhd-mfa-code"
              className={inputClass}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              disabled={isLoading || isSubmitting || !enrollment}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
            />
          </div>

          {formError && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{formError}</p>}

          <button
            type="submit"
            disabled={isLoading || isSubmitting || !enrollment}
            className={cn(buttonBaseClasses, buttonVariantClasses.primary, 'w-full')}
          >
            {isSubmitting ? 'Verifying...' : 'Verify and continue'}
          </button>
        </form>
      </MhdAuthCard>
    </MhdAuthLayout>
  );
}
