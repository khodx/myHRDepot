import { MhdTooltip } from '@/components/ui/MhdTooltip';
import { cn } from '@/utils/cn';

export interface MhdPersonIdentityFieldsValues {
  firstName: string;
  middleName: string;
  lastName: string;
  preferredName: string;
  phone: string;
}

export interface MhdPersonIdentityFieldsProps {
  idPrefix: string;
  values: MhdPersonIdentityFieldsValues;
  onFieldChange: (field: keyof MhdPersonIdentityFieldsValues, value: string) => void;
  fieldErrors: Partial<Record<keyof MhdPersonIdentityFieldsValues, string>>;
  disabled?: boolean;
  email?: {
    value: string;
    helpText: string;
    label?: string;
  } | null;
}

const inputClass =
  'mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
const disabledInputClass =
  'mt-1 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground focus-visible:outline-none';
const labelClass = 'flex flex-nowrap items-center gap-1.5 whitespace-nowrap text-sm font-medium text-foreground';
const requiredNoteClass = 'text-xs font-normal text-muted-foreground';
const optionalNoteClass = 'text-muted-foreground';
const phoneErrorMessage = 'Enter a complete phone number, e.g. (555) 123-4567.';

export const MHD_PERSON_IDENTITY_PHONE_PATTERN = /^\(\d{3}\) \d{3}-\d{4}$/;

export function mhdFormatPersonPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);

  if (digits.length === 0) {
    return '';
  }

  if (digits.length <= 3) {
    return `(${digits}`;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function mhdValidatePersonIdentityFields(values: MhdPersonIdentityFieldsValues) {
  const nextFieldErrors: Partial<Record<keyof MhdPersonIdentityFieldsValues, string>> = {};

  if (values.firstName.trim().length === 0) {
    nextFieldErrors.firstName = 'First name is required.';
  }

  if (values.lastName.trim().length === 0) {
    nextFieldErrors.lastName = 'Last name is required.';
  }

  if (values.preferredName.trim().length === 0) {
    nextFieldErrors.preferredName = 'Preferred name is required.';
  }

  if (!MHD_PERSON_IDENTITY_PHONE_PATTERN.test(values.phone)) {
    nextFieldErrors.phone = phoneErrorMessage;
  }

  return nextFieldErrors;
}

export function MhdPersonIdentityFields({
  idPrefix,
  values,
  onFieldChange,
  fieldErrors,
  disabled = false,
  email = null,
}: MhdPersonIdentityFieldsProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className={labelClass} htmlFor={`${idPrefix}-first-name`}>
            First name
            <span className="ml-1 text-red-500">*</span>
            <span className={requiredNoteClass}>(required)</span>
            <MhdTooltip label="About first name">
              Enter your legal or work profile first name for HR records.
            </MhdTooltip>
          </label>
          <input
            id={`${idPrefix}-first-name`}
            className={cn(inputClass, fieldErrors.firstName && 'border-red-400')}
            value={values.firstName}
            onChange={(event) => onFieldChange('firstName', event.target.value)}
            disabled={disabled}
            autoComplete="given-name"
            placeholder="Jane"
            aria-invalid={fieldErrors.firstName ? 'true' : undefined}
            aria-describedby={
              fieldErrors.firstName ? `${idPrefix}-first-name-error` : undefined
            }
            required
          />
          {fieldErrors.firstName && (
            <p id={`${idPrefix}-first-name-error`} className="mt-1 text-xs text-red-600">
              {fieldErrors.firstName}
            </p>
          )}
        </div>
        <div>
          <label className={labelClass} htmlFor={`${idPrefix}-middle-name`}>
            Middle name <span className={optionalNoteClass}>(optional)</span>
            <MhdTooltip label="About middle name">
              Add your middle name or initial if you use one in company records.
            </MhdTooltip>
          </label>
          <input
            id={`${idPrefix}-middle-name`}
            className={inputClass}
            value={values.middleName}
            onChange={(event) => onFieldChange('middleName', event.target.value)}
            disabled={disabled}
            autoComplete="additional-name"
            placeholder="A."
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={`${idPrefix}-last-name`}>
            Last name
            <span className="ml-1 text-red-500">*</span>
            <span className={requiredNoteClass}>(required)</span>
            <MhdTooltip label="About last name">
              Enter your family name so your employee profile can be matched accurately.
            </MhdTooltip>
          </label>
          <input
            id={`${idPrefix}-last-name`}
            className={cn(inputClass, fieldErrors.lastName && 'border-red-400')}
            value={values.lastName}
            onChange={(event) => onFieldChange('lastName', event.target.value)}
            disabled={disabled}
            autoComplete="family-name"
            placeholder="Doe"
            aria-invalid={fieldErrors.lastName ? 'true' : undefined}
            aria-describedby={fieldErrors.lastName ? `${idPrefix}-last-name-error` : undefined}
            required
          />
          {fieldErrors.lastName && (
            <p id={`${idPrefix}-last-name-error`} className="mt-1 text-xs text-red-600">
              {fieldErrors.lastName}
            </p>
          )}
        </div>
        <div>
          <label className={labelClass} htmlFor={`${idPrefix}-preferred-name`}>
            Preferred name
            <span className="ml-1 text-red-500">*</span>
            <span className={requiredNoteClass}>(required)</span>
            <MhdTooltip label="About preferred name">
              Use the name you want shown in everyday workflows and greetings.
            </MhdTooltip>
          </label>
          <input
            id={`${idPrefix}-preferred-name`}
            className={cn(inputClass, fieldErrors.preferredName && 'border-red-400')}
            value={values.preferredName}
            onChange={(event) => onFieldChange('preferredName', event.target.value)}
            disabled={disabled}
            autoComplete="nickname"
            placeholder="Jane"
            aria-invalid={fieldErrors.preferredName ? 'true' : undefined}
            aria-describedby={
              fieldErrors.preferredName ? `${idPrefix}-preferred-name-error` : undefined
            }
            required
          />
          {fieldErrors.preferredName && (
            <p id={`${idPrefix}-preferred-name-error`} className="mt-1 text-xs text-red-600">
              {fieldErrors.preferredName}
            </p>
          )}
        </div>
      </div>

      <div className={cn('grid gap-4', email ? 'sm:grid-cols-2' : 'sm:grid-cols-1')}>
        <div>
          <label className={labelClass} htmlFor={`${idPrefix}-phone`}>
            Phone
            <span className="ml-1 text-red-500">*</span>
            <span className={requiredNoteClass}>(required)</span>
            <MhdTooltip label="About phone">
              Provide a primary contact number for HR and account-related follow-up.
            </MhdTooltip>
          </label>
          <input
            id={`${idPrefix}-phone`}
            type="tel"
            className={cn(inputClass, fieldErrors.phone && 'border-red-400')}
            value={values.phone}
            onChange={(event) => onFieldChange('phone', event.target.value)}
            disabled={disabled}
            autoComplete="tel"
            placeholder="(555) 123-4567"
            aria-invalid={fieldErrors.phone ? 'true' : undefined}
            aria-describedby={fieldErrors.phone ? `${idPrefix}-phone-error` : undefined}
            required
          />
          {fieldErrors.phone && (
            <p id={`${idPrefix}-phone-error`} className="mt-1 text-xs text-red-600">
              {fieldErrors.phone}
            </p>
          )}
        </div>
        {email ? (
          <div>
            <label className={labelClass} htmlFor={`${idPrefix}-email`}>
              Email
              <span className="ml-1 text-red-500">*</span>
              <span className={requiredNoteClass}>(required, {email.label ?? 'from your account'})</span>
              <MhdTooltip label="About email">{email.helpText}</MhdTooltip>
            </label>
            <input
              id={`${idPrefix}-email`}
              type="email"
              className={disabledInputClass}
              value={email.value}
              disabled
              readOnly
              aria-readonly="true"
              aria-required="true"
              autoComplete="email"
              placeholder="jane.doe@example.com"
            />
          </div>
        ) : null}
      </div>
    </>
  );
}
