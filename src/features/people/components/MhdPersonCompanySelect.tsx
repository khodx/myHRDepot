import { MhdSearchableSelect } from '@/components/ui/MhdSearchableSelect';
import type { MhdCompany } from '@/features/companies/Types';

interface MhdPersonCompanySelectProps {
  companies: MhdCompany[];
  value: string;
  onChange: (companyId: string) => void;
  includeAllOption?: boolean;
  label?: string;
  /** Locks the field to the current value, rendered as a static display — used when the signed-in user may not reassign a person's company. */
  disabled?: boolean;
}

export function MhdPersonCompanySelect({
  companies,
  value,
  onChange,
  includeAllOption = false,
  label = 'Company',
  disabled = false,
}: MhdPersonCompanySelectProps) {
  const options = [
    ...(includeAllOption ? [{ id: 'ALL', label: 'All companies' }] : []),
    ...companies.map((company) => ({ id: company.id, label: company.companyName })),
  ];

  return (
    <label className="block text-sm font-medium text-foreground">
      {label}
      <MhdSearchableSelect
        className="mt-1"
        options={options}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={includeAllOption ? 'All companies' : 'Select company'}
        emptyMessage="No companies match your search."
      />
    </label>
  );
}
