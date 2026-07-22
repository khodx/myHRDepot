import { mhdFormatOccurrenceType, type MhdOccurrenceType } from '../Types';

const TYPE_STYLES: Record<MhdOccurrenceType, string> = {
  ABSENCE: 'bg-rose-100 text-rose-800',
  TARDY: 'bg-amber-100 text-amber-800',
  EARLY_DEPARTURE: 'bg-orange-100 text-orange-800',
  PARTIAL_ABSENCE: 'bg-yellow-100 text-yellow-800',
  NO_CALL_NO_SHOW: 'bg-red-200 text-red-900',
  LEFT_WITHOUT_NOTICE: 'bg-red-100 text-red-800',
};

interface Props {
  occurrenceType: MhdOccurrenceType;
}

export function MhdOccurrenceTypeBadge({ occurrenceType }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLES[occurrenceType]}`}
    >
      {mhdFormatOccurrenceType(occurrenceType)}
    </span>
  );
}
