import type { ChangeEvent } from 'react';
import type { MhdCompany } from '@/features/companies/Types';

interface MhdPersonCompanySelectProps {
  companies: MhdCompany[];
  value: string;
  onChange: (companyId: string) => void;
  includeAllOption?: boolean;
  label?: string;
}

export function MhdPersonCompanySelect({ companies, value, onChange, includeAllOption = false, label = 'Company' }: MhdPersonCompanySelectProps) {
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    onChange(event.target.value);
  }

  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <select
        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        value={value}
        onChange={handleChange}
      >
        {includeAllOption ? <option value="ALL">All companies</option> : <option value="">Select company</option>}
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.companyName}
          </option>
        ))}
      </select>
    </label>
  );
}
