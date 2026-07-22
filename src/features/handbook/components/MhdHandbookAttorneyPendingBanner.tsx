// The load-bearing SHELL banner. Every clause body in this module is an
// attorney-flagged placeholder (`[ATTORNEY-DRAFTED CONTENT — PLACEHOLDER]`), never
// real legal text. Both the draft preview and the frozen version view render this
// so a human can NEVER mistake the placeholder skeleton for real policy. It must
// stay prominent — this is the guard the whole module posture depends on: no
// placeholder text here is legal content or may be shown to a real employee as-is.
export function MhdHandbookAttorneyPendingBanner() {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3"
    >
      <span aria-hidden className="mt-0.5 text-amber-700">
        ⚠
      </span>
      <div className="text-sm text-amber-900">
        <p className="font-semibold">Attorney content pending — placeholders shown.</p>
        <p className="mt-0.5 text-amber-800">
          This is a structural shell. Every section body below is an attorney-flagged placeholder,
          not legal content. Nothing here may be published to or relied on by a real employee until
          the attorney-drafted clauses are loaded.
        </p>
      </div>
    </div>
  );
}
