import { useEffect, useState } from 'react';
import { useMhdRandomQuote } from '@/features/quotes/Hook';
import type { MhdQuote } from '@/features/quotes/Types';

const MHD_QUOTE_ROTATION_MS = 20000;

export function MhdDashboardQuoteOfTheDay() {
  const { data, refetch } = useMhdRandomQuote();
  const [displayedQuote, setDisplayedQuote] = useState<MhdQuote | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!data) return undefined;

    // Rebound as a fresh const so its narrowed (non-null/undefined) type is
    // trusted inside the nested swapIn() closure below — TS widens `data`
    // itself back to the query's nullable type there otherwise.
    const nextQuote = data;
    const dataKey = nextQuote.id ?? nextQuote.quoteText;
    const displayedKey = displayedQuote?.id ?? displayedQuote?.quoteText;

    if (displayedQuote && dataKey === displayedKey) {
      return undefined;
    }

    // Every state update below runs from an async callback (rAF/setTimeout),
    // never synchronously in the effect body itself, so this never fires as
    // a same-tick cascading render.
    const isFirstLoad = !displayedQuote;

    function swapIn() {
      setDisplayedQuote(nextQuote);
      showFrame = window.requestAnimationFrame(() => setIsVisible(true));
    }

    let hideFrame: number | null = null;
    let swapTimer: number | null = null;
    let showFrame: number | null = null;

    if (isFirstLoad) {
      swapTimer = window.setTimeout(swapIn, 0);
    } else {
      hideFrame = window.requestAnimationFrame(() => {
        setIsVisible(false);
        swapTimer = window.setTimeout(swapIn, 250);
      });
    }

    return () => {
      if (hideFrame !== null) window.cancelAnimationFrame(hideFrame);
      if (swapTimer !== null) window.clearTimeout(swapTimer);
      if (showFrame !== null) window.cancelAnimationFrame(showFrame);
    };
  }, [data, displayedQuote]);

  useEffect(() => {
    const timer = setInterval(() => {
      void refetch();
    }, MHD_QUOTE_ROTATION_MS);

    return () => clearInterval(timer);
  }, [refetch]);

  const quoteKey = displayedQuote?.id ?? displayedQuote?.quoteText ?? '';

  if (!displayedQuote) {
    return null;
  }

  return (
    <div
      key={quoteKey}
      className={`max-w-2xl text-sm leading-snug text-rail-muted transition-opacity duration-500 sm:text-[15px] ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <p className="italic">&ldquo;{displayedQuote.quoteText}&rdquo;</p>
      {displayedQuote.author ? (
        <p className="mt-1 text-xs font-medium not-italic text-white/80 sm:text-sm">
          <span aria-hidden="true">&mdash;</span> {displayedQuote.author}
        </p>
      ) : null}
    </div>
  );
}
