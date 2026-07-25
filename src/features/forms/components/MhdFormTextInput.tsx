import { MhdFormFieldError } from './MhdFormFieldError';
import { MhdRichTextRenderer } from '@/components/ui/MhdRichText';

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
  type?: 'text' | 'password' | 'url';
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
  type = 'text',
}: MhdFormTextInputProps) {
  const className = `w-full rounded-md border px-3 py-2 text-sm ${
    error ? 'border-red-300' : 'border-border'
  } ${readOnly ? 'bg-muted text-muted-foreground' : 'bg-card'}`;

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-foreground">
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
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={className}
        />
      )}
      {helpText ? <MhdRichTextRenderer html={helpText} className="mt-1 text-xs" /> : null}
      <MhdFormFieldError message={error} />
    </div>
  );
}
