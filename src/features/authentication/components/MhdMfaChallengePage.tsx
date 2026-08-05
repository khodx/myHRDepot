import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { cn } from '@/utils/cn';
import { useMhdAuth } from '../Hook';
import { mhdGetDeviceLabel } from '../deviceToken';
import { MhdAuthLayout } from './MhdAuthLayout';
import { MhdAuthCard } from './MhdAuthCard';

const inputClass =
  'mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

export function MhdMfaChallengePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { listMfaFactors, verifyTotpFactor, registerTrustedDevice, refreshProfile } = useMhdAuth();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard';

  useEffect(() => {
    let isMounted = true;

    async function loadFactor() {
      setFormError(null);
      setIsLoading(true);

      try {
        const factors = await listMfaFactors();
        const verifiedFactor = factors.find((factor) => factor.status === 'verified');
        if (isMounted) {
          setFactorId(verifiedFactor?.id ?? null);
          if (!verifiedFactor) {
            setFormError('No verified authenticator app is available for this account.');
          }
        }
      } catch (error) {
        if (isMounted) {
          setFormError(error instanceof Error ? error.message : 'Unable to load your MFA factors.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadFactor();

    return () => {
      isMounted = false;
    };
  }, [listMfaFactors]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!factorId) return;
    if (!/^\d{6}$/.test(code.trim())) {
      setFormError('Enter the 6-digit code from your authenticator app.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      await verifyTotpFactor(factorId, code.trim());
      try {
        await registerTrustedDevice(mhdGetDeviceLabel());
      } catch (error) {
        console.error('Unable to register trusted device after MFA challenge.', error);
      }
      await refreshProfile();
      navigate(from, { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to verify your code.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <MhdAuthLayout>
      <MhdAuthCard
        title="Enter your authentication code"
        description="Open your authenticator app and enter the current code."
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-foreground" htmlFor="mhd-mfa-code">
              Authentication code
            </label>
            <input
              id="mhd-mfa-code"
              className={inputClass}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              disabled={isLoading || isSubmitting || !factorId}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
            />
          </div>

          {formError && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{formError}</p>}

          <button
            type="submit"
            disabled={isLoading || isSubmitting || !factorId}
            className={cn(buttonBaseClasses, buttonVariantClasses.primary, 'w-full')}
          >
            {isSubmitting ? 'Verifying...' : 'Verify'}
          </button>
        </form>
      </MhdAuthCard>
    </MhdAuthLayout>
  );
}
