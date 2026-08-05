interface MhdTooltipProps {
  label: string;
  children: string;
}

export function MhdTooltip({ label, children }: MhdTooltipProps) {
  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        aria-label={label}
        title={children}
        className="inline-flex size-4 items-center justify-center rounded-full border border-border bg-background text-[10px] font-semibold leading-none text-muted-foreground transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        ?
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-6 z-20 hidden w-56 -translate-x-1/2 rounded-md border border-border bg-card px-3 py-2 text-xs font-normal leading-snug text-foreground shadow-lg group-focus-within:block group-hover:block"
      >
        {children}
      </span>
    </span>
  );
}
