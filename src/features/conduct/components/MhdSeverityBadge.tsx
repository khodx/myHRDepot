import { mhdFormatConductSeverity, type MhdConductSeverity } from '../Types';

const SEVERITY_STYLES: Record<MhdConductSeverity, string> = {
  VERBAL_WARNING: 'bg-yellow-100 text-yellow-800',
  WRITTEN_WARNING: 'bg-orange-100 text-orange-800',
  FINAL_WARNING: 'bg-rose-100 text-rose-800',
  MOU: 'bg-violet-100 text-violet-800',
  OTHER: 'bg-neutral-100 text-neutral-600',
};

interface Props {
  severity: MhdConductSeverity;
}

export function MhdSeverityBadge({ severity }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${SEVERITY_STYLES[severity]}`}>
      {mhdFormatConductSeverity(severity)}
    </span>
  );
}
