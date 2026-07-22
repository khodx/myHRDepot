import {
  mhdFormatLeaveHours,
  mhdFormatLeaveJurisdiction,
  mhdFormatLeaveMeasurementMethod,
  type MhdLeaveBalanceRow,
} from '../Types';

interface Props {
  /** One entry per designated legal basis. */
  rows: MhdLeaveBalanceRow[];
  isLoading?: boolean;
}

/**
 * Remaining leave, shown as ONE ROW PER LEGAL BASIS — never a single total.
 *
 * This is the whole point of the module. An employee on leave may be covered by
 * FMLA, CFRA and PDL at once, each with its own independent clock. FMLA
 * remaining, CFRA remaining and PDL remaining are distinct quantities; a given
 * interval of absence decrements every basis it qualifies under and leaves the
 * rest untouched.
 *
 * Summing these into one "leave remaining" figure would erase the concurrency
 * model and recreate the exact liability the design exists to avoid — the
 * pregnancy stack (PDL with FMLA concurrent, then fresh CFRA bonding, ~7 months
 * total) that a single 12-week counter wrongly caps. So there is deliberately no
 * total row here, and adding one would be a bug, not a convenience.
 */
export function MhdLeaveBalancePanel({ rows, isLoading = false }: Props) {
  if (isLoading) {
    return <p className="text-sm text-neutral-500">Loading balances…</p>;
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No legal bases designated yet. Choose the bases this leave counts against to see each
        remaining balance.
      </p>
    );
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-neutral-900">Remaining by legal basis</h2>
        <p className="mt-0.5 text-xs text-neutral-500">
          Each basis is a separate clock. These are shown individually and are never added
          together — exhausting one does not exhaust another.
        </p>
      </div>

      <ul className="space-y-2">
        {rows.map(({ leaveType, remainingHours }) => {
          const entitlement = leaveType.entitlementHours;
          const overdrawn = remainingHours < 0;
          return (
            <li
              key={leaveType.id}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-md border border-neutral-200 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {leaveType.typeName}
                  <span className="ml-2 text-xs font-normal text-neutral-500">
                    {mhdFormatLeaveJurisdiction(leaveType.jurisdiction)}
                    {leaveType.isGlobal ? ' · standard' : ' · company'}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {mhdFormatLeaveMeasurementMethod(leaveType.measurementMethod)}
                  {entitlement != null ? ` · entitlement ${mhdFormatLeaveHours(entitlement)}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-lg font-semibold tabular-nums ${
                    overdrawn ? 'text-rose-700' : 'text-neutral-900'
                  }`}
                >
                  {mhdFormatLeaveHours(remainingHours)}
                </p>
                <p className="text-xs text-neutral-500">remaining</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
