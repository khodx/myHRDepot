import { useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdDocumentGenerationPanel } from '@/components/ui/MhdDocumentGenerationPanel';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdStepper } from '@/components/ui/MhdStepper';
import { useMhdWizardFlow, type MhdWizardStepDefinition } from '@/utils/useMhdWizardFlow';
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
import {
  MHD_HANDBOOK_EXPORT_ENTITY_TYPE,
  MHD_HANDBOOK_EXPORT_TEMPLATE_KEY,
  type MhdHandbook,
  type MhdHandbookPreviewRow,
} from '../Types';
import { MhdHandbookAckBoard } from './MhdHandbookAckBoard';
import { MhdHandbookAckPolicyCard } from './MhdHandbookAckPolicyCard';
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
}

/**
 * The handbook wizard.
 *
 * A DRAFT is stepped through by someone who may manage it — Sections, Acknowledgment,
 * then Preview & Publish; a person who may only read it sees the sections and preview. Once PUBLISHED the handbook is a FROZEN artifact — the wizard
 * stops showing editable selections and instead renders the frozen version
 * (`MhdHandbookVersionView`) plus the acknowledgment board. Only a DRAFT can be
 * edited; the toggle RPC refuses a non-DRAFT, so the picker is simply not shown
 * once published.
 *
 * SHELL: the preview and version bodies are attorney-flagged placeholders and are
 * rendered as such (both surfaces carry the attorney-pending banner).
 */
export function MhdHandbookWizard({ handbook, companyId, canManage, activeTab = 'detail' }: Props) {
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
          <MhdHandbookDraftEditor handbook={handbook} companyId={companyId} canManage={canManage} />
        )
      ) : (
        <MhdHandbookPublishedView
          handbook={handbook}
          companyId={companyId}
          canManage={canManage}
          activeTab={activeTab}
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
}

function MhdHandbookDraftEditor({ handbook, companyId, canManage }: DraftProps) {
  // The full library for the pack (global + this company's own sections);
  // filtered to this draft's jurisdictions below. `companyId` is REQUIRED as of
  // 0184 — see MhdHandbookSectionFilters.
  const sections = useMhdHandbookSections({ companyId, handbookType: handbook.handbookType });
  const preview = useMhdHandbookPreview(handbook.id);
  const toggle = useMhdToggleHandbookSection();

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
    // `mutate`, not `mutateAsync`: the hook invalidates the preview on success, and a
    // server refusal (a required section, or the same clause twice) is shown below from
    // `toggle.error` rather than thrown as an unhandled rejection.
    toggle.mutate({ handbookId: handbook.id, sectionId, included });
  }

  const sectionsPicker = (
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
  );

  // Someone who can see a draft but not manage it reads it as before: sections and the
  // assembled preview side by side, nothing to step through or publish.
  if (!canManage) {
    return (
      <div className="grid gap-8 lg:grid-cols-2">
        {sectionsPicker}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Preview</h2>
          <MhdHandbookPreview rows={preview.data ?? []} isLoading={preview.isLoading} />
        </section>
      </div>
    );
  }

  return (
    <MhdHandbookPublishStepper
      handbook={handbook}
      sectionsPicker={sectionsPicker}
      previewRows={preview.data ?? []}
      previewLoading={preview.isLoading}
    />
  );
}

interface PublishStepperProps {
  handbook: MhdHandbook;
  sectionsPicker: ReactNode;
  previewRows: MhdHandbookPreviewRow[];
  previewLoading: boolean;
}

/**
 * Setup → Acknowledgment → Preview & Publish for a DRAFT the person may manage.
 *
 * Each section toggle and the acknowledgment policy save as they are changed (the same
 * RPCs as before), so nothing here is unsaved and leaving the page loses nothing; the one
 * step that matters is the last, which freezes the version. Publishing re-renders the page
 * as the published record, where the document is exported on demand.
 */
function MhdHandbookPublishStepper({
  handbook,
  sectionsPicker,
  previewRows,
  previewLoading,
}: PublishStepperProps) {
  const publish = useMhdPublishHandbook();
  const [effectiveDate, setEffectiveDate] = useState('');

  const steps: MhdWizardStepDefinition[] = [
    {
      id: 'sections',
      title: 'Sections',
      description: 'Choose the sections this handbook includes.',
      validate: () =>
        previewRows.length > 0 ? null : 'Include at least one section before continuing.',
    },
    {
      id: 'acknowledgment',
      title: 'Acknowledgment',
      description: 'Who must acknowledge the handbook, and whether a signature is required.',
    },
    {
      id: 'publish',
      title: 'Preview & Publish',
      description: 'Review the assembled handbook and freeze it.',
    },
  ];

  const flow = useMhdWizardFlow({
    steps,
    fallbackError: 'Could not publish.',
    // Publishing freezes the version. The document itself is exported on demand from the
    // published page, so there is nothing to render here.
    onSubmit: async () => {
      await publish.mutateAsync({ handbookId: handbook.id, effectiveDate: effectiveDate || null });
    },
  });

  function renderStep() {
    switch (flow.currentStep?.id) {
      case 'sections':
        return sectionsPicker;
      case 'acknowledgment':
        return <MhdHandbookAckPolicyCard handbook={handbook} canManage />;
      default:
        return (
          <div className="grid gap-8 lg:grid-cols-2">
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">Preview</h2>
              <MhdHandbookPreview rows={previewRows} isLoading={previewLoading} />
            </section>
            <MhdCard className="space-y-2 self-start">
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
                Publishing freezes an immutable version with a content hash. A later change is a
                new version, not an edit.
              </p>
            </MhdCard>
          </div>
        );
    }
  }

  return (
    <div className="space-y-4">
      <MhdStepper {...flow.stepperProps} submitLabel="Publish Handbook" />
      <MhdCard>
        <h2 className="text-lg font-semibold text-foreground">{flow.currentStep?.title}</h2>
        <div className="mt-4">{renderStep()}</div>
        {flow.error ? (
          <p role="alert" className="mt-4 text-sm text-rose-700">
            {flow.error}
          </p>
        ) : null}
      </MhdCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Published / archived view — the frozen path
// ---------------------------------------------------------------------------

interface PublishedProps {
  handbook: MhdHandbook;
  companyId: string;
  canManage: boolean;
  activeTab: MhdHandbookRecordTab;
}

function MhdHandbookPublishedView({ handbook, companyId, canManage, activeTab }: PublishedProps) {
  const archive = useMhdArchiveHandbook();
  const versionId = handbook.currentVersionId;

  if (activeTab === 'acknowledgments') {
    if (versionId && handbook.status === 'PUBLISHED') {
      return (
        <MhdHandbookAckBoard
          companyId={companyId}
          versionId={versionId}
          requiresSignature={handbook.requiresSignature}
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
        <MhdHandbookAckPolicyCard handbook={handbook} canManage={canManage} />
      ) : null}

      {versionId ? (
        <MhdCard>
          <h3 className="text-sm font-semibold text-foreground">Export</h3>
          <p className="mb-4 mt-1 text-xs text-muted-foreground">
            Generate the complete handbook for this published version as a PDF or Word document.
            Word is available to administrators only; the document is always built from the frozen
            version, never from the live library.
          </p>
          <MhdDocumentGenerationPanel
            entityType={MHD_HANDBOOK_EXPORT_ENTITY_TYPE}
            entityId={versionId}
            companyId={companyId}
            masterTemplateKey={MHD_HANDBOOK_EXPORT_TEMPLATE_KEY}
          />
        </MhdCard>
      ) : null}

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
