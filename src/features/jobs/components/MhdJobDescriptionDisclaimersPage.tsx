import { useState } from 'react';
import { MHD_JOB_PAY_ROLES } from '@/appshell/mhdRouteAccess';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdRichTextEditor, MhdRichTextRenderer } from '@/components/ui/MhdRichText';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdJobDescriptionDisclaimerHistory,
  useMhdJobDescriptionDisclaimersCurrent,
  useMhdUpsertJobDescriptionDisclaimer,
} from '../Hook';
import {
  MHD_JOB_DESCRIPTION_DISCLAIMER_KEYS,
  mhdFormatJobDescriptionDisclaimerKey,
  type MhdJobDescriptionDisclaimerCurrent,
  type MhdJobDescriptionDisclaimerKey,
} from '../Types';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * One disclaimer's card: what's currently in force, its edit form, and its
 * version history — same shape as MhdCompanyRatePolicyForm's "what applies
 * today, publish a new version" pattern, just three of them stacked instead
 * of a single form, since there's no single "current policy" here.
 */
function MhdDisclaimerCard({
  disclaimerKey,
  current,
  companyId,
  canEdit,
}: {
  disclaimerKey: MhdJobDescriptionDisclaimerKey;
  current: MhdJobDescriptionDisclaimerCurrent | undefined;
  companyId: string;
  canEdit: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [body, setBody] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(todayIso());
  const [error, setError] = useState<string | null>(null);
  const upsert = useMhdUpsertJobDescriptionDisclaimer();
  const history = useMhdJobDescriptionDisclaimerHistory(showHistory ? disclaimerKey : null, companyId);

  function startEditing() {
    setBody(current?.body ?? '');
    setEffectiveFrom(todayIso());
    setError(null);
    setIsEditing(true);
  }

  async function handleSave() {
    setError(null);
    try {
      await upsert.mutateAsync({ disclaimerKey, body, companyId, effectiveFrom });
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to publish this disclaimer.');
    }
  }

  return (
    <MhdCard className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {mhdFormatJobDescriptionDisclaimerKey(disclaimerKey)}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {current
              ? `Version ${current.version}, effective ${current.effectiveFrom}${current.isCompanyOverride ? ' — company override' : ' — platform default'}.`
              : 'No text has been published yet.'}
          </p>
        </div>
        {canEdit && !isEditing ? (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowHistory((value) => !value)}>
              {showHistory ? 'Hide history' : 'History'}
            </Button>
            <Button onClick={startEditing}>{current ? 'Publish new version' : 'Publish'}</Button>
          </div>
        ) : null}
      </header>

      {current ? (
        <MhdRichTextRenderer html={current.body} className="rounded-md border border-border bg-muted/30 p-3 text-sm" />
      ) : (
        <p className="text-sm text-muted-foreground">
          Job descriptions will show no {mhdFormatJobDescriptionDisclaimerKey(disclaimerKey).toLowerCase()} text until one is published.
        </p>
      )}

      {isEditing ? (
        <div className="space-y-3 rounded-md border border-border bg-card p-4">
          <MhdRichTextEditor label="New disclaimer text" html={body} onChange={(html) => setBody(html)} />
          <div>
            <label htmlFor={`effective-${disclaimerKey}`} className="block text-sm font-medium text-foreground">
              Effective from
            </label>
            <MhdDateField id={`effective-${disclaimerKey}`} className="mt-1 w-full sm:w-48" value={effectiveFrom} onChange={setEffectiveFrom} />
            <p className="mt-1 text-xs text-muted-foreground">
              The current version closes the day before this date. Any document already generated keeps the wording it was stamped with.
            </p>
          </div>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <div className="flex gap-2">
            <Button disabled={upsert.isPending} onClick={() => void handleSave()}>
              {upsert.isPending ? 'Publishing…' : 'Publish'}
            </Button>
            <Button variant="secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {showHistory ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">Version history</h3>
          {history.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (history.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No versions yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {(history.data ?? []).map((version) => (
                <li key={version.id} className="space-y-2 p-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Version {version.version}</span>
                    <span>{version.status}</span>
                    <span>
                      {version.effectiveFrom}
                      {version.effectiveTo ? ` – ${version.effectiveTo}` : ' – present'}
                    </span>
                  </div>
                  <MhdRichTextRenderer html={version.body} className="text-sm" />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </MhdCard>
  );
}

/**
 * `/jobs/disclaimers` — the at-will/reasonable-accommodation/EEO disclaimer
 * registry. Read-only preview for anyone who can reach /jobs; publishing a
 * new version requires the same Platform Admin/HR Partner/HR Admin set the
 * mhd_job_description_disclaimer_upsert RPC itself enforces server-side
 * (MHD_JOB_PAY_ROLES) — this only decides whether to render the affordance.
 */
export function MhdJobDescriptionDisclaimersPage() {
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? null;
  const canEdit = roles.some((role) => MHD_JOB_PAY_ROLES.includes(role));
  const current = useMhdJobDescriptionDisclaimersCurrent(companyId);

  if (!companyId) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const currentByKey = new Map((current.data ?? []).map((row) => [row.disclaimerKey, row]));

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Job description disclaimers"
        description="The at-will, reasonable accommodation, and equal opportunity text shown in the Job Description Wizard and stamped into every generated job description document."
      />
      {MHD_JOB_DESCRIPTION_DISCLAIMER_KEYS.map((key) => (
        <MhdDisclaimerCard
          key={key}
          disclaimerKey={key}
          current={currentByKey.get(key)}
          companyId={companyId}
          canEdit={canEdit}
        />
      ))}
    </div>
  );
}
