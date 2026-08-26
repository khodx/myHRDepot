import { createElement, type ComponentType } from 'react';
import { Calculator, type LucideProps } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

/**
 * Calculator templates store their icon as a lucide-react export name
 * (e.g. "DollarSign") in the `icon` column rather than a fixed import, since
 * the catalog is admin-managed, data-driven content -- not a hardcoded set
 * of icons the app ships with. This resolves that name back to the actual
 * component at render time, with `Calculator` as a safe fallback for a name
 * that doesn't exist in the library (e.g. stale/mistyped admin input).
 */
export function mhdResolveCalculatorIcon(iconName: string): ComponentType<LucideProps> {
  const candidate = (LucideIcons as Record<string, unknown>)[iconName];
  return typeof candidate === 'function' ? (candidate as ComponentType<LucideProps>) : Calculator;
}

export function MhdCalculatorIcon({ name, ...props }: { name: string } & LucideProps) {
  // Resolved via createElement rather than a JSX <Icon /> tag: the target is
  // a stable reference pulled from the static lucide-react export map (never
  // a freshly-created component), but the project's react-hooks/static-
  // components lint rule can't distinguish that from a truly dynamic
  // component and flags the JSX-tag-from-variable form regardless.
  return createElement(mhdResolveCalculatorIcon(name), props);
}
