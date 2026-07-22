import { useMhdHandbookVersion } from '../Hook';
import {
  MHD_HANDBOOK_ATTORNEY_PLACEHOLDER,
  mhdFormatHandbookJurisdiction,
} from '../Types';
import { MhdHandbookAttorneyPendingBanner } from './MhdHandbookAttorneyPendingBanner';

interface Props {
  versionId: string;
}

/**
 * A FROZEN published version, read-only.
 *
 * `assembledContent` is an immutable jsonb snapshot an employee acknowledged
 * against a date — it is RENDERED, never edited. Editing the clause library later
 * never touches this; a correction is a new version. The content hash is shown as
 * the integrity anchor for exactly that reason.
 *
 * This remains a SHELL: each frozen body is the attorney-flagged placeholder as it
 * stood at publish, so the attorney-pending banner leads and bodies render as
 * clearly-marked placeholders — never as real policy.
 */
export function MhdHandbookVersionView({ versionId }: Props) {
  const version = useMhdHandbookVersion(versionId);

  if (version.isLoading) {
    return <p className="text-sm text-neutral-500">Loading version…</p>;
  }
  if (version.isError) {
    return (
      <p className="text-sm text-rose-600">
        {version.error instanceof Error ? version.error.message : 'Could not load the version.'}
      </p>
    );
  }
  if (!version.data) {
    return <p className="text-sm text-neutral-500">Version not found.</p>;
  }

  const v = version.data;

  return (
    <div className="space-y-4">
      <MhdHandbookAttorneyPendingBanner />

      <header className="rounded-md border border-neutral-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">
              Version {v.versionNumber}
            </h2>
            <p className="font-mono text-xs text-neutral-400">{v.referenceId}</p>
          </div>
          <div className="text-right text-xs text-neutral-500">
            <p>Published {new Date(v.publishedAt).toLocaleString()}</p>
            {v.effectiveDate ? <p>Effective {v.effectiveDate}</p> : null}
          </div>
        </div>
        {/* The integrity anchor: the sha256 of the frozen content. It is what makes
            "this is the exact text the employee acknowledged" verifiable — the
            reason the version is immutable. */}
        <p className="mt-3 break-all font-mono text-xs text-neutral-500">
          <span className="font-medium text-neutral-600">Content hash:</span> {v.contentHash}
        </p>
        {/* Soft link to the rendered document (app-layer doc-gen). Present only if
            the host route rendered one and passed its id at publish. */}
        {v.documentGenerationId ? (
          <p className="mt-1 font-mono text-xs text-neutral-400">
            Document generation: {v.documentGenerationId}
          </p>
        ) : null}
      </header>

      {v.assembledContent.length === 0 ? (
        <p className="text-sm text-neutral-500">This version has no sections.</p>
      ) : (
        <ol className="space-y-4">
          {v.assembledContent.map((section, index) => {
            const isPlaceholder = section.body.trim() === MHD_HANDBOOK_ATTORNEY_PLACEHOLDER;
            return (
              <li
                key={`${section.sectionKey}-${index}`}
                className="rounded-md border border-neutral-200 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-neutral-900">{section.title}</h3>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                    {mhdFormatHandbookJurisdiction(section.jurisdiction)}
                  </span>
                </div>
                {/* Frozen, read-only — rendered exactly as snapshotted. */}
                <p
                  className={
                    isPlaceholder
                      ? 'mt-2 text-sm italic text-neutral-400'
                      : 'mt-2 text-sm text-neutral-700'
                  }
                >
                  {section.body}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
