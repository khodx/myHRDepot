import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import {
  MhdHandbookRecordTabs,
  type MhdHandbookRecordTab,
} from '@/appshell/components/MhdHandbookRecordTabs';
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
  /** Which record tab this route renders. Defaults to 'detail'. */
  activeTab?: MhdHandbookRecordTab;
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
  activeTab = 'detail',
  onGenerateDocument,
  onRequestSignature,
}: Props) {
  const isDraft = handbook.status === 'DRAFT';

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title={handbook.title}
        backTo="/handbooks"
        backLabel="Handbooks"
        chips={
          <>
            <MhdHandbookTypeBadge handbookType={handbook.handbookType} />
            <MhdHandbookStatusBadge status={handbook.status} />
          </>
        }
        description={<span className="font-mono text-xs">{handbook.referenceId}</span>}
      />

      <MhdHandbookRecordTabs handbookId={handbook.id} active={activeTab} />

      {isDraft ? (
        activeTab === 'acknowledgments' ? (
          <MhdCard>
            <p className="text-sm text-muted-foreground">
              Acknowledgments become available once this handbook is published.
            </p>
          </MhdCard>
        ) : (
          <MhdHandbookDraftEditor
            handbook={handbook}
            companyId={companyId}
            canManage={canManage}
            onGenerateDocument={onGenerateDocument}
          />
        )
      ) : (
        <MhdHandbookPublishedView
          handbook={handbook}
          companyId={companyId}
          activeTab={activeTab}
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
  companyId: string;
  canManage: boolean;
  onGenerateDocument?: (handbookId: string) => Promise<string | null>;
}

function MhdHandbookDraftEditor({ handbook, companyId, canManage, onGenerateDocument }: DraftProps) {
  // The full library for the pack (global + this company's own sections);
  // filtered to this draft's jurisdictions below. `companyId` is REQUIRED as of
  // 0184 — see MhdHandbookSectionFilters.
  const sections = useMhdHandbookSections({ companyId, handbookType: handbook.handbookType });
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
        <h2 className="text-base font-semibold text-foreground">Sections</h2>
        {sections.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading sections…</p>
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
        <h2 className="text-base font-semibold text-foreground">Preview</h2>
        <MhdHandbookPreview rows={preview.data ?? []} isLoading={preview.isLoading} />

        {canManage ? (
          <MhdCard className="space-y-2">
            <label htmlFor="effectiveDate" className="block text-sm font-medium text-foreground">
              Effective date <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <MhdDateField
              id="effectiveDate"
              value={effectiveDate}
              onChange={(nextValue) => setEffectiveDate(nextValue)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Publishing freezes an immutable version with a content hash. A later change is a new
              version, not an edit.
            </p>
            <Button
              className="w-full"
              onClick={() => void handlePublish()}
              disabled={publish.isPending || isPreparingDocument}
            >
              {isPreparingDocument
                ? 'Preparing document…'
                : publish.isPending
                  ? 'Publishing…'
                  : 'Publish handbook'}
            </Button>
            {/* Surface the server's publish error (e.g. "no included sections"). */}
            {publish.isError ? (
              <p className="text-xs text-rose-600">
                {publish.error instanceof Error ? publish.error.message : 'Could not publish.'}
              </p>
            ) : null}
          </MhdCard>
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
  activeTab: MhdHandbookRecordTab;
  onRequestSignature?: (personId: string) => Promise<string | null>;
}

function MhdHandbookPublishedView({
  handbook,
  companyId,
  activeTab,
  onRequestSignature,
}: PublishedProps) {
  const archive = useMhdArchiveHandbook();
  const versionId = handbook.currentVersionId;

  if (activeTab === 'acknowledgments') {
    if (versionId && handbook.status === 'PUBLISHED') {
      return (
        <MhdHandbookAckBoard
          companyId={companyId}
          versionId={versionId}
          onRequestSignature={onRequestSignature}
        />
      );
    }
    return (
      <MhdCard>
        <p className="text-sm text-muted-foreground">
          {handbook.status === 'PUBLISHED'
            ? 'This handbook has no published version.'
            : 'Acknowledgments are only tracked while a handbook is published.'}
        </p>
      </MhdCard>
    );
  }

  return (
    <div className="space-y-8">
      {versionId ? (
        <MhdHandbookVersionView versionId={versionId} />
      ) : (
        <p className="text-sm text-muted-foreground">This handbook has no published version.</p>
      )}

      {handbook.status === 'PUBLISHED' ? (
        <MhdCard>
          <p className="text-sm text-muted-foreground">
            Archiving retires this handbook. A company keeps one live handbook per type at a time.
          </p>
          <Button
            variant="secondary"
            className="mt-2"
            onClick={() => void archive.mutateAsync(handbook.id)}
            disabled={archive.isPending}
          >
            {archive.isPending ? 'Archiving…' : 'Archive handbook'}
          </Button>
          {archive.isError ? (
            <p className="mt-1 text-xs text-rose-600">
              {archive.error instanceof Error ? archive.error.message : 'Could not archive.'}
            </p>
          ) : null}
        </MhdCard>
      ) : null}
    </div>
  );
}
