import { Link, useLocation } from 'react-router-dom';
import { FileSignature, ShieldAlert, Sparkles, ChevronRight } from 'lucide-react';
import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import type { MhdOnboardingPacketItem } from '../Types';

interface MhdOnboardingChecklistPageProps {
  personId: string;
  personDisplayName: string;
  items: MhdOnboardingPacketItem[];
  completedCount: number;
  requiredCount: number;
  isFullyOnboarded: boolean;
  isLoading: boolean;
  errorMessage: string | null;
}

const STATUS_VARIANTS: Record<MhdOnboardingPacketItem['status'], MhdBadgeVariant> = {
  NOT_STARTED: 'neutral',
  PENDING: 'warning',
  SUBMITTED: 'info',
  SIGNED: 'success',
  VOIDED: 'error',
};

export function MhdOnboardingChecklistPage({
  personId,
  personDisplayName,
  items,
  completedCount,
  requiredCount,
  isFullyOnboarded,
  isLoading,
  errorMessage,
}: MhdOnboardingChecklistPageProps) {
  const location = useLocation();
  const hasSignatureWorkflow = items.some(
    (item) => item.requiresSignature && item.generatedDocumentRequired,
  );

  return (
    <MhdCard className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">
            Onboarding Packet
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">{personDisplayName}</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Packet progress is built from the `03.9` manifest, overlaid with live checklist rows and
            the seeded Forms Engine corpus for this person&apos;s company.
          </p>
        </div>
        <div className="rounded-2xl bg-foreground px-4 py-3 text-right text-background">
          <p className="text-xs uppercase tracking-[0.22em] text-background/70">
            Required Complete
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {completedCount}/{requiredCount}
          </p>
          <p className="mt-1 text-xs text-background/70">
            {isFullyOnboarded ? 'Packet complete' : 'Packet in progress'}
          </p>
        </div>
      </div>

      {hasSignatureWorkflow ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/20 bg-accent-tint p-4 text-sm text-accent-hover">
          <p>
            Signature-required packet items route through the Stage 6 E-Signature Center after
            document generation.
          </p>
          <Link
            to={`/esignature?personId=${encodeURIComponent(personId)}&personName=${encodeURIComponent(personDisplayName)}`}
            className="rounded-xl bg-accent px-4 py-2 font-semibold text-accent-on transition-colors hover:bg-accent-hover"
          >
            Open Signature Center
          </Link>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading onboarding packet...</p>
      ) : (
        <div className="mt-6 grid gap-4">
          {items.map((item) => (
            <article
              key={item.documentKey}
              className="grid gap-4 rounded-2xl border border-border bg-muted/60 p-4 lg:grid-cols-[minmax(0,1.35fr)_auto]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-foreground">{item.label}</h3>
                  <MhdBadge variant={STATUS_VARIANTS[item.status]}>
                    {item.status.replace('_', ' ')}
                  </MhdBadge>
                  <span className="rounded-full bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {item.accessTier}
                  </span>
                </div>

                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-card px-2.5 py-1">
                    {item.formReferenceId
                      ? `${item.formReferenceId} · ${item.formName}`
                      : `No seeded form mapped`}
                  </span>
                  {item.requiresSignature ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1">
                      <FileSignature className="h-3.5 w-3.5" />
                      Signature required
                    </span>
                  ) : null}
                  {item.generatedDocumentRequired ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      Final packet artifact required
                    </span>
                  ) : null}
                  {item.accessTier === 'Restricted' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Restricted data
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>Checklist Ref: {item.referenceId}</span>
                  {item.documentRecordId ? <span>Record: {item.documentRecordId}</span> : null}
                  {item.completedAt ? (
                    <span>Completed: {new Date(item.completedAt).toLocaleString()}</span>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center justify-end">
                {item.formId ? (
                  <Link
                    to={`/forms/${item.formId}/render?personId=${encodeURIComponent(personId)}&documentKey=${encodeURIComponent(item.documentKey)}&personName=${encodeURIComponent(personDisplayName)}`}
                    state={{ backgroundLocation: location }}
                    className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-on transition-colors hover:bg-accent-hover"
                  >
                    Open Form
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span className="rounded-xl border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
                    Unavailable
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </MhdCard>
  );
}
