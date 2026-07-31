import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FileCheck2, FileSignature, Mail, Plus, Send, ShieldCheck } from 'lucide-react';
import { Button, buttonBaseClasses, buttonVariantClasses } from '@/components/ui/Button';
import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdStatCard } from '@/components/ui/MhdStatCard';
import { cn } from '@/utils/cn';
import { mhdCanMutateEsignature } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdEsignatureActions,
  useMhdEsignatureAssignableUsers,
  useMhdEsignatureGeneratedDocuments,
  useMhdEsignatureRequests,
} from '../Hook';
import {
  mhdBuildGoogleDriveViewUrl,
  mhdIsSha256Hex,
  type MhdCreateEsignatureRequestFromGenerationInput,
  type MhdEsignatureGeneratedDocument,
  type MhdEsignatureSignerInput,
  type MhdEsignatureSigningOrder,
} from '../Types';

interface DraftSignerRow {
  id: string;
  kind: 'internal' | 'external';
  userId: string;
  externalEmail: string;
  externalName: string;
}

const STATUS_VARIANTS: Record<string, MhdBadgeVariant> = {
  PENDING: 'warning',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  DECLINED: 'error',
  VOIDED: 'neutral',
  EXPIRED: 'error',
  GENERATED: 'success',
};

function createSignerRow(kind: DraftSignerRow['kind'] = 'external'): DraftSignerRow {
  return {
    id: crypto.randomUUID(),
    kind,
    userId: '',
    externalEmail: '',
    externalName: '',
  };
}

function normalizeSigners(rows: DraftSignerRow[]): MhdEsignatureSignerInput[] {
  return rows.flatMap<MhdEsignatureSignerInput>((row) => {
    if (row.kind === 'internal') {
      return row.userId ? [{ kind: 'internal', userId: row.userId }] : [];
    }

    const email = row.externalEmail.trim();
    const name = row.externalName.trim();
    return email && name ? [{ kind: 'external', externalEmail: email, externalName: name }] : [];
  });
}

export function MhdEsignaturePage() {
  const [searchParams] = useSearchParams();
  const { profile, roles } = useMhdAuth();
  const canMutate = mhdCanMutateEsignature(roles);
  const personId = searchParams.get('personId');
  const personName = searchParams.get('personName');
  const requestedGenerationId = searchParams.get('generationId');

  const requestsQuery = useMhdEsignatureRequests(profile?.companyId ?? null);
  const generatedDocumentsQuery = useMhdEsignatureGeneratedDocuments(
    profile?.companyId ?? null,
    personId,
  );
  const usersQuery = useMhdEsignatureAssignableUsers(profile?.companyId ?? null);
  const actions = useMhdEsignatureActions();

  const [selectedGenerationId, setSelectedGenerationId] = useState<string | null>(
    requestedGenerationId,
  );
  const [documentHash, setDocumentHash] = useState('');
  const [signingOrder, setSigningOrder] = useState<MhdEsignatureSigningOrder>('SEQUENTIAL');
  const [expiresAt, setExpiresAt] = useState('');
  const [disclosureVersion, setDisclosureVersion] = useState('2026-07-17');
  const [disclosureText, setDisclosureText] = useState('');
  const [signers, setSigners] = useState<DraftSignerRow[]>([createSignerRow('external')]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [requestSearchTerm, setRequestSearchTerm] = useState('');

  const generatedDocuments = useMemo(
    () => generatedDocumentsQuery.data ?? [],
    [generatedDocumentsQuery.data],
  );
  const requests = useMemo(() => requestsQuery.data ?? [], [requestsQuery.data]);
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);

  // Adjust selection during render when the URL requests a specific generation.
  const [prevRequestedGenerationId, setPrevRequestedGenerationId] = useState(requestedGenerationId);
  if (requestedGenerationId !== prevRequestedGenerationId) {
    setPrevRequestedGenerationId(requestedGenerationId);
    if (requestedGenerationId) {
      setSelectedGenerationId(requestedGenerationId);
    }
  }

  // Until the user picks one, default to the first generation without a linked request.
  const effectiveGenerationId =
    selectedGenerationId ??
    generatedDocuments.find((item) => !item.esignatureRequestId)?.id ??
    generatedDocuments[0]?.id ??
    null;

  const selectedGeneration = useMemo(
    () => generatedDocuments.find((generation) => generation.id === effectiveGenerationId) ?? null,
    [generatedDocuments, effectiveGenerationId],
  );

  const filteredRequests = useMemo(() => {
    const term = requestSearchTerm.trim().toLowerCase();
    if (!term) return requests;
    return requests.filter((request) => {
      return (
        request.referenceId.toLowerCase().includes(term) ||
        request.documentName.toLowerCase().includes(term) ||
        request.status.toLowerCase().includes(term)
      );
    });
  }, [requestSearchTerm, requests]);

  function resetComposer(generation?: MhdEsignatureGeneratedDocument | null) {
    setActionError(null);
    setDocumentHash('');
    setExpiresAt('');
    setDisclosureText('');
    setDisclosureVersion('2026-07-17');
    setSigningOrder('SEQUENTIAL');
    setSigners([createSignerRow('external')]);
    setSelectedGenerationId(generation?.id ?? effectiveGenerationId);
  }

  function updateSigner(id: string, updater: (row: DraftSignerRow) => DraftSignerRow) {
    setSigners((current) => current.map((row) => (row.id === id ? updater(row) : row)));
  }

  async function handleCreateRequest() {
    setActionError(null);
    setActionMessage(null);

    if (!profile?.companyId) {
      setActionError('No company is loaded for the current user.');
      return;
    }

    if (!selectedGeneration) {
      setActionError('Select a generated document before creating a signature request.');
      return;
    }

    if (!mhdIsSha256Hex(documentHash)) {
      setActionError('Enter a valid 64-character SHA-256 document hash.');
      return;
    }

    const normalizedSigners = normalizeSigners(signers);
    if (normalizedSigners.length === 0) {
      setActionError('Add at least one valid signer before creating the request.');
      return;
    }

    const payload: MhdCreateEsignatureRequestFromGenerationInput = {
      companyId: profile.companyId,
      generationId: selectedGeneration.id,
      documentHash: documentHash.trim().toLowerCase(),
      signers: normalizedSigners,
      signingOrder,
      ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
      ...(disclosureText.trim() ? { disclosureText: disclosureText.trim() } : {}),
      ...(disclosureVersion.trim() ? { disclosureVersion: disclosureVersion.trim() } : {}),
    };

    try {
      const result = await actions.createRequestFromGeneratedDocument.mutateAsync(payload);
      const message =
        result.invitationErrors.length > 0
          ? `Request ${result.request.referenceId} created, but some invitation emails failed: ${result.invitationErrors.join(' | ')}`
          : `Request ${result.request.referenceId} created and invitation emails were queued.`;
      setActionMessage(message);
      resetComposer(selectedGeneration);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Unable to create the signature request.',
      );
    }
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Signature Requests"
        description="Route generated documents into the compliance-aware signing ceremony, monitor signer progress, and inspect the full event trail."
        actions={
          <MhdStatCard
            label="Open Requests"
            value={
              requests.filter((request) => ['PENDING', 'IN_PROGRESS'].includes(request.status))
                .length
            }
            hint={`${requests.length} total request${requests.length === 1 ? '' : 's'}`}
          />
        }
      />
      <div className="space-y-6">
        {personId ? (
          <div className="rounded-2xl border border-border bg-accent-tint p-4 text-sm text-foreground">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <p className="font-semibold">Onboarding handoff</p>
                <p className="mt-1">
                  Showing generated documents for {personName || 'the selected person'} that are
                  ready to route into the signing workflow.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {actionMessage ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {actionMessage}
          </div>
        ) : null}
        {actionError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {actionError}
          </div>
        ) : null}

        <MhdCard className="rounded-2xl p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-semibold text-foreground">
                  Generated Documents Ready for Signature
                </h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                These rows come directly from `document_generations` and are filtered to documents
                whose template requires signature.
              </p>
            </div>
            {selectedGeneration ? (
              <Button variant="secondary" onClick={() => resetComposer(selectedGeneration)}>
                Reset Request Composer
              </Button>
            ) : null}
          </div>

          {generatedDocumentsQuery.error ? (
            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {generatedDocumentsQuery.error instanceof Error
                ? generatedDocumentsQuery.error.message
                : 'Unable to load generated documents.'}
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="space-y-3">
              {generatedDocuments.length === 0 ? (
                <MhdCard className="border-dashed">
                  <MhdEmptyState
                    icon={FileCheck2}
                    title="No documents ready for signature"
                    description="No generated, signature-required documents are currently available for routing."
                  />
                </MhdCard>
              ) : null}

              {generatedDocuments.map((generation) => {
                const driveUrl = mhdBuildGoogleDriveViewUrl(generation.outputDriveFileId);
                const isSelected = generation.id === effectiveGenerationId;

                return (
                  <article
                    key={generation.id}
                    className={`rounded-2xl border p-4 transition-colors ${
                      isSelected ? 'border-accent bg-accent-tint' : 'border-border bg-muted/70'
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-foreground">
                            {generation.outputFileName || generation.templateName}
                          </h3>
                          <MhdBadge variant={STATUS_VARIANTS[generation.status] ?? 'neutral'}>
                            {generation.status}
                          </MhdBadge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {generation.referenceId} · {generation.templateName}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="rounded-full bg-card px-2.5 py-1">
                            Entity: {generation.entityType}
                          </span>
                          {generation.generatedAt ? (
                            <span className="rounded-full bg-card px-2.5 py-1">
                              Generated: {new Date(generation.generatedAt).toLocaleString()}
                            </span>
                          ) : null}
                          {generation.esignatureRequestId ? (
                            <span className="rounded-full bg-card px-2.5 py-1">
                              Linked request already exists
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {driveUrl ? (
                          <a
                            href={driveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(buttonBaseClasses, buttonVariantClasses.secondary, 'h-9 px-3')}
                          >
                            Open Document
                          </a>
                        ) : null}
                        {generation.esignatureRequestId ? (
                          <Link
                            to={`/esignature/${generation.esignatureRequestId}`}
                            className={cn(buttonBaseClasses, buttonVariantClasses.primary, 'h-9 px-3')}
                          >
                            Open Request
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedGenerationId(generation.id);
                              setActionError(null);
                              setActionMessage(null);
                            }}
                            className={cn(buttonBaseClasses, buttonVariantClasses.primary, 'h-9 px-3')}
                          >
                            Use for Request
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="rounded-2xl border border-border bg-muted p-4">
              <div className="flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-accent" />
                <h3 className="text-base font-semibold text-foreground">
                  Create Signature Request
                </h3>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Stage 5 requires a stored SHA-256 document hash before the sign step can succeed, so
                the request creator must provide the fingerprint here.
              </p>

              {!canMutate ? (
                <div className="mt-4 rounded-xl border border-border bg-card p-3 text-sm text-muted-foreground">
                  You can review request status and event timelines, but your role cannot create or
                  mutate signature requests.
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <label className="block text-sm font-medium text-foreground">
                    Selected generated document
                    <select
                      className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      value={effectiveGenerationId ?? ''}
                      onChange={(event) => setSelectedGenerationId(event.target.value || null)}
                    >
                      <option value="">Choose a generated document</option>
                      {generatedDocuments
                        .filter((generation) => !generation.esignatureRequestId)
                        .map((generation) => (
                          <option key={generation.id} value={generation.id}>
                            {generation.referenceId} ·{' '}
                            {generation.outputFileName || generation.templateName}
                          </option>
                        ))}
                    </select>
                  </label>

                  <label className="block text-sm font-medium text-foreground">
                    Document SHA-256
                    <input
                      value={documentHash}
                      onChange={(event) => setDocumentHash(event.target.value)}
                      placeholder="64-character hex digest"
                      className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 font-mono text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    />
                  </label>

                  <label className="block text-sm font-medium text-foreground">
                    Signing order
                    <select
                      className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      value={signingOrder}
                      onChange={(event) =>
                        setSigningOrder(event.target.value as MhdEsignatureSigningOrder)
                      }
                    >
                      <option value="SEQUENTIAL">Sequential</option>
                      <option value="PARALLEL">Parallel</option>
                    </select>
                  </label>

                  <label className="block text-sm font-medium text-foreground">
                    Expires at
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(event) => setExpiresAt(event.target.value)}
                      className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    />
                  </label>

                  <label className="block text-sm font-medium text-foreground">
                    Disclosure version
                    <input
                      value={disclosureVersion}
                      onChange={(event) => setDisclosureVersion(event.target.value)}
                      className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    />
                  </label>

                  <label className="block text-sm font-medium text-foreground">
                    Custom disclosure text
                    <textarea
                      value={disclosureText}
                      onChange={(event) => setDisclosureText(event.target.value)}
                      rows={4}
                      placeholder="Leave blank to use the backend default disclosure snapshot."
                      className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    />
                  </label>

                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">Signers</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setSigners((current) => [...current, createSignerRow('internal')])
                          }
                          className={cn(buttonBaseClasses, buttonVariantClasses.secondary, 'h-8 gap-1 px-3 text-xs')}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Internal
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setSigners((current) => [...current, createSignerRow('external')])
                          }
                          className={cn(buttonBaseClasses, buttonVariantClasses.secondary, 'h-8 gap-1 px-3 text-xs')}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          External
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 space-y-3">
                      {signers.map((row, index) => (
                        <div key={row.id} className="rounded-xl border border-border bg-card p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-foreground">
                              Signer {index + 1}
                            </p>
                            {signers.length > 1 ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setSigners((current) =>
                                    current.filter((candidate) => candidate.id !== row.id),
                                  )
                                }
                                className="text-xs font-semibold text-rose-700"
                              >
                                Remove
                              </button>
                            ) : null}
                          </div>

                          <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Signer type
                            <select
                              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                              value={row.kind}
                              onChange={(event) =>
                                updateSigner(row.id, (current) => ({
                                  ...current,
                                  kind: event.target.value as DraftSignerRow['kind'],
                                  userId: '',
                                  externalEmail: '',
                                  externalName: '',
                                }))
                              }
                            >
                              <option value="internal">Internal user</option>
                              <option value="external">External signer</option>
                            </select>
                          </label>

                          {row.kind === 'internal' ? (
                            <label className="mt-3 block text-sm font-medium text-foreground">
                              Internal user
                              <select
                                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                                value={row.userId}
                                onChange={(event) =>
                                  updateSigner(row.id, (current) => ({
                                    ...current,
                                    userId: event.target.value,
                                  }))
                                }
                              >
                                <option value="">Choose a user</option>
                                {users.map((user) => (
                                  <option key={user.id} value={user.id}>
                                    {user.displayName}
                                    {user.email ? ` (${user.email})` : ''}
                                  </option>
                                ))}
                              </select>
                            </label>
                          ) : (
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <label className="block text-sm font-medium text-foreground">
                                Signer name
                                <input
                                  value={row.externalName}
                                  onChange={(event) =>
                                    updateSigner(row.id, (current) => ({
                                      ...current,
                                      externalName: event.target.value,
                                    }))
                                  }
                                  className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                                />
                              </label>
                              <label className="block text-sm font-medium text-foreground">
                                Signer email
                                <input
                                  type="email"
                                  value={row.externalEmail}
                                  onChange={(event) =>
                                    updateSigner(row.id, (current) => ({
                                      ...current,
                                      externalEmail: event.target.value,
                                    }))
                                  }
                                  className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleCreateRequest()}
                    disabled={actions.createRequestFromGeneratedDocument.isPending}
                    className={cn(buttonBaseClasses, buttonVariantClasses.primary, 'w-full gap-2')}
                  >
                    <Send className="h-4 w-4" />
                    {actions.createRequestFromGeneratedDocument.isPending
                      ? 'Creating Request...'
                      : 'Create Signature Request'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </MhdCard>

        <MhdCard className="rounded-2xl p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-semibold text-foreground">Request List</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Open any request to inspect the signer chain, consent trail, and chronological event
                history.
              </p>
            </div>
            <label className="block text-sm font-medium text-foreground">
              Search
              <input
                value={requestSearchTerm}
                onChange={(event) => setRequestSearchTerm(event.target.value)}
                placeholder="Reference, document, or status"
                className="mt-1 w-full min-w-72 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </label>
          </div>

          {requestsQuery.error ? (
            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {requestsQuery.error instanceof Error
                ? requestsQuery.error.message
                : 'Unable to load signature requests.'}
            </div>
          ) : null}

          <div className="mt-5 grid gap-3">
            {filteredRequests.map((request) => (
              <Link
                key={request.id}
                to={`/esignature/${request.id}`}
                className="rounded-2xl border border-border bg-muted/70 p-4 transition-colors hover:border-accent hover:bg-accent-tint/60"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">
                        {request.documentName}
                      </h3>
                      <MhdBadge variant={STATUS_VARIANTS[request.status] ?? 'neutral'}>
                        {request.status}
                      </MhdBadge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{request.referenceId}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-card px-2.5 py-1">
                        Order: {request.signingOrder}
                      </span>
                      {request.completedAt ? (
                        <span className="rounded-full bg-card px-2.5 py-1">
                          Completed: {new Date(request.completedAt).toLocaleString()}
                        </span>
                      ) : null}
                      {request.expiresAt ? (
                        <span className="rounded-full bg-card px-2.5 py-1">
                          Expires: {new Date(request.expiresAt).toLocaleString()}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="text-right text-xs text-muted-foreground">
                    <p>Created {new Date(request.createdAt).toLocaleString()}</p>
                    <p className="mt-1 font-medium text-accent">Open detail</p>
                  </div>
                </div>
              </Link>
            ))}

            {!requestsQuery.isLoading && filteredRequests.length === 0 ? (
              <MhdCard className="border-dashed">
                <MhdEmptyState
                  icon={Mail}
                  title="No signature requests"
                  description="No signature requests match the current filter."
                />
              </MhdCard>
            ) : null}
          </div>
        </MhdCard>
      </div>
    </div>
  );
}
