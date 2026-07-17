import type { MhdFormField as MhdFormFieldType, MhdFormFileValue } from '../Types';
import { MhdFormDatePicker } from './MhdFormDatePicker';
import { MhdFormEmailInput } from './MhdFormEmailInput';
import { MhdFormFieldError } from './MhdFormFieldError';
import { MhdFormFileUploadField } from './MhdFormFileUploadField';
import { MhdFormNumberInput } from './MhdFormNumberInput';
import { MhdFormSelect } from './MhdFormSelect';
import { MhdFormTextInput } from './MhdFormTextInput';

interface MhdFormFieldProps {
  field: MhdFormFieldType;
  value: unknown;
  onChange: (value: unknown) => void;
  required?: boolean;
  error?: string | null;
  readOnly?: boolean;
  /** Drive upload pipeline for file-type fields; absent in preview/read-only. */
  onUploadFile?: (file: File) => Promise<MhdFormFileValue>;
}

export function MhdFormField({ field, value, onChange, required, error, readOnly, onUploadFile }: MhdFormFieldProps) {
  const isRequired = required ?? field.required;

  switch (field.type) {
    case 'text':
    case 'text_field':
      return (
        <MhdFormTextInput
          id={field.id}
          label={field.label}
          value={String(value ?? '')}
          onChange={onChange}
          placeholder={field.placeholder}
          required={isRequired}
          helpText={field.helpText}
          error={error}
          readOnly={readOnly}
        />
      );

    case 'longtext':
    case 'long_text':
      return (
        <MhdFormTextInput
          id={field.id}
          label={field.label}
          value={String(value ?? '')}
          onChange={onChange}
          placeholder={field.placeholder}
          required={isRequired}
          helpText={field.helpText}
          error={error}
          multiline
          readOnly={readOnly}
        />
      );

    case 'email':
    case 'email_field':
      return (
        <MhdFormEmailInput
          id={field.id}
          label={field.label}
          value={String(value ?? '')}
          onChange={onChange}
          placeholder={field.placeholder}
          required={isRequired}
          helpText={field.helpText}
          error={error}
        />
      );

    case 'number':
    case 'number_field':
      return (
        <MhdFormNumberInput
          id={field.id}
          label={field.label}
          value={typeof value === 'number' ? value : String(value ?? '')}
          onChange={onChange}
          placeholder={field.placeholder}
          required={isRequired}
          min={field.validation?.min}
          max={field.validation?.max}
          helpText={field.helpText}
          error={error}
          readOnly={readOnly}
        />
      );

    case 'currency':
      return (
        <MhdFormNumberInput
          id={field.id}
          label={field.label}
          value={typeof value === 'number' ? value : String(value ?? '')}
          onChange={onChange}
          prefix="$"
          required={isRequired}
          helpText={field.helpText}
          error={error}
          readOnly={readOnly}
        />
      );

    case 'percentage':
      return (
        <MhdFormNumberInput
          id={field.id}
          label={field.label}
          value={typeof value === 'number' ? value : String(value ?? '')}
          onChange={onChange}
          suffix="%"
          required={isRequired}
          helpText={field.helpText}
          error={error}
          readOnly={readOnly}
        />
      );

    case 'date':
    case 'date_field':
      return (
        <MhdFormDatePicker
          id={field.id}
          label={field.label}
          value={String(value ?? '')}
          onChange={onChange}
          required={isRequired}
          helpText={field.helpText}
          error={error}
        />
      );

    case 'select':
    case 'dropdown':
      return (
        <MhdFormSelect
          id={field.id}
          label={field.label}
          value={String(value ?? '')}
          onChange={onChange}
          options={field.options ?? []}
          required={isRequired}
          placeholder={field.placeholder}
          helpText={field.helpText}
          error={error}
        />
      );

    case 'time':
    case 'time_field':
      return (
        <div>
          <label htmlFor={field.id} className="mb-1 block text-sm font-medium text-slate-900">
            {field.label}
            {isRequired ? <span className="ml-1 text-red-500">*</span> : null}
          </label>
          <input
            id={field.id}
            type="time"
            value={String(value ?? '')}
            onChange={(event) => onChange(event.target.value)}
            className={`w-full rounded-md border px-3 py-2 text-sm ${error ? 'border-red-300' : 'border-slate-300'}`}
          />
          <MhdFormFieldError message={error} />
        </div>
      );

    case 'phone':
    case 'phone_field':
      return (
        <div>
          <label htmlFor={field.id} className="mb-1 block text-sm font-medium text-slate-900">
            {field.label}
            {isRequired ? <span className="ml-1 text-red-500">*</span> : null}
          </label>
          <input
            id={field.id}
            type="tel"
            value={String(value ?? '')}
            onChange={(event) => onChange(event.target.value)}
            placeholder={field.placeholder ?? '(555) 555-5555'}
            className={`w-full rounded-md border px-3 py-2 text-sm ${error ? 'border-red-300' : 'border-slate-300'}`}
          />
          <MhdFormFieldError message={error} />
        </div>
      );

    case 'checkbox':
      return (
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-900">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(event) => onChange(event.target.checked)}
              className="h-4 w-4"
            />
            {field.label}
            {isRequired ? <span className="text-red-500">*</span> : null}
          </label>
          <MhdFormFieldError message={error} />
        </div>
      );

    case 'toggle':
      return (
        <div>
          <label className="mb-1 flex items-center justify-between text-sm font-medium text-slate-900">
            <span>
              {field.label}
              {isRequired ? <span className="ml-1 text-red-500">*</span> : null}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(value)}
              onClick={() => onChange(!value)}
              className={`h-6 w-11 rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  value ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>
          <MhdFormFieldError message={error} />
        </div>
      );

    case 'radio':
      return (
        <fieldset>
          <legend className="mb-1 block text-sm font-medium text-slate-900">
            {field.label}
            {isRequired ? <span className="ml-1 text-red-500">*</span> : null}
          </legend>
          <div className="space-y-2">
            {(field.options ?? []).map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name={field.id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={() => onChange(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
          <MhdFormFieldError message={error} />
        </fieldset>
      );

    case 'rating': {
      const current = Number(value) || 0;
      return (
        <div>
          <span className="mb-1 block text-sm font-medium text-slate-900">
            {field.label}
            {isRequired ? <span className="ml-1 text-red-500">*</span> : null}
          </span>
          <div className="flex gap-1" role="radiogroup" aria-label={field.label}>
            {Array.from({ length: 5 }, (_, index) => index + 1).map((star) => (
              <button
                key={star}
                type="button"
                aria-label={`${star} star${star > 1 ? 's' : ''}`}
                onClick={() => onChange(star)}
                className={`text-2xl ${star <= current ? 'text-amber-500' : 'text-slate-300'}`}
              >
                ★
              </button>
            ))}
          </div>
          <MhdFormFieldError message={error} />
        </div>
      );
    }

    case 'file':
    case 'file_upload':
      return (
        <MhdFormFileUploadField
          field={field}
          value={value}
          onChange={onChange}
          required={isRequired}
          error={error}
          onUploadFile={readOnly ? undefined : onUploadFile}
        />
      );

    default:
      return (
        <MhdFormTextInput
          id={field.id}
          label={field.label}
          value={String(value ?? '')}
          onChange={onChange}
          placeholder={field.placeholder}
          required={isRequired}
          helpText={field.helpText}
          error={error}
          readOnly={readOnly}
        />
      );
  }
}
