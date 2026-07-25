import { MhdFormFieldError } from './MhdFormFieldError';
import { MhdRichTextRenderer } from '@/components/ui/MhdRichText';

interface MhdFormEmailInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  error?: string | null;
}

export function MhdFormEmailInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  helpText,
  error,
}: MhdFormEmailInputProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-foreground">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </label>
      <input
        id={id}
        type="email"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-md border px-3 py-2 text-sm ${error ? 'border-red-300' : 'border-border'}`}
      />
      {helpText ? <MhdRichTextRenderer html={helpText} className="mt-1 text-xs" /> : null}
      <MhdFormFieldError message={error} />
    </div>
  );
}
