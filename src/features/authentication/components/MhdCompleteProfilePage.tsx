import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { MhdTooltip } from '@/components/ui/MhdTooltip';
import { cn } from '@/utils/cn';
import { mhdCompleteOwnProfile } from '../Service';
import { useMhdAuth } from '../Hook';
import { MhdAuthLayout } from './MhdAuthLayout';
import { MhdAuthCard } from './MhdAuthCard';

const inputClass =
  'mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
const disabledInputClass =
  'mt-1 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground focus-visible:outline-none';
const labelClass = 'flex flex-wrap items-center gap-1.5 text-sm font-medium text-foreground';
const requiredNoteClass = 'text-xs font-normal text-muted-foreground';
const optionalNoteClass = 'text-muted-foreground';
const phoneErrorMessage = 'Enter a complete phone number, e.g. (555) 123-4567.';
const phonePattern = /^\(\d{3}\) \d{3}-\d{4}$/;

function formatPhoneInput(value: string) {
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
 * The third invite path: an admin invited this login with no linked person
 * (profile.personId null). MhdProtectedRoute redirects here until they
 * complete it — see that file for the gate. mhd_self_complete_profile only
 * allows this once, so there's no "edit later" affordance here; further
 * edits go through the normal Person record once it exists.
 */
export function MhdCompleteProfilePage() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useMhdAuth();
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function clearFieldError(field: string) {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const { [field]: _removed, ...next } = current;
      return next;
    });
  }

  function handlePhoneChange(value: string) {
    setPhone(formatPhoneInput(value));
    clearFieldError('phone');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const nextFieldErrors: Record<string, string> = {};

    if (firstName.trim().length === 0) {
      nextFieldErrors.firstName = 'First name is required.';
    }

    if (lastName.trim().length === 0) {
      nextFieldErrors.lastName = 'Last name is required.';
    }

    if (preferredName.trim().length === 0) {
      nextFieldErrors.preferredName = 'Preferred name is required.';
    }

    if (!phonePattern.test(phone)) {
      nextFieldErrors.phone = phoneErrorMessage;
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await mhdCompleteOwnProfile({ firstName, middleName, lastName, preferredName, phone });
      await refreshProfile();
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to complete your profile.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <MhdAuthLayout maxWidthClassName="max-w-[36.4rem]">
      <MhdAuthCard
        className="p-8"
        title="Complete Your Profile"
        description={`Tell us who you are before continuing${profile?.email ? ` — you're signed in as ${profile.email}.` : '.'}`}
      >
        <div className="mb-6 flex justify-center text-accent" aria-hidden="true">
          <svg
            className="h-20 w-20"
            viewBox="0 0 96 96"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="48" cy="48" r="39" className="text-accent/10" fill="currentColor" />
            <path
              d="M29 72c2.6-9.8 10.1-16 19-16s16.4 6.2 19 16"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx="48" cy="36" r="12" stroke="currentColor" strokeWidth="4" />
            <path
              d="M67 29l5 5 10-12"
              className="text-foreground"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={labelClass} htmlFor="mhd-first-name">
                First name
                <span className="ml-1 text-red-500">*</span>
                <span className={requiredNoteClass}>(required)</span>
                <MhdTooltip label="About first name">
                  Enter your legal or work profile first name for HR records.
                </MhdTooltip>
              </label>
              <input
                id="mhd-first-name"
                className={cn(inputClass, fieldErrors.firstName && 'border-red-400')}
                value={firstName}
                onChange={(event) => {
                  setFirstName(event.target.value);
                  clearFieldError('firstName');
                }}
                disabled={isSubmitting}
                autoComplete="given-name"
                placeholder="Jane"
                aria-invalid={fieldErrors.firstName ? 'true' : undefined}
                aria-describedby={fieldErrors.firstName ? 'mhd-first-name-error' : undefined}
                required
              />
              {fieldErrors.firstName && (
                <p id="mhd-first-name-error" className="mt-1 text-xs text-red-600">
                  {fieldErrors.firstName}
                </p>
              )}
            </div>
            <div>
              <label className={labelClass} htmlFor="mhd-middle-name">
                Middle name <span className={optionalNoteClass}>(optional)</span>
                <MhdTooltip label="About middle name">
                  Add your middle name or initial if you use one in company records.
                </MhdTooltip>
              </label>
              <input
                id="mhd-middle-name"
                className={inputClass}
                value={middleName}
                onChange={(event) => setMiddleName(event.target.value)}
                disabled={isSubmitting}
                autoComplete="additional-name"
                placeholder="A."
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="mhd-last-name">
                Last name
                <span className="ml-1 text-red-500">*</span>
                <span className={requiredNoteClass}>(required)</span>
                <MhdTooltip label="About last name">
                  Enter your family name so your employee profile can be matched accurately.
                </MhdTooltip>
              </label>
              <input
                id="mhd-last-name"
                className={cn(inputClass, fieldErrors.lastName && 'border-red-400')}
                value={lastName}
                onChange={(event) => {
                  setLastName(event.target.value);
                  clearFieldError('lastName');
                }}
                disabled={isSubmitting}
                autoComplete="family-name"
                placeholder="Doe"
                aria-invalid={fieldErrors.lastName ? 'true' : undefined}
                aria-describedby={fieldErrors.lastName ? 'mhd-last-name-error' : undefined}
                required
              />
              {fieldErrors.lastName && (
                <p id="mhd-last-name-error" className="mt-1 text-xs text-red-600">
                  {fieldErrors.lastName}
                </p>
              )}
            </div>
            <div>
              <label className={labelClass} htmlFor="mhd-preferred-name">
                Preferred name
                <span className="ml-1 text-red-500">*</span>
                <span className={requiredNoteClass}>(required)</span>
                <MhdTooltip label="About preferred name">
                  Use the name you want shown in everyday workflows and greetings.
                </MhdTooltip>
              </label>
              <input
                id="mhd-preferred-name"
                className={cn(inputClass, fieldErrors.preferredName && 'border-red-400')}
                value={preferredName}
                onChange={(event) => {
                  setPreferredName(event.target.value);
                  clearFieldError('preferredName');
                }}
                disabled={isSubmitting}
                autoComplete="nickname"
                placeholder="Jane"
                aria-invalid={fieldErrors.preferredName ? 'true' : undefined}
                aria-describedby={fieldErrors.preferredName ? 'mhd-preferred-name-error' : undefined}
                required
              />
              {fieldErrors.preferredName && (
                <p id="mhd-preferred-name-error" className="mt-1 text-xs text-red-600">
                  {fieldErrors.preferredName}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="mhd-phone">
                Phone
                <span className="ml-1 text-red-500">*</span>
                <span className={requiredNoteClass}>(required)</span>
                <MhdTooltip label="About phone">
                  Provide a primary contact number for HR and account-related follow-up.
                </MhdTooltip>
              </label>
              <input
                id="mhd-phone"
                type="tel"
                className={cn(inputClass, fieldErrors.phone && 'border-red-400')}
                value={phone}
                onChange={(event) => handlePhoneChange(event.target.value)}
                disabled={isSubmitting}
                autoComplete="tel"
                placeholder="(555) 123-4567"
                aria-invalid={fieldErrors.phone ? 'true' : undefined}
                aria-describedby={fieldErrors.phone ? 'mhd-phone-error' : undefined}
                required
              />
              {fieldErrors.phone && (
                <p id="mhd-phone-error" className="mt-1 text-xs text-red-600">
                  {fieldErrors.phone}
                </p>
              )}
            </div>
            <div>
              <label className={labelClass} htmlFor="mhd-email">
                Email <span className={optionalNoteClass}>(from your account)</span>
                <MhdTooltip label="About email">
                  This is the email address tied to your login and can't be changed here.
                </MhdTooltip>
              </label>
              <input
                id="mhd-email"
                type="email"
                className={disabledInputClass}
                value={profile?.email ?? ''}
                disabled
                readOnly
                aria-readonly="true"
                autoComplete="email"
                placeholder="jane.doe@example.com"
              />
            </div>
          </div>

          {formError && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{formError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(buttonBaseClasses, buttonVariantClasses.primary, 'w-full')}
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </MhdAuthCard>
    </MhdAuthLayout>
  );
}
