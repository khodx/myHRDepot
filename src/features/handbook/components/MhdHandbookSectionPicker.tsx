import { useMemo } from 'react';
import { mhdFormatHandbookJurisdiction, type MhdHandbookSection } from '../Types';

interface Props {
  /**
   * The candidate library sections for this handbook's chosen jurisdictions
   * (from `section_list`, filtered to the draft's jurisdictions). Required
   * sections render locked-on; optional ones are toggleable.
   */
  sections: MhdHandbookSection[];
  /** The section ids currently INCLUDED in the draft (derived from `preview`). */
  includedSectionIds: Set<string>;
  /**
   * Flip an optional section. A required section is never handed here — its
   * control is disabled and the RPC refuses its exclusion anyway.
   */
  onToggle: (sectionId: string, included: boolean) => void;
  /** True while a toggle is in flight, or when the handbook is not an editable DRAFT. */
  disabled: boolean;
}

/**
 * The section picker for the wizard's edit step: REQUIRED sections shown
 * locked-on (they auto-include and cannot be excluded — the server refuses it),
 * OPTIONAL sections shown as toggles. Grouped by jurisdiction for legibility.
 *
 * This edits only which sections are INCLUDED. It never edits clause BODIES —
 * those are attorney content and are not freely editable in this shell (the whole
 * placeholder posture guards against editing attorney clauses).
 */
export function MhdHandbookSectionPicker({
  sections,
  includedSectionIds,
  onToggle,
  disabled,
}: Props) {
  const byJurisdiction = useMemo(() => {
    const groups = new Map<string, MhdHandbookSection[]>();
    for (const section of sections) {
      const list = groups.get(section.jurisdiction) ?? [];
      list.push(section);
      groups.set(section.jurisdiction, list);
    }
    // Keep each group in the library's sort order.
    for (const list of groups.values()) list.sort((a, b) => a.sortOrder - b.sortOrder);
    return [...groups.entries()];
  }, [sections]);

  if (sections.length === 0) {
    return <p className="text-sm text-neutral-500">No sections available for these jurisdictions.</p>;
  }

  return (
    <div className="space-y-6">
      {byJurisdiction.map(([jurisdiction, list]) => (
        <div key={jurisdiction} className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {mhdFormatHandbookJurisdiction(jurisdiction)}
          </h3>
          <ul className="space-y-1">
            {list.map((section) => {
              const included = section.isRequired || includedSectionIds.has(section.id);
              return (
                <li
                  key={section.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 px-3 py-2"
                >
                  <label className="flex items-center gap-2 text-sm text-neutral-800">
                    <input
                      type="checkbox"
                      checked={included}
                      // Required sections are locked on; only optional ones toggle.
                      disabled={disabled || section.isRequired}
                      onChange={(event) => onToggle(section.id, event.target.checked)}
                      className="h-4 w-4 rounded border-neutral-300 disabled:opacity-50"
                    />
                    <span>{section.title}</span>
                  </label>
                  {section.isRequired ? (
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                      Required
                    </span>
                  ) : (
                    <span className="text-xs text-neutral-400">Optional</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
