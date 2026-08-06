import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import {
  MhdPersonIdentityFields,
  mhdFormatPersonPhoneInput,
  mhdValidatePersonIdentityFields,
  type MhdPersonIdentityFieldsValues,
} from '@/components/ui/MhdPersonIdentityFields';
import { cn } from '@/utils/cn';
import { mhdCompleteOwnProfile } from '../Service';
import { useMhdAuth } from '../Hook';
import { MhdAuthLayout } from './MhdAuthLayout';
import { MhdAuthCard } from './MhdAuthCard';

/**
 * The third invite path: an admin invited this login with no linked person
 * (profile.personId null). MhdProtectedRoute redirects here until they
 * complete it — see that file for the gate. mhd_self_complete_profile only
 * allows this once, so there's no "edit later" affordance here; further
 * edits go through the normal Person record once it exists.
 */
export function MhdCompleteProfilePage() {
  const navigate = useNavigate();
  const { profile, userEmail, refreshProfile } = useMhdAuth();
  // Prefer the live Supabase Auth session email over the mirrored
  // public.users.email column: the session is always authoritative for
  // who's actually logged in, while the mirrored column can be stale or
  // unset (e.g. an invite row created before it was backfilled).
  const displayEmail = userEmail ?? profile?.email ?? null;
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof MhdPersonIdentityFieldsValues, string>>
  >({});

  function clearFieldError(field: keyof MhdPersonIdentityFieldsValues) {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const { [field]: _removed, ...next } = current;
      return next;
    });
  }

  function handleIdentityFieldChange(field: keyof MhdPersonIdentityFieldsValues, value: string) {
    if (field === 'firstName') {
      setFirstName(value);
    } else if (field === 'middleName') {
      setMiddleName(value);
    } else if (field === 'lastName') {
      setLastName(value);
    } else if (field === 'preferredName') {
      setPreferredName(value);
    } else {
      setPhone(mhdFormatPersonPhoneInput(value));
    }

    clearFieldError(field);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const nextFieldErrors = mhdValidatePersonIdentityFields({
      firstName,
      middleName,
      lastName,
      preferredName,
      phone,
    });

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
    <MhdAuthLayout maxWidthClassName="max-w-[47.32rem]">
      <MhdAuthCard
        className="px-8 py-[2.2rem]"
        title="Complete Your Profile"
        description={`Tell us who you are before continuing${displayEmail ? ` — you're signed in as ${displayEmail}.` : '.'}`}
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
          <MhdPersonIdentityFields
            idPrefix="mhd"
            values={{ firstName, middleName, lastName, preferredName, phone }}
            onFieldChange={handleIdentityFieldChange}
            fieldErrors={fieldErrors}
            disabled={isSubmitting}
            email={{
              value: displayEmail ?? '',
              helpText: "This is the email address tied to your login and can't be changed here.",
            }}
          />

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
