import { useMemo, useState } from 'react';
import {
  useMhdArchiveHandbook,
  useMhdHandbookPreview,
  useMhdHandbookSections,
  useMhdPublishHandbook,
  useMhdToggleHandbookSection,
} from '../Hook';
import type { MhdHandbook } from '../Types';
import { MhdHandbookAckBoard } from './MhdHandbookAckBoard';
import { MhdHandbookPreview } from './MhdHandbookPreview';
import { MhdHandbookSectionPicker } from './MhdHandbookSectionPicker';
import { MhdHandbookStatusBadge } from './MhdHandbookStatusBadge';
import { MhdHandbookTypeBadge } from './MhdHandbookTypeBadge';
import { MhdHandbookVersionView } from './MhdHandbookVersionView';

interface Props {
  handbook: MhdHandbook;
  companyId: string;
  /** Governs the edit/publish/archive affordances. The RPCs re-check the role regardless. */
  canManage: boolean;
  /**
   * APP-LAYER publish ceremony hook. When provided, the host route renders the
   * handbook document (doc-gen) and resolves to its id, forwarded to `publish` as
   * the `documentGenerationId` soft link. When absent, publish freezes the version
   * with no document link (the shell path). This module never invents a Doc-Gen
   * RPC; it only forwards the id an injected callback returns.
   */
  onGenerateDocument?: (handbookId: string) => Promise<string | null>;
  /** APP-LAYER e-sign ceremony hook, forwarded to the ack board (see there). */
  onRequestSignature?: (personId: string) => Promise<string | null>;
}

/**
 * The handbook wizard.
 *
 * A DRAFT is editable: toggle optional sections, watch the assembled preview,
 * then publish. Once PUBLISHED the handbook is a FROZEN artifact — the wizard
 * stops showing editable selections and instead renders the frozen version
 * (`MhdHandbookVersionView`) plus the acknowledgment board. Only a DRAFT can be
 * edited; the toggle RPC refuses a non-DRAFT, so the picker is simply not shown
 * once published.
 *
 * SHELL: the preview and version bodies are attorney-flagged placeholders and are
 * rendered as such (both surfaces carry the attorney-pending banner).
 */
export function MhdHandbookWizard({
  handbook,
  companyId,
  canManage,
  onGenerateDocument,
  onRequestSignature,
}: Props) {
  const isDraft = handbook.status === 'DRAFT';

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-neutral-900">{handbook.title}</h1>
            <MhdHandbookTypeBadge handbookType={handbook.handbookType} />
            <MhdHandbookStatusBadge status={handbook.status} />
          </div>
          <p className="mt-1 font-mono text-xs text-neutral-400">{handbook.referenceId}</p>
        </div>
      </header>

      {isDraft ? (
        <MhdHandbookDraftEditor
          handbook={handbook}
          canManage={canManage}
          onGenerateDocument={onGenerateDocument}
        />
      ) : (
        <MhdHandbookPublishedView
          handbook={handbook}
          companyId={companyId}
          onRequestSignature={onRequestSignature}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Draft editor — the editable path
// ---------------------------------------------------------------------------

interface DraftProps {
  handbook: MhdHandbook;
  canManage: boolean;
  onGenerateDocument?: (handbookId: string) => Promise<string | null>;
}

function MhdHandbookDraftEditor({ handbook, canManage, onGenerateDocument }: DraftProps) {
  // The full library for the pack; filtered to this draft's jurisdictions below.
  const sections = useMhdHandbookSections({ handbookType: handbook.handbookType });
  const preview = useMhdHandbookPreview(handbook.id);
  const toggle = useMhdToggleHandbookSection();
  const publish = useMhdPublishHandbook();

  const [effectiveDate, setEffectiveDate] = useState('');
  const [isPreparingDocument, setIsPreparingDocument] = useState(false);

  const candidateSections = useMemo(
    () =>
      (sections.data ?? []).filter((section) =>
        handbook.jurisdictions.includes(section.jurisdiction),
      ),
    [sections.data, handbook.jurisdictions],
  );

  const includedSectionIds = useMemo(
    () => new Set((preview.data ?? []).map((row) => row.sectionId)),
    [preview.data],
  );

  function handleToggle(sectionId: string, included: boolean) {
    // Fire-and-forget; the hook invalidates the preview on success. The server
    // refuses excluding a required section — the picker disables those anyway.
    void toggle.mutateAsync({ handbookId: handbook.id, sectionId, included });
  }

  async function handlePublish() {
    // App-layer publish ceremony: render the document first if wired, forward its
    // id; otherwise publish with no document link (shell path).
    let documentGenerationId: string | null = null;
    if (onGenerateDocument) {
      setIsPreparingDocument(true);
      try {
        documentGenerationId = await onGenerateDocument(handbook.id);
      } finally {
        setIsPreparingDocument(false);
      }
    }
    await publish.mutateAsync({
      handbookId: handbook.id,
      effectiveDate: effectiveDate || null,
      documentGenerationId,
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-neutral-900">Sections</h2>
        {sections.isLoading ? (
          <p className="text-sm text-neutral-500">Loading sections…</p>
        ) : (
          <MhdHandbookSectionPicker
            sections={candidateSections}
            includedSectionIds={includedSectionIds}
            onToggle={handleToggle}
            disabled={!canManage || toggle.isPending}
          />
        )}
        {toggle.isError ? (
          <p className="text-xs text-rose-600">
            {toggle.error instanceof Error ? toggle.error.message : 'Could not update the section.'}
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-neutral-900">Preview</h2>
        <MhdHandbookPreview rows={preview.data ?? []} isLoading={preview.isLoading} />

        {canManage ? (
          <div className="space-y-2 rounded-md border border-neutral-200 p-4">
            <label htmlFor="effectiveDate" className="block text-sm font-medium text-neutral-700">
              Effective date <span className="font-normal text-neutral-500">(optional)</span>
            </label>
            <input
              id="effectiveDate"
              type="date"
              value={effectiveDate}
              onChange={(event) => setEffectiveDate(event.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
            <p className="text-xs text-neutral-500">
              Publishing freezes an immutable version with a content hash. A later change is a new
              version, not an edit.
            </p>
            <button
              type="button"
              onClick={() => void handlePublish()}
              disabled={publish.isPending || isPreparingDocument}
              className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isPreparingDocument
                ? 'Preparing document…'
                : publish.isPending
                  ? 'Publishing…'
                  : 'Publish handbook'}
            </button>
            {/* Surface the server's publish error (e.g. "no included sections"). */}
            {publish.isError ? (
              <p className="text-xs text-rose-600">
                {publish.error instanceof Error ? publish.error.message : 'Could not publish.'}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Published / archived view — the frozen path
// ---------------------------------------------------------------------------

interface PublishedProps {
  handbook: MhdHandbook;
  companyId: string;
  onRequestSignature?: (personId: string) => Promise<string | null>;
}

function MhdHandbookPublishedView({ handbook, companyId, onRequestSignature }: PublishedProps) {
  const archive = useMhdArchiveHandbook();
  const versionId = handbook.currentVersionId;

  return (
    <div className="space-y-8">
      {versionId ? (
        <>
          <MhdHandbookVersionView versionId={versionId} />
          {handbook.status === 'PUBLISHED' ? (
            <MhdHandbookAckBoard
              companyId={companyId}
              versionId={versionId}
              onRequestSignature={onRequestSignature}
            />
          ) : null}
        </>
      ) : (
        <p className="text-sm text-neutral-500">This handbook has no published version.</p>
      )}

      {handbook.status === 'PUBLISHED' ? (
        <div className="rounded-md border border-neutral-200 p-4">
          <p className="text-sm text-neutral-600">
            Archiving retires this handbook. A company keeps one live handbook per type at a time.
          </p>
          <button
            type="button"
            onClick={() => void archive.mutateAsync(handbook.id)}
            disabled={archive.isPending}
            className="mt-2 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 disabled:opacity-50"
          >
            {archive.isPending ? 'Archiving…' : 'Archive handbook'}
          </button>
          {archive.isError ? (
            <p className="mt-1 text-xs text-rose-600">
              {archive.error instanceof Error ? archive.error.message : 'Could not archive.'}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
