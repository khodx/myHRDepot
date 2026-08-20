import { useLayoutEffect, useRef, useState } from 'react';
import { useMhdQuoteOfTheDay } from '@/features/quotes/Hook';

const MHD_QUOTE_BASE_FONT_PX = 24;
const MHD_QUOTE_MIN_FONT_PX = 14;
const MHD_QUOTE_FONT_STEP_PX = 1;

/**
 * Shrinks the quote's font size, if needed, so the (intentionally
 * non-wrapping) quote line always fits within its container's width — quotes
 * vary a lot in length, and the banner has no room to grow taller for a
 * second line. Re-measures on quote change and on container resize (sidebar
 * collapse/expand, window resize).
 */
function useMhdShrinkToFitFontPx(
  containerRef: React.RefObject<HTMLElement | null>,
  textRef: React.RefObject<HTMLElement | null>,
  deps: unknown[],
) {
  const [fontPx, setFontPx] = useState(MHD_QUOTE_BASE_FONT_PX);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return undefined;

    function fit() {
      if (!container || !text) return;
      let candidatePx = MHD_QUOTE_BASE_FONT_PX;
      text.style.fontSize = `${candidatePx}px`;
      while (text.scrollWidth > container.clientWidth && candidatePx > MHD_QUOTE_MIN_FONT_PX) {
        candidatePx -= MHD_QUOTE_FONT_STEP_PX;
        text.style.fontSize = `${candidatePx}px`;
      }
      setFontPx(candidatePx);
    }

    fit();

    const observer = new ResizeObserver(fit);
    observer.observe(container);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return fontPx;
}

/**
 * Renders the dashboard's quote of the day. The quote is deterministic per
 * calendar day at the database layer (mhd_dashboard_quote_of_the_day), so it
 * never rotates or refetches mid-session — it is fixed for the whole day and
 * only changes to a new quote once a new day starts.
 */
export function MhdDashboardQuoteOfTheDay() {
  const { data: quote } = useMhdQuoteOfTheDay();
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const quoteFontPx = useMhdShrinkToFitFontPx(containerRef, textRef, [quote?.id, quote?.quoteText]);

  if (!quote) {
    return null;
  }

  return (
    <div ref={containerRef} className="w-full text-rail-muted">
      <p
        ref={textRef}
        className="whitespace-nowrap italic leading-snug"
        style={{ fontSize: `${quoteFontPx}px` }}
      >
        &ldquo;{quote.quoteText}&rdquo;
      </p>
      {quote.author ? (
        <p className="mt-1 text-[18px] font-medium not-italic text-white/80">
          <span aria-hidden="true">&mdash;</span> {quote.author}
        </p>
      ) : null}
    </div>
  );
}
