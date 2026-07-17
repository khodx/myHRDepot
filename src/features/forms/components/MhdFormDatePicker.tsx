import { MhdFormFieldError } from './MhdFormFieldError';

interface MhdFormDatePickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  helpText?: string;
  error?: string | null;
}

export function MhdFormDatePicker({
  id,
  label,
  value,
  onChange,
  required,
  helpText,
  error,
}: MhdFormDatePickerProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-900">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-md border px-3 py-2 text-sm ${error ? 'border-red-300' : 'border-slate-300'}`}
      />
      {helpText ? <p className="mt-1 text-xs text-slate-500">{helpText}</p> : null}
      <MhdFormFieldError message={error} />
    </div>
  );
}
