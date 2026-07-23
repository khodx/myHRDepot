import type { MhdJobFunction } from '../Types';

interface Props {
  essential: MhdJobFunction[];
  marginal: MhdJobFunction[];
  /** Read-only rendering for a published version or the employee's own view. */
  readOnly?: boolean;
  onEdit?: () => void;
}

/**
 * Essential and marginal functions, rendered as two distinct lists.
 *
 * They are deliberately not merged into one list with a marker. The
 * essential/marginal distinction is the reference point for a
 * reasonable-accommodation analysis and for defending an adverse action, and a
 * reader skimming a single list will not reliably absorb which is which. Two
 * headed lists make the distinction unmissable, which is the whole reason these
 * are separate rows rather than prose.
 */
export function MhdEssentialFunctionList({ essential, marginal, readOnly = true, onEdit }: Props) {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-foreground">Essential functions</h3>
        {!readOnly && onEdit ? (
          <button type="button" onClick={onEdit} className="text-xs font-medium text-accent hover:text-accent-hover">
            Edit functions
          </button>
        ) : null}
      </div>

      {essential.length === 0 ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          No essential functions recorded. A description cannot be published without at least one —
          they are the basis of any accommodation analysis.
        </p>
      ) : (
        <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
          {essential.map((fn, index) => (
            <li key={`essential-${index}`}>{fn.text}</li>
          ))}
        </ul>
      )}

      {marginal.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-foreground">Marginal functions</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Part of the role, but not the basis for evaluating whether it can be performed.
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-foreground">
            {marginal.map((fn, index) => (
              <li key={`marginal-${index}`}>{fn.text}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
