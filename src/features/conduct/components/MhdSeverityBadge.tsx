import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { mhdFormatConductSeverity, type MhdConductSeverity } from '../Types';

// Escalation rungs map onto the semantic set: the warning rungs share the amber
// warning variant (the label carries the rung), the final rung reads as error,
// and MOU is a category-style tag in the module accent.
const SEVERITY_VARIANTS: Record<MhdConductSeverity, MhdBadgeVariant> = {
  VERBAL_WARNING: 'warning',
  WRITTEN_WARNING: 'warning',
  FINAL_WARNING: 'error',
  MOU: 'accent',
  OTHER: 'neutral',
};

interface Props {
  severity: MhdConductSeverity;
}

export function MhdSeverityBadge({ severity }: Props) {
  return (
    <MhdBadge variant={SEVERITY_VARIANTS[severity]}>{mhdFormatConductSeverity(severity)}</MhdBadge>
  );
}
