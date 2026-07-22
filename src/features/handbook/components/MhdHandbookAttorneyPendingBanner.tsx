// The persistent draft-review banner. Handbook clause bodies are real DRAFT content
// authored for review, not yet finalized by counsel. Both the draft preview and the
// frozen version view render this so a reader always sees the content is pending legal
// review before it is published to or relied on by an employee. It must stay
// prominent — this is the disclaimer the module posture depends on until counsel signs off.
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
        <p className="font-semibold">Draft — pending legal review.</p>
        <p className="mt-0.5 text-amber-800">
          This handbook content is a draft prepared for review. It has not been finalized by
          counsel and should be confirmed with your attorney before it is published to or relied
          on by an employee.
        </p>
      </div>
    </div>
  );
}
