import { cn } from '@/utils/cn';

interface MhdExternalDataAttributionProps {
  /** Citation for the external data provider. */
  citation: string;
  dataYear?: number | null;
  logoUrl?: string;
  logoAlt?: string;
  className?: string;
}

export function MhdExternalDataAttribution({ citation, dataYear, logoUrl, logoAlt, className }: MhdExternalDataAttributionProps) {
  return <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', className)}>{logoUrl ? <img src={logoUrl} alt={logoAlt ?? ''} className="h-5 w-auto" /> : null}<span>{citation}{dataYear != null ? ` (${dataYear})` : ''}</span></div>;
}
