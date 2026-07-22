import { mhdFormatHandbookType, type MhdHandbookType } from '../Types';

// The content pack a handbook draws from. This is descriptive, not a status, so
// the two packs stay quietly distinct (a soft indigo for Employee, a soft amber
// for Safety) rather than reading as a heat map. The label carries the meaning.
const TYPE_STYLES: Record<MhdHandbookType, string> = {
  EMPLOYEE: 'bg-indigo-100 text-indigo-800',
  SAFETY: 'bg-amber-100 text-amber-800',
};

interface Props {
  handbookType: MhdHandbookType;
}

export function MhdHandbookTypeBadge({ handbookType }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        TYPE_STYLES[handbookType] ?? 'bg-neutral-100 text-neutral-700'
      }`}
    >
      {mhdFormatHandbookType(handbookType)}
    </span>
  );
}
