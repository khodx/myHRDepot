import {
  MHD_FIELD_INPUT_CLASS,
  MHD_FIELD_INPUT_DISABLED_CLASS,
  MhdFieldLabel,
} from '@/components/ui/MhdFieldLabel';
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
  } | null;
}

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
          <MhdFieldLabel
            htmlFor={`${idPrefix}-first-name`}
            required
            tooltip={{
              label: 'About first name',
              children: 'Enter your legal or work profile first name for HR records.',
            }}
          >
            First name
          </MhdFieldLabel>
          <input
            id={`${idPrefix}-first-name`}
            className={cn(MHD_FIELD_INPUT_CLASS, fieldErrors.firstName && 'border-red-400')}
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
          <MhdFieldLabel
            htmlFor={`${idPrefix}-middle-name`}
            tooltip={{
              label: 'About middle name',
              children: 'Add your middle name or initial if you use one in company records.',
            }}
          >
            Middle name
          </MhdFieldLabel>
          <input
            id={`${idPrefix}-middle-name`}
            className={MHD_FIELD_INPUT_CLASS}
            value={values.middleName}
            onChange={(event) => onFieldChange('middleName', event.target.value)}
            disabled={disabled}
            autoComplete="additional-name"
            placeholder="A."
          />
        </div>
        <div>
          <MhdFieldLabel
            htmlFor={`${idPrefix}-last-name`}
            required
            tooltip={{
              label: 'About last name',
              children: 'Enter your family name so your employee profile can be matched accurately.',
            }}
          >
            Last name
          </MhdFieldLabel>
          <input
            id={`${idPrefix}-last-name`}
            className={cn(MHD_FIELD_INPUT_CLASS, fieldErrors.lastName && 'border-red-400')}
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
          <MhdFieldLabel
            htmlFor={`${idPrefix}-preferred-name`}
            required
            tooltip={{
              label: 'About preferred name',
              children: 'Use the name you want shown in everyday workflows and greetings.',
            }}
          >
            Preferred name
          </MhdFieldLabel>
          <input
            id={`${idPrefix}-preferred-name`}
            className={cn(MHD_FIELD_INPUT_CLASS, fieldErrors.preferredName && 'border-red-400')}
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
          <MhdFieldLabel
            htmlFor={`${idPrefix}-phone`}
            required
            tooltip={{
              label: 'About phone',
              children: 'Provide a primary contact number for HR and account-related follow-up.',
            }}
          >
            Phone
          </MhdFieldLabel>
          <input
            id={`${idPrefix}-phone`}
            type="tel"
            className={cn(MHD_FIELD_INPUT_CLASS, fieldErrors.phone && 'border-red-400')}
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
            <MhdFieldLabel
              htmlFor={`${idPrefix}-email`}
              required
              tooltip={{ label: 'About email', children: email.helpText }}
            >
              Email
            </MhdFieldLabel>
            <input
              id={`${idPrefix}-email`}
              type="email"
              className={MHD_FIELD_INPUT_DISABLED_CLASS}
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
