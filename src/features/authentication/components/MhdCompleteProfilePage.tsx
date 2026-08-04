import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { cn } from '@/utils/cn';
import { mhdCompleteOwnProfile } from '../Service';
import { useMhdAuth } from '../Hook';
import { MhdAuthLayout } from './MhdAuthLayout';
import { MhdAuthCard } from './MhdAuthCard';

const inputClass =
  'mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

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
  const [mobile, setMobile] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (firstName.trim().length === 0 || lastName.trim().length === 0) {
      setFormError('First and last name are required.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      await mhdCompleteOwnProfile({ firstName, middleName, lastName, preferredName, phone, mobile });
      await refreshProfile();
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to complete your profile.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <MhdAuthLayout>
      <MhdAuthCard
        title="Complete your profile"
        description={`Tell us who you are before continuing${profile?.email ? ` — you're signed in as ${profile.email}.` : '.'}`}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground" htmlFor="mhd-first-name">
                First name
              </label>
              <input
                id="mhd-first-name"
                className={inputClass}
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                disabled={isSubmitting}
                autoComplete="given-name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground" htmlFor="mhd-last-name">
                Last name
              </label>
              <input
                id="mhd-last-name"
                className={inputClass}
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                disabled={isSubmitting}
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground" htmlFor="mhd-middle-name">
                Middle name <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                id="mhd-middle-name"
                className={inputClass}
                value={middleName}
                onChange={(event) => setMiddleName(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground" htmlFor="mhd-preferred-name">
                Preferred name <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                id="mhd-preferred-name"
                className={inputClass}
                value={preferredName}
                onChange={(event) => setPreferredName(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground" htmlFor="mhd-phone">
                Phone <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                id="mhd-phone"
                type="tel"
                className={inputClass}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                disabled={isSubmitting}
                autoComplete="tel"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground" htmlFor="mhd-mobile">
                Mobile <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                id="mhd-mobile"
                type="tel"
                className={inputClass}
                value={mobile}
                onChange={(event) => setMobile(event.target.value)}
                disabled={isSubmitting}
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
