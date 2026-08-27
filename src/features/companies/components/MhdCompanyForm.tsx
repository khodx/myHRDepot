import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import type {
  MhdCompany,
  MhdCreateCompanyInput,
  MhdUpdateCompanyInput,
} from '@/features/companies/Types';
import { mhdCreateCompanySchema, mhdUpdateCompanySchema } from '@/features/companies/Schemas';

type MhdCompanyFormProps = {
  company?: MhdCompany | null;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: (values: MhdCreateCompanyInput | MhdUpdateCompanyInput) => void;
  onCancel?: () => void;
};

export function MhdCompanyForm({
  company,
  isSubmitting,
  submitLabel,
  onSubmit,
  onCancel,
}: MhdCompanyFormProps) {
  const [companyName, setCompanyName] = useState(company?.companyName ?? '');
  const [industry, setIndustry] = useState(company?.industry ?? '');
  const [employeeCount, setEmployeeCount] = useState(company?.employeeCount ?? null);
  const [headquartersLocation, setHeadquartersLocation] = useState(
    company?.headquartersLocation ?? '',
  );
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- package pattern: sync form fields from the selected company prop
    setCompanyName(company?.companyName ?? '');
    setIndustry(company?.industry ?? '');
    setEmployeeCount(company?.employeeCount ?? null);
    setHeadquartersLocation(company?.headquartersLocation ?? '');
    setFormError(null);
  }, [company]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rawValues = {
      companyName,
      industry: industry.trim().length > 0 ? industry : null,
      employeeCount,
      headquartersLocation: headquartersLocation.trim().length > 0 ? headquartersLocation : null,
    };
    const result = company
      ? mhdUpdateCompanySchema.safeParse(rawValues)
      : mhdCreateCompanySchema.safeParse(rawValues);

    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? 'Please review the company form.');
      return;
    }

    setFormError(null);
    onSubmit(result.data);
  }

  return (
    <form onSubmit={handleSubmit}>
      <MhdFormFieldStack>
      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="mhd-company-name">
          Company name
        </label>
        <input
          id="mhd-company-name"
          className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          value={companyName}
          onChange={(event) => setCompanyName(event.target.value)}
          disabled={isSubmitting}
          autoComplete="organization"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="mhd-company-industry">
          Industry
        </label>
        <input
          id="mhd-company-industry"
          className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          value={industry}
          onChange={(event) => setIndustry(event.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label
          className="block text-sm font-medium text-slate-700"
          htmlFor="mhd-company-employee-count"
        >
          Employee count
        </label>
        <input
          id="mhd-company-employee-count"
          type="number"
          min={0}
          className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          value={employeeCount ?? ''}
          onChange={(event) =>
            setEmployeeCount(event.target.value === '' ? null : Number(event.target.value))
          }
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label
          className="block text-sm font-medium text-slate-700"
          htmlFor="mhd-company-hq-location"
        >
          Headquarters location
        </label>
        <input
          id="mhd-company-hq-location"
          className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          value={headquartersLocation}
          onChange={(event) => setHeadquartersLocation(event.target.value)}
          disabled={isSubmitting}
        />
      </div>

      </MhdFormFieldStack>
      {formError ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
      ) : null}

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
