export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'warning';

// Hover/press feedback is one consistent dim (see buttonBaseClasses' shared
// hover:opacity-80 / active:opacity-70) rather than a per-variant color swap
// — every variant below defines only its resting fill/text/focus-ring color.
export const buttonVariantClasses: Record<ButtonVariant, string> = {
  // Cobalt 900 (#081549), matching the task-detail status pill. Hardcoded
  // rather than bg-accent/--mhd-accent since this only recolors buttons —
  // bg-accent still drives non-button brand surfaces (borders, tints, focus
  // rings) at the original navy #0003AA.
  primary: 'bg-[#081549] text-white focus-visible:ring-[#081549]',
  secondary: 'bg-slate-100 text-slate-950 focus-visible:ring-slate-500',
  ghost: 'bg-transparent text-slate-950 focus-visible:ring-slate-500',
  // Semantic error red (design system §5), independent of the category accent.
  destructive: 'bg-red-700 text-white focus-visible:ring-red-700',
  // Record-detail Edit action (2026-07-26) — deliberately yellow, distinct from
  // the navy category accent, so Edit reads as its own affordance next to Delete.
  // Darkened 30% off base yellow-400 (#facc15 -> #af8f0f) with white text, 2026-07-30.
  warning: 'bg-[#af8f0f] text-white focus-visible:ring-[#af8f0f]',
};

export const buttonBaseClasses =
  'inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-opacity hover:opacity-80 active:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
