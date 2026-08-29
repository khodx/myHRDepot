import { useMhdQuoteOfTheDay } from '@/features/quotes/Hook';

/**
 * Renders the dashboard's quote of the day. The quote is deterministic per
 * calendar day at the database layer (mhd_dashboard_quote_of_the_day), so it
 * never rotates or refetches mid-session — it is fixed for the whole day and
 * only changes to a new quote once a new day starts.
 *
 * Wraps onto as many lines as it needs at a fixed, readable size rather than
 * shrinking to fit one line — a long quote at shrink-to-fit's minimum size
 * still overflowed and read as cut off.
 */
export function MhdDashboardQuoteOfTheDay() {
  const { data: quote } = useMhdQuoteOfTheDay();

  if (!quote) {
    return null;
  }

  return (
    <div className="w-full text-rail-muted">
      <p className="text-[22px] italic leading-snug">&ldquo;{quote.quoteText}&rdquo;</p>
      {quote.author ? (
        <p className="mt-1 text-[18px] font-medium not-italic text-white/80">
          <span aria-hidden="true">&mdash;</span> {quote.author}
        </p>
      ) : null}
    </div>
  );
}
