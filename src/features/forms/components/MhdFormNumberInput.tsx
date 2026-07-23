import { MhdFormFieldError } from './MhdFormFieldError';

interface MhdFormNumberInputProps {
  id: string;
  label: string;
  value: number | string;
  onChange: (value: number | '') => void;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  prefix?: string;
  suffix?: string;
  helpText?: string;
  error?: string | null;
  readOnly?: boolean;
}

export function MhdFormNumberInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  min,
  max,
  prefix,
  suffix,
  helpText,
  error,
  readOnly,
}: MhdFormNumberInputProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-foreground">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </label>
      <div className="relative">
        {prefix ? <span className="absolute left-3 top-2 text-sm text-muted-foreground">{prefix}</span> : null}
        <input
          id={id}
          type="number"
          value={value}
          onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value))}
          placeholder={placeholder}
          min={min}
          max={max}
          readOnly={readOnly}
          className={`w-full rounded-md border px-3 py-2 text-sm ${
            prefix ? 'pl-8' : ''
          } ${suffix ? 'pr-8' : ''} ${error ? 'border-red-300' : 'border-border'} ${
            readOnly ? 'bg-muted text-muted-foreground' : 'bg-card'
          }`}
        />
        {suffix ? <span className="absolute right-3 top-2 text-sm text-muted-foreground">{suffix}</span> : null}
      </div>
      {helpText ? <p className="mt-1 text-xs text-muted-foreground">{helpText}</p> : null}
      <MhdFormFieldError message={error} />
    </div>
  );
}
