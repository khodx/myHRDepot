import { MhdBadge } from '@/components/ui/MhdBadge';
import { mhdFormatActivityType, type MhdActivityType } from '../Types';

interface Props {
  activityType: MhdActivityType;
}

/**
 * Type/category tag (MHD Design System §5): rendered in the module's accent
 * tint rather than the former per-type rainbow — the label carries the
 * distinction, and the accent keeps type tags visually separate from the
 * semantic status set.
 */
export function MhdActivityTypeBadge({ activityType }: Props) {
  return <MhdBadge variant="accent">{mhdFormatActivityType(activityType)}</MhdBadge>;
}
