import { Link } from 'react-router-dom';
import { FileSignature, ShieldAlert, Sparkles, ChevronRight } from 'lucide-react';
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

const STATUS_STYLES: Record<MhdOnboardingPacketItem['status'], string> = {
  NOT_STARTED: 'bg-slate-100 text-slate-700',
  PENDING: 'bg-amber-100 text-amber-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  SIGNED: 'bg-emerald-100 text-emerald-800',
  VOIDED: 'bg-rose-100 text-rose-800',
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
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700">Onboarding Packet</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">{personDisplayName}</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Packet progress is built from the `03.9` manifest, overlaid with live checklist rows and the seeded Forms Engine corpus for this person&apos;s company.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-900 px-4 py-3 text-right text-white">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Required Complete</p>
          <p className="mt-1 text-2xl font-semibold">{completedCount}/{requiredCount}</p>
          <p className="mt-1 text-xs text-slate-300">{isFullyOnboarded ? 'Packet complete' : 'Packet in progress'}</p>
        </div>
      </div>

      {errorMessage ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{errorMessage}</div>
      ) : null}

      {isLoading ? (
        <p className="mt-6 text-sm text-slate-500">Loading onboarding packet...</p>
      ) : (
        <div className="mt-6 grid gap-4">
          {items.map((item) => (
            <article
              key={item.documentKey}
              className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 lg:grid-cols-[minmax(0,1.35fr)_auto]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900">{item.label}</h3>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[item.status]}`}>
                    {item.status.replace('_', ' ')}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                    {item.accessTier}
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-600">{item.description}</p>

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                  <span className="rounded-full bg-white px-2.5 py-1">
                    {item.formReferenceId ? `${item.formReferenceId} · ${item.formName}` : `No seeded form mapped`}
                  </span>
                  {item.requiresSignature ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                      <FileSignature className="h-3.5 w-3.5" />
                      Signature required
                    </span>
                  ) : null}
                  {item.generatedDocumentRequired ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      Final packet artifact required
                    </span>
                  ) : null}
                  {item.accessTier === 'Restricted' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Restricted data
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                  <span>Checklist Ref: {item.referenceId}</span>
                  {item.documentRecordId ? <span>Record: {item.documentRecordId}</span> : null}
                  {item.completedAt ? <span>Completed: {new Date(item.completedAt).toLocaleString()}</span> : null}
                </div>
              </div>

              <div className="flex items-center justify-end">
                {item.formId ? (
                  <Link
                    to={`/forms/${item.formId}/render?personId=${encodeURIComponent(personId)}&documentKey=${encodeURIComponent(item.documentKey)}&personName=${encodeURIComponent(personDisplayName)}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
                  >
                    Open Form
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-500">Unavailable</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
