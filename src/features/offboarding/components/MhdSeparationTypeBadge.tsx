import { mhdFormatSeparationType, type MhdSeparationType } from '../Types';

const TYPE_STYLES: Record<MhdSeparationType, string> = {
  RESIGNATION: 'bg-blue-100 text-blue-800',
  TERMINATION: 'bg-rose-100 text-rose-800',
  LAYOFF: 'bg-orange-100 text-orange-800',
  END_OF_CONTRACT: 'bg-violet-100 text-violet-800',
  RETIREMENT: 'bg-teal-100 text-teal-800',
  OTHER: 'bg-neutral-100 text-neutral-600',
};

interface Props {
  separationType: MhdSeparationType;
}

export function MhdSeparationTypeBadge({ separationType }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLES[separationType]}`}
    >
      {mhdFormatSeparationType(separationType)}
    </span>
  );
}
