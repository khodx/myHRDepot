import {
  MHD_HANDBOOK_ATTORNEY_PLACEHOLDER,
  mhdFormatHandbookJurisdiction,
  type MhdHandbookPreviewRow,
} from '../Types';
import { MhdHandbookAttorneyPendingBanner } from './MhdHandbookAttorneyPendingBanner';

interface Props {
  rows: MhdHandbookPreviewRow[];
  isLoading?: boolean;
}

/**
 * The assembled DRAFT preview — the included sections in publish order, with their
 * bodies. This is a SHELL: every body is an attorney-flagged placeholder, so the
 * prominent banner leads and each body is rendered as clearly-marked placeholder
 * text, NEVER as real policy. (A published version renders the same way via
 * `MhdHandbookVersionView`; the difference is only that a version is frozen.)
 */
export function MhdHandbookPreview({ rows, isLoading = false }: Props) {
  if (isLoading) {
    return <p className="text-sm text-neutral-500">Assembling preview…</p>;
  }

  return (
    <div className="space-y-4">
      <MhdHandbookAttorneyPendingBanner />

      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No sections are included yet. Add optional sections, or check the required set.
        </p>
      ) : (
        <ol className="space-y-4">
          {rows.map((row) => {
            // A raw placeholder body is the expected shell state; render it as a
            // muted, italicised placeholder rather than as prose that could pass
            // for policy.
            const isPlaceholder = row.bodyPlaceholder.trim() === MHD_HANDBOOK_ATTORNEY_PLACEHOLDER;
            return (
              <li key={row.sectionId} className="rounded-md border border-neutral-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-neutral-900">{row.title}</h3>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                    {mhdFormatHandbookJurisdiction(row.jurisdiction)}
                  </span>
                </div>
                <p
                  className={
                    isPlaceholder
                      ? 'mt-2 text-sm italic text-neutral-400'
                      : 'mt-2 text-sm text-neutral-700'
                  }
                >
                  {row.bodyPlaceholder}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
