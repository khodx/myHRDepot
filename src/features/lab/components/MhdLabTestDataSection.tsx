import { useState } from 'react';
import { FlaskConical, Users as UsersIcon } from 'lucide-react';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdCompanies, useMhdCreateCompany } from '@/features/companies/Hook';
import { mhdPersonService } from '@/features/people/Service';
import { cn } from '@/utils/cn';
import { MHD_SANDBOX_COMPANY_PREFIX } from '../Types';

const SAMPLE_PEOPLE = [
  { firstName: 'Sample', lastName: 'Employee One' },
  { firstName: 'Sample', lastName: 'Employee Two' },
  { firstName: 'Sample', lastName: 'Employee Three' },
  { firstName: 'Sample', lastName: 'Employee Four' },
  { firstName: 'Sample', lastName: 'Employee Five' },
];

/**
 * Deliberately conservative v1: this tool can only CREATE new companies
 * clearly marked `[Sandbox]` and seed obviously-synthetic people into them —
 * it never edits or deletes an existing (real) company or person. That keeps
 * "generate test data for QA" from ever being able to touch real tenant data,
 * at the cost of not offering a one-click "reset" — resetting/deleting
 * sandbox data is left to the existing Companies/People pages, which already
 * have delete affordances with their own confirmation flows.
 */
export function MhdLabTestDataSection() {
  const { profile } = useMhdAuth();
  const actorUserId = profile?.userId ?? '';
  const [companyNameSuffix, setCompanyNameSuffix] = useState('');
  const [seedingCompanyId, setSeedingCompanyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seededCount, setSeededCount] = useState<Record<string, number>>({});

  const sandboxCompaniesQuery = useMhdCompanies({ searchTerm: MHD_SANDBOX_COMPANY_PREFIX });
  const createCompany = useMhdCreateCompany();

  async function handleCreateSandboxCompany() {
    setError(null);
    const suffix = companyNameSuffix.trim();
    const label = suffix.length > 0 ? suffix : new Date().toISOString().slice(0, 19);
    try {
      await createCompany.mutateAsync({
        companyName: `${MHD_SANDBOX_COMPANY_PREFIX} ${label}`,
      });
      setCompanyNameSuffix('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create sandbox company');
    }
  }

  async function handleSeedPeople(companyId: string) {
    setError(null);
    setSeedingCompanyId(companyId);
    try {
      for (const person of SAMPLE_PEOPLE) {
        await mhdPersonService.createPerson(
          {
            companyId,
            firstName: person.firstName,
            middleName: '',
            lastName: person.lastName,
            preferredName: '',
            email: '',
            phone: '',
            mobile: '',
          },
          { actorUserId },
        );
      }
      setSeededCount((current) => ({
        ...current,
        [companyId]: (current[companyId] ?? 0) + SAMPLE_PEOPLE.length,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to seed sample people');
    } finally {
      setSeedingCompanyId(null);
    }
  }

  const sandboxCompanies = sandboxCompaniesQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-accent" aria-hidden />
          <h3 className="text-base font-semibold text-foreground">Create Sandbox Company</h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Creates a new company named <code>{MHD_SANDBOX_COMPANY_PREFIX} …</code> for QA — never
          touches an existing real company.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={companyNameSuffix}
            onChange={(event) => setCompanyNameSuffix(event.target.value)}
            placeholder="Optional label (e.g. onboarding QA)"
            className="h-10 min-w-64 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          />
          <button
            type="button"
            onClick={() => void handleCreateSandboxCompany()}
            disabled={createCompany.isPending || !actorUserId}
            className={cn(buttonBaseClasses, buttonVariantClasses.primary)}
          >
            Create Sandbox Company
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h3 className="text-base font-semibold text-foreground">Sandbox Companies</h3>
        {sandboxCompaniesQuery.isLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
        ) : sandboxCompanies.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No sandbox companies yet — create one above.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {sandboxCompanies.map((company) => (
              <li key={company.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-foreground">{company.companyName}</p>
                  {seededCount[company.id] ? (
                    <p className="text-xs text-muted-foreground">
                      Seeded {seededCount[company.id]} sample people this session
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => void handleSeedPeople(company.id)}
                  disabled={seedingCompanyId === company.id || !actorUserId}
                  className={cn(buttonBaseClasses, buttonVariantClasses.secondary, 'gap-1.5')}
                >
                  <UsersIcon className="h-4 w-4" aria-hidden />
                  {seedingCompanyId === company.id ? 'Seeding…' : 'Seed 5 Sample People'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
