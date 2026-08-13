import { useMemo } from 'react';
import { useMhdRoles } from '@/features/roles/Hook';
import { MhdMultiSelectCombobox } from './MhdMultiSelectCombobox';

interface MhdRolePickerProps {
  value: string[];
  onChange: (next: string[]) => void;
  companyId?: string | null;
  placeholder?: string;
  className?: string;
}

export function MhdRolePicker({
  value,
  onChange,
  companyId = null,
  placeholder = 'Search roles...',
  className,
}: MhdRolePickerProps) {
  const rolesQuery = useMhdRoles(companyId ?? null);

  const options = useMemo(
    () =>
      (rolesQuery.data ?? []).map((role) => ({
        id: role.id,
        label: role.roleName,
        sublabel: role.companyId ? 'Company role' : 'Global role',
      })),
    [rolesQuery.data],
  );

  return (
    <div className={className}>
      <MhdMultiSelectCombobox
        options={options}
        value={value}
        onChange={onChange}
        placeholder={rolesQuery.isLoading ? 'Loading roles...' : placeholder}
        emptyMessage={rolesQuery.isError ? 'Unable to load roles.' : 'No roles found.'}
      />
    </div>
  );
}
