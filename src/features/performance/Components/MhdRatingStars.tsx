import { Star } from 'lucide-react';

const RATING_VALUES = [1, 2, 3, 4, 5] as const;

const RATING_LABELS: Record<number, string> = {
  1: 'Needs significant improvement',
  2: 'Below expectations',
  3: 'Meets expectations',
  4: 'Exceeds expectations',
  5: 'Outstanding',
};

interface DisplayProps {
  variant?: 'display';
  value: number | null;
  size?: 'sm' | 'md';
}

interface InputProps {
  variant: 'input';
  value: number | null;
  onChange: (value: number) => void;
  /** Unique prefix for radio input ids so multiple instances can coexist on a page. */
  idPrefix: string;
  legend?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

type Props = DisplayProps | InputProps;

function starClass(filled: boolean, size: 'sm' | 'md'): string {
  const dimension = size === 'sm' ? 'h-4 w-4' : 'h-6 w-6';
  return `${dimension} ${filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`;
}

export function MhdRatingStars(props: Props) {
  const size = props.size ?? 'md';

  if (props.variant !== 'input') {
    if (props.value == null) {
      return <span className="text-sm text-muted-foreground">Not rated</span>;
    }
    return (
      <span
        role="img"
        aria-label={`Rated ${props.value} of 5: ${RATING_LABELS[props.value] ?? ''}`}
        className="inline-flex items-center gap-0.5"
      >
        {RATING_VALUES.map((star) => (
          <Star key={star} aria-hidden="true" className={starClass(star <= (props.value ?? 0), size)} />
        ))}
        <span className="ml-1.5 text-sm text-muted-foreground">{RATING_LABELS[props.value] ?? ''}</span>
      </span>
    );
  }

  const { value, onChange, idPrefix, legend, disabled } = props;

  return (
    <fieldset className="m-0 border-0 p-0" disabled={disabled}>
      <legend className={legend ? 'mb-1 block text-sm font-medium' : 'sr-only'}>{legend ?? 'Overall rating'}</legend>
      <div role="radiogroup" aria-label={legend ?? 'Overall rating'} className="inline-flex items-center gap-0.5">
        {RATING_VALUES.map((star) => {
          const inputId = `${idPrefix}-star-${star}`;
          const isFilled = star <= (value ?? 0);
          return (
            <span key={star}>
              <input
                type="radio"
                id={inputId}
                name={`${idPrefix}-rating`}
                value={star}
                checked={value === star}
                onChange={() => onChange(star)}
                disabled={disabled}
                className="sr-only"
              />
              <label
                htmlFor={inputId}
                title={`${star} — ${RATING_LABELS[star]}`}
                className={`inline-flex cursor-pointer rounded p-0.5 ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-amber-50'}`}
              >
                <Star aria-hidden="true" className={starClass(isFilled, size)} />
                <span className="sr-only">{`${star} of 5 — ${RATING_LABELS[star]}`}</span>
              </label>
            </span>
          );
        })}
        <span className="ml-1.5 text-sm text-muted-foreground">
          {value != null ? RATING_LABELS[value] : 'Not rated'}
        </span>
      </div>
    </fieldset>
  );
}
