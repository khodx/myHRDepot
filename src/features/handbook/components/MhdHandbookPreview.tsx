import { MhdBadge } from '@/components/ui/MhdBadge';
import {
  MHD_HANDBOOK_ATTORNEY_PLACEHOLDER,
  mhdFormatHandbookJurisdiction,
  mhdHandbookIndentStyle,
  type MhdHandbookPreviewRow,
} from '../Types';
import { MhdHandbookAttorneyPendingBanner } from './MhdHandbookAttorneyPendingBanner';
import { MhdHandbookBody } from './MhdHandbookBody';

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
    return <p className="text-sm text-muted-foreground">Assembling preview…</p>;
  }

  return (
    <div className="space-y-4">
      <MhdHandbookAttorneyPendingBanner />

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No sections are included yet. Add optional sections, or check the required set.
        </p>
      ) : (
        <ol className="space-y-4" aria-label="Handbook outline">
          {rows.map((row) => {
            // A raw placeholder body is the expected shell state; render it as a
            // muted, italicised placeholder rather than as prose that could pass
            // for policy.
            const isPlaceholder = row.bodyPlaceholder.trim() === MHD_HANDBOOK_ATTORNEY_PLACEHOLDER;
            return (
              <li
                key={row.sectionId}
                style={mhdHandbookIndentStyle(row.depth)}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    <span className="mr-2 font-mono text-xs text-muted-foreground">
                      {row.outlineNumber}
                    </span>
                    {row.title}
                  </h3>
                  <MhdBadge variant="neutral">
                    {mhdFormatHandbookJurisdiction(row.jurisdiction)}
                  </MhdBadge>
                </div>
                <MhdHandbookBody
                  body={row.bodyPlaceholder}
                  sectionTitle={row.title}
                  muted={isPlaceholder}
                />
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
