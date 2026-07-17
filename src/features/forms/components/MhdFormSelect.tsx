import type { MhdFormFieldOption } from '../Types';
import { MhdFormFieldError } from './MhdFormFieldError';

interface MhdFormSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: MhdFormFieldOption[];
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  error?: string | null;
}

export function MhdFormSelect({
  id,
  label,
  value,
  onChange,
  options,
  required,
  placeholder,
  helpText,
  error,
}: MhdFormSelectProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-900">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-md border px-3 py-2 text-sm ${error ? 'border-red-300' : 'border-slate-300'}`}
      >
        <option value="">{placeholder ?? 'Select an option'}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helpText ? <p className="mt-1 text-xs text-slate-500">{helpText}</p> : null}
      <MhdFormFieldError message={error} />
    </div>
  );
}
