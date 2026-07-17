import { MhdFormFieldError } from './MhdFormFieldError';

interface MhdFormTextInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  error?: string | null;
  multiline?: boolean;
  readOnly?: boolean;
}

export function MhdFormTextInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  helpText,
  error,
  multiline,
  readOnly,
}: MhdFormTextInputProps) {
  const className = `w-full rounded-md border px-3 py-2 text-sm ${
    error ? 'border-red-300' : 'border-slate-300'
  } ${readOnly ? 'bg-slate-100 text-slate-500' : 'bg-white'}`;

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-900">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`${className} min-h-24`}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={className}
        />
      )}
      {helpText ? <p className="mt-1 text-xs text-slate-500">{helpText}</p> : null}
      <MhdFormFieldError message={error} />
    </div>
  );
}
