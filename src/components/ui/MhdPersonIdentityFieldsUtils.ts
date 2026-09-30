export interface MhdPersonIdentityFieldsValues {
  firstName: string;
  middleName: string;
  lastName: string;
  preferredName: string;
  phone: string;
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

/**
 * Preferred name defaults to and mirrors First Name as the user types it,
 * so it never starts blank — but the moment someone edits Preferred Name
 * directly, it diverges from First Name and further First Name edits stop
 * overwriting it. Shared by every form that captures both fields (Complete
 * Profile, invite-a-user, the People module's person form) so the default
 * behaves identically everywhere instead of being reimplemented per form.
 */
export function mhdNextPreferredName(
  currentFirstName: string,
  currentPreferredName: string,
  nextFirstName: string,
): string {
  return currentPreferredName === currentFirstName ? nextFirstName : currentPreferredName;
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
