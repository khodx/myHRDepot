import { useMemo, useState } from 'react';
import { Library } from 'lucide-react';
import { mhdIsPlatformAdminOrHrPartner } from '@/appshell/mhdRouteAccess';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdFilterBar, MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdModal } from '@/components/ui/MhdModal';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdCreatePolicy,
  useMhdForkPolicy,
  useMhdPolicyLibrary,
  useMhdPublishPolicyVersion,
} from '../Hook';
import {
  MHD_POLICY_CATEGORIES,
  mhdFormatPolicyValue,
  type MhdPolicy,
  type MhdPolicyCategory,
} from '../Types';
import { MhdPolicyAckBoard } from './MhdPolicyAckBoard';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

export function MhdPolicyLibraryPage() {
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? null;
  const canManageGlobal = mhdIsPlatformAdminOrHrPartner(roles);
  const canManageOwn = canManageGlobal || roles.includes('Client Admin');
  const [category, setCategory] = useState<MhdPolicyCategory | 'ALL'>('ALL');
  const [creating, setCreating] = useState(false);
  const [publishing, setPublishing] = useState<MhdPolicy | null>(null);
  const [boardPolicy, setBoardPolicy] = useState<MhdPolicy | null>(null);
  const [draft, setDraft] = useState({ title: '', category: 'GENERAL' as MhdPolicyCategory, jurisdiction: '', isGlobal: false });
  const [content, setContent] = useState('');
  const [requiresSignature, setRequiresSignature] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const policies = useMhdPolicyLibrary(companyId, category === 'ALL' ? null : category);
  const createPolicy = useMhdCreatePolicy();
  const forkPolicy = useMhdForkPolicy();
  const publishVersion = useMhdPublishPolicyVersion();

  const grouped = useMemo(() => {
    const map = new Map<string, MhdPolicy[]>();
    for (const policy of policies.data ?? []) {
      const list = map.get(policy.category) ?? [];
      list.push(policy);
      map.set(policy.category, list);
    }
    return [...map.entries()];
  }, [policies.data]);

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The action could not be completed.');
    }
  }

  async function submitCreate() {
    if (!companyId || !draft.title.trim()) return;
    await run(async () => {
      await createPolicy.mutateAsync({
        companyId: draft.isGlobal ? null : companyId,
        title: draft.title,
        category: draft.category,
        jurisdiction: draft.jurisdiction || null,
      });
      setCreating(false);
      setDraft({ title: '', category: 'GENERAL', jurisdiction: '', isGlobal: false });
    });
  }

  async function submitPublish() {
    if (!publishing || !content.trim()) return;
    await run(async () => {
      await publishVersion.mutateAsync({ policyId: publishing.id, content, requiresSignature });
      setPublishing(null);
      setContent('');
      setRequiresSignature(true);
    });
  }

  if (!companyId) {
    return <p className="text-sm text-muted-foreground">No company is associated with your account.</p>;
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Policy Library"
        description="Author, publish, fork, and assign company policies."
        actions={canManageOwn ? <Button onClick={() => setCreating(true)}>New Policy</Button> : undefined}
      />
      <MhdFilterBar>
        <MhdFilterSelect label="Category" value={category} onChange={(event) => setCategory(event.target.value as MhdPolicyCategory | 'ALL')}>
          <option value="ALL">All categories</option>
          {MHD_POLICY_CATEGORIES.map((value) => <option key={value} value={value}>{mhdFormatPolicyValue(value)}</option>)}
        </MhdFilterSelect>
      </MhdFilterBar>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {policies.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading policies...</p>
      ) : grouped.length === 0 ? (
        <MhdEmptyState icon={Library} title="No policies" description="Create or fork a policy to begin." />
      ) : (
        <div className="space-y-6">
          {grouped.map(([group, list]) => (
            <section key={group} className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">{mhdFormatPolicyValue(group)}</h2>
              <MhdCard className="overflow-hidden p-0">
                <MhdTable>
                  <thead>
                    <tr><MhdTh>Policy</MhdTh><MhdTh>Scope</MhdTh><MhdTh>Published Version</MhdTh><MhdTh /></tr>
                  </thead>
                  <tbody>
                    {list.map((policy) => (
                      <MhdTr key={policy.id}>
                        <MhdTd>
                          <p className="font-medium">{policy.title}</p>
                          <p className="text-xs text-muted-foreground">{policy.jurisdiction || 'No jurisdiction'}</p>
                        </MhdTd>
                        <MhdTd><MhdBadge variant={policy.isLibrary ? 'accent' : 'neutral'} hideIcon>{policy.isLibrary ? 'Global' : 'Company'}</MhdBadge></MhdTd>
                        <MhdTd>{policy.currentVersionId ? <span className="font-mono text-xs">{policy.currentVersionId}</span> : 'None'}</MhdTd>
                        <MhdTd className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="secondary" className="h-8 px-3 text-xs" onClick={() => setPublishing(policy)}>Publish Version</Button>
                            {policy.currentVersionId && !policy.isLibrary ? <Button variant="secondary" className="h-8 px-3 text-xs" onClick={() => setBoardPolicy(policy)}>Ack Board</Button> : null}
                            {policy.isLibrary && canManageOwn ? (
                              <Button variant="secondary" className="h-8 px-3 text-xs" disabled={forkPolicy.isPending} onClick={() => void run(() => forkPolicy.mutateAsync({ sourcePolicyId: policy.id, companyId }))}>
                                Fork to My Company
                              </Button>
                            ) : null}
                          </div>
                        </MhdTd>
                      </MhdTr>
                    ))}
                  </tbody>
                </MhdTable>
              </MhdCard>
            </section>
          ))}
        </div>
      )}

      {creating ? (
        <MhdModal title="New policy" onClose={() => setCreating(false)}>
          <div className="space-y-4">
            <MhdCardHeader title="New policy" />
            <input className={inputClass} placeholder="Policy title" value={draft.title} onChange={(event) => setDraft((value) => ({ ...value, title: event.target.value }))} />
            <select className={inputClass} value={draft.category} onChange={(event) => setDraft((value) => ({ ...value, category: event.target.value as MhdPolicyCategory }))}>
              {MHD_POLICY_CATEGORIES.map((value) => <option key={value} value={value}>{mhdFormatPolicyValue(value)}</option>)}
            </select>
            <input className={inputClass} placeholder="Jurisdiction (optional)" value={draft.jurisdiction} onChange={(event) => setDraft((value) => ({ ...value, jurisdiction: event.target.value }))} />
            {canManageGlobal ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.isGlobal} onChange={(event) => setDraft((value) => ({ ...value, isGlobal: event.target.checked }))} />Add to the global library</label> : null}
            <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setCreating(false)}>Cancel</Button><Button disabled={createPolicy.isPending} onClick={() => void submitCreate()}>{createPolicy.isPending ? 'Saving...' : 'Save Policy'}</Button></div>
          </div>
        </MhdModal>
      ) : null}

      {publishing ? (
        <MhdModal title="Publish policy version" onClose={() => setPublishing(null)}>
          <div className="space-y-4">
            <MhdCardHeader title={`Publish ${publishing.title}`} />
            <textarea className={`${inputClass} min-h-56`} value={content} onChange={(event) => setContent(event.target.value)} placeholder="Policy content" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={requiresSignature} onChange={(event) => setRequiresSignature(event.target.checked)} />Requires signature</label>
            <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setPublishing(null)}>Cancel</Button><Button disabled={publishVersion.isPending || !content.trim()} onClick={() => void submitPublish()}>{publishVersion.isPending ? 'Publishing...' : 'Publish Version'}</Button></div>
          </div>
        </MhdModal>
      ) : null}

      {boardPolicy?.currentVersionId ? (
        <MhdModal title="Policy acknowledgment board" onClose={() => setBoardPolicy(null)}>
          <MhdPolicyAckBoard companyId={companyId} versionId={boardPolicy.currentVersionId} />
        </MhdModal>
      ) : null}
    </div>
  );
}
