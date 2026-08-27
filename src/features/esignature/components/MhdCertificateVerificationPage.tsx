import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, CircleAlert, ShieldCheck } from 'lucide-react';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdDetailField } from '@/components/ui/MhdDetailField';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { cn } from '@/utils/cn';
import { mhdEsignatureService } from '../Service';
import type { MhdAuditCertificateVerification } from '../Types';

export function MhdCertificateVerificationPage() {
  const { code } = useParams<{ code: string }>();
  const [result, setResult] = useState<MhdAuditCertificateVerification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!code?.trim()) {
        setResult({
          isValid: false,
          entityType: null,
          status: null,
          generatedAt: null,
          digitallySigned: false,
        });
        setIsLoading(false);
        return;
      }

      try {
        const nextResult = await mhdEsignatureService.verifyAuditCertificateByCode(code);
        if (!cancelled) {
          setResult(nextResult);
          setLoadError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setResult(null);
          setLoadError(
            error instanceof Error ? error.message : 'Unable to verify this certificate.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void verify();

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Verifying certificate...
      </div>
    );
  }

  const isValid = result?.isValid ?? false;

  return (
    <main className="min-h-screen bg-muted px-6 py-10">
      <MhdCard className="mx-auto max-w-[54rem] rounded-3xl p-8">
        <div className="flex items-start gap-3">
          {isValid ? (
            <CheckCircle2 className="mt-1 h-6 w-6 text-emerald-600" />
          ) : (
            <CircleAlert className="mt-1 h-6 w-6 text-rose-600" />
          )}
          <div className="min-w-0">
            <p
              className={cn(
                'text-sm font-semibold uppercase tracking-[0.22em]',
                isValid ? 'text-emerald-700' : 'text-rose-700',
              )}
            >
              Certificate Verification
            </p>
            <h1 className="mt-2 text-3xl font-bold text-foreground">
              {isValid ? 'Certificate is valid' : 'Certificate is not valid'}
            </h1>
            <p className="mt-3 break-all text-sm leading-6 text-muted-foreground">
              Verification code: {code || 'Missing'}
            </p>
          </div>
        </div>

        {loadError ? (
          <div className="mt-6 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {loadError}
          </div>
        ) : null}

        {!loadError && isValid && result ? (
          <dl className="mt-6 rounded-2xl border border-border bg-muted p-4">
            <MhdFormFieldStack>
              <MhdDetailField label="Entity type" value={result.entityType} />
              <MhdDetailField label="Status" value={result.status} />
              <MhdDetailField label="Generated" value={result.generatedAt ? new Date(result.generatedAt).toLocaleString() : undefined} />
              <MhdDetailField label="Authenticity" value={<span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" /><MhdBadge variant={result.digitallySigned ? 'success' : 'warning'}>{result.digitallySigned ? 'Digitally signed' : 'Hash-verified only'}</MhdBadge></span>} />
            </MhdFormFieldStack>
          </dl>
        ) : null}

        {!loadError && !isValid ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700">
            This code does not match a valid audit certificate. Check the code and try again.
          </div>
        ) : null}

        <div className="mt-6">
          <Link
            to="/login"
            className={cn(buttonBaseClasses, buttonVariantClasses.secondary)}
          >
            Platform sign-in
          </Link>
        </div>
      </MhdCard>
    </main>
  );
}
