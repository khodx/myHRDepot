import { MhdBadge } from '@/components/ui/MhdBadge';
import type { MhdLeaveBenefitTransaction } from '../WorkflowTypes';

const label = (value: string) => value.replaceAll('_', ' ');

/**
 * The append-only transaction history of one benefit obligation. Transactions are never
 * edited, so a correction shows as a REVERSAL row pointing at the transaction it undoes,
 * and the undone row is marked rather than removed.
 */
export function MhdLeaveBenefitTransactionList({
  transactions,
}: {
  transactions: MhdLeaveBenefitTransaction[];
}) {
  if (!transactions.length) {
    return <p className="mt-3 text-xs text-muted-foreground">No transactions recorded.</p>;
  }
  const reversedIds = new Set(
    transactions.flatMap((item) => (item.reversal_of ? [item.reversal_of] : [])),
  );
  const byId = new Map(transactions.map((item) => [item.id, item]));

  return (
    <div className="mt-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">Transactions</p>
      <ul className="mt-1 space-y-1">
        {transactions.map((item) => {
          const target = item.reversal_of ? byId.get(item.reversal_of) : undefined;
          const reversed = reversedIds.has(item.id);
          return (
            <li key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className={reversed ? 'text-muted-foreground line-through' : undefined}>
                {label(item.transaction_type)} {item.amount} on {item.effective_date}
              </span>
              {reversed ? <MhdBadge variant="warning">Reversed</MhdBadge> : null}
              {item.reversal_of ? (
                <span className="text-xs text-muted-foreground">
                  {target
                    ? `Reverses ${target.effective_date} ${label(target.transaction_type)}`
                    : 'Reverses an earlier transaction'}
                </span>
              ) : null}
              {item.reference_note ? (
                <span className="text-xs text-muted-foreground">{item.reference_note}</span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
