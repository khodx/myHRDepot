import type { MhdFormField as MhdFormFieldType, MhdFormFileValue } from '../Types';
import { MhdRichTextRenderer } from '@/components/ui/MhdRichText';
import { MhdFormDatePicker } from './MhdFormDatePicker';
import { MhdFormEmailInput } from './MhdFormEmailInput';
import { MhdFormFieldError } from './MhdFormFieldError';
import { MhdFormFileUploadField } from './MhdFormFileUploadField';
import { MhdFormNumberInput } from './MhdFormNumberInput';
import { MhdFormSelect } from './MhdFormSelect';
import { MhdFormTextInput } from './MhdFormTextInput';

const US_STATE_OPTIONS = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'DC', label: 'District of Columbia' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

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

export function MhdFormField({
  field,
  value,
  onChange,
  required,
  error,
  readOnly,
  onUploadFile,
}: MhdFormFieldProps) {
  const isRequired = required ?? field.required;

  switch (field.type) {
    case 'content':
    case 'display_block':
    case 'section':
      return (
        <section className="rounded-md border border-border bg-muted px-4 py-3">
          <h4 className="text-sm font-semibold text-foreground">{field.label}</h4>
          <MhdRichTextRenderer html={field.description || field.helpText} className="mt-1" />
        </section>
      );

    case 'page_break':
      return <hr className="border-border" aria-label={field.label || 'Page Break'} />;

    case 'text':
    case 'text_field':
    case 'name':
    case 'website':
    case 'lookup':
    case 'person':
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

    /**
     * Initials are a distinct signing ceremony, not a short text answer. The
     * source documents collect them at separate points -- the Employment
     * Application at nine, the Required Notices acknowledgment at seven -- and
     * their legal weight rests on each being captured against its own clause.
     * Rendering them as an ordinary text box loses that: the clause the
     * initials attach to has to be visible next to the box being initialed.
     */
    case 'initials':
      return (
        <div className="mhd-form-initials">
          {field.description ? (
            <p className="mhd-form-initials__clause">{field.description}</p>
          ) : null}
          <div className="mhd-form-initials__capture">
            <MhdFormTextInput
              id={field.id}
              label={field.label}
              value={String(value ?? '')}
              onChange={(next) => onChange(next.toUpperCase().slice(0, 10))}
              placeholder="Initials"
              required={isRequired}
              helpText={field.helpText ?? 'Enter your initials to acknowledge this clause.'}
              error={error}
              readOnly={readOnly}
            />
          </div>
        </div>
      );

    case 'masked_text': {
      // 'SSN' formats-as-you-type to XXX-XX-XXXX and caps input at 9 digits;
      // validation.pattern still governs submit-time enforcement.
      const formatSsn = (raw: string) => {
        const digits = raw.replace(/\D/g, '').slice(0, 9);
        const parts = [digits.slice(0, 3), digits.slice(3, 5), digits.slice(5, 9)].filter(Boolean);
        return parts.join('-');
      };
      const isSsn = field.maskingMode === 'SSN';
      return (
        <MhdFormTextInput
          id={field.id}
          label={field.label}
          value={String(value ?? '')}
          onChange={isSsn ? (next) => onChange(formatSsn(next)) : onChange}
          placeholder={isSsn ? 'XXX-XX-XXXX' : field.placeholder}
          required={isRequired}
          helpText={field.helpText}
          error={error}
          readOnly={readOnly}
          type="password"
        />
      );
    }

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
    case 'calculation':
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
    case 'price':
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
    case 'choice':
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

    case 'state_select':
      return (
        <MhdFormSelect
          id={field.id}
          label={field.label}
          value={String(value ?? '')}
          onChange={onChange}
          options={field.options && field.options.length > 0 ? field.options : US_STATE_OPTIONS}
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
          <label htmlFor={field.id} className="mb-1 block text-sm font-medium text-foreground">
            {field.label}
            {isRequired ? <span className="ml-1 text-red-500">*</span> : null}
          </label>
          <input
            id={field.id}
            type="time"
            value={String(value ?? '')}
            onChange={(event) => onChange(event.target.value)}
            className={`w-full rounded-md border px-3 py-2 text-sm ${error ? 'border-red-300' : 'border-border'}`}
          />
          <MhdFormFieldError message={error} />
        </div>
      );

    case 'phone':
    case 'phone_field':
      return (
        <div>
          <label htmlFor={field.id} className="mb-1 block text-sm font-medium text-foreground">
            {field.label}
            {isRequired ? <span className="ml-1 text-red-500">*</span> : null}
          </label>
          <input
            id={field.id}
            type="tel"
            value={String(value ?? '')}
            onChange={(event) => onChange(event.target.value)}
            placeholder={field.placeholder ?? '(555) 555-5555'}
            className={`w-full rounded-md border px-3 py-2 text-sm ${error ? 'border-red-300' : 'border-border'}`}
          />
          <MhdFormFieldError message={error} />
        </div>
      );

    case 'checkbox':
      return (
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
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

    case 'yes_no':
      return (
        <fieldset>
          <legend className="mb-1 block text-sm font-medium text-foreground">
            {field.label}
            {isRequired ? <span className="ml-1 text-red-500">*</span> : null}
          </legend>
          <div className="flex gap-3">
            {[
              { label: 'Yes', value: true },
              { label: 'No', value: false },
            ].map((option) => (
              <label key={option.label} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name={field.id}
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

    case 'toggle':
      return (
        <div>
          <label className="mb-1 flex items-center justify-between text-sm font-medium text-foreground">
            <span>
              {field.label}
              {isRequired ? <span className="ml-1 text-red-500">*</span> : null}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(value)}
              onClick={() => onChange(!value)}
              className={`h-6 w-11 rounded-full transition-colors ${value ? 'bg-accent' : 'bg-border'}`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-card shadow transition-transform ${
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
          <legend className="mb-1 block text-sm font-medium text-foreground">
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

    case 'rating':
    case 'rating_scale': {
      const current = Number(value) || 0;
      return (
        <div>
          <span className="mb-1 block text-sm font-medium text-foreground">
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
                className={`text-2xl ${star <= current ? 'text-amber-500' : 'text-border'}`}
              >
                ★
              </button>
            ))}
          </div>
          <MhdFormFieldError message={error} />
        </div>
      );
    }

    case 'signature': {
      const signatureValue =
        typeof value === 'object' && value !== null && !Array.isArray(value)
          ? (value as Record<string, unknown>)
          : {};
      const signerName = String(signatureValue.signerName ?? '');
      const signatureText = String(signatureValue.signatureText ?? '');
      const signedAt = String(signatureValue.signedAt ?? '');
      const updateSignature = (patch: Record<string, string>) => {
        onChange({
          signerName,
          signatureText,
          signedAt,
          ...patch,
        });
      };

      return (
        <fieldset className="space-y-2 rounded-md border border-border p-3">
          <legend className="px-1 text-sm font-medium text-foreground">
            {field.label}
            {isRequired ? <span className="ml-1 text-red-500">*</span> : null}
          </legend>
          <input
            type="text"
            value={signerName}
            onChange={(event) => updateSignature({ signerName: event.target.value })}
            placeholder="Signer name"
            readOnly={readOnly}
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={signatureText}
            onChange={(event) =>
              updateSignature({
                signatureText: event.target.value,
                signedAt: new Date().toISOString(),
              })
            }
            placeholder="Type signature"
            readOnly={readOnly}
            className="w-full rounded-md border border-border px-3 py-2 text-sm font-semibold italic"
          />
          {signedAt ? (
            <p className="text-xs text-muted-foreground">
              Signed {new Date(signedAt).toLocaleString()}
            </p>
          ) : null}
          <MhdFormFieldError message={error} />
        </fieldset>
      );
    }

    case 'notice_packet_acknowledgment':
      return (
        <div className="space-y-2 rounded-md border border-border bg-muted p-4">
          <h4 className="text-sm font-semibold text-foreground">{field.label}</h4>
          {field.description ? <MhdRichTextRenderer html={field.description} /> : null}
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(event) => onChange(event.target.checked)}
              disabled={readOnly}
            />
            I acknowledge the required notices in this packet.
          </label>
          <MhdFormFieldError message={error} />
        </div>
      );

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

    /**
     * Fixed row x column matrix. The Employment Application needs two of these:
     * availability (7 days x available/hours) and education (6 levels x school,
     * location, degree, major). The previous seed collapsed both into a single
     * long-text box, which is why the form captured 12 fields against a source
     * carrying roughly 150.
     *
     * The value is stored as { [rowValue]: { [columnKey]: cellValue } } so a
     * row is addressable by its stable key rather than by position.
     */
    case 'grid': {
      if (!field.grid) {
        return (
          <p className="mhd-form-field__error">
            Grid field &quot;{field.label}&quot; has no grid definition.
          </p>
        );
      }

      const gridValue = (
        typeof value === 'object' && value !== null && !Array.isArray(value) ? value : {}
      ) as Record<string, Record<string, unknown>>;

      const setCell = (rowValue: string, columnKey: string, cellValue: unknown) => {
        onChange({
          ...gridValue,
          [rowValue]: { ...(gridValue[rowValue] ?? {}), [columnKey]: cellValue },
        } as never);
      };

      return (
        <fieldset className="mhd-form-grid" aria-describedby={`${field.id}-help`}>
          <legend className="mhd-form-grid__legend">
            {field.label}
            {isRequired ? <span aria-hidden="true"> *</span> : null}
          </legend>
          {field.helpText ? (
            <p id={`${field.id}-help`} className="mhd-form-grid__help">
              {field.helpText}
            </p>
          ) : null}
          <div className="mhd-form-grid__scroll">
            <table className="mhd-form-grid__table">
              <thead>
                <tr>
                  <th scope="col">{field.description ?? ''}</th>
                  {field.grid.columns.map((column) => (
                    <th key={column.key} scope="col">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {field.grid.rows.map((row) => (
                  <tr key={row.value}>
                    <th scope="row">{row.label}</th>
                    {field.grid?.columns.map((column) => {
                      const cellId = `${field.id}-${row.value}-${column.key}`;
                      const cell = gridValue[row.value]?.[column.key];

                      if (column.type === 'radio' && column.options?.length) {
                        return (
                          <td key={column.key}>
                            <div role="radiogroup" aria-label={`${row.label} ${column.label}`}>
                              {column.options.map((option) => (
                                <label key={option.value} className="mhd-form-grid__radio">
                                  <input
                                    type="radio"
                                    name={cellId}
                                    value={option.value}
                                    checked={String(cell ?? '') === option.value}
                                    disabled={readOnly}
                                    onChange={() => setCell(row.value, column.key, option.value)}
                                  />
                                  <span>{option.label}</span>
                                </label>
                              ))}
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td key={column.key}>
                          <input
                            id={cellId}
                            type="text"
                            aria-label={`${row.label} ${column.label}`}
                            value={String(cell ?? '')}
                            readOnly={readOnly}
                            onChange={(event) =>
                              setCell(row.value, column.key, event.target.value)
                            }
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {error ? <p className="mhd-form-field__error">{error}</p> : null}
        </fieldset>
      );
    }

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
