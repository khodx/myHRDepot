import { MhdFormFieldError } from './MhdFormFieldError';
import { MhdRichTextRenderer } from '@/components/ui/MhdRichText';
import { MhdDateField } from '@/components/ui/MhdDateField';

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
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-foreground">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </label>
      <MhdDateField
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        className={error ? 'border-red-300' : undefined}
      />
      {helpText ? <MhdRichTextRenderer html={helpText} className="mt-1 text-xs" /> : null}
      <MhdFormFieldError message={error} />
    </div>
  );
}
