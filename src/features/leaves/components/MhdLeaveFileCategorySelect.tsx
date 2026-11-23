import type { ComponentPropsWithRef } from 'react';
import { MHD_EMPLOYEE_FILE_TYPES } from '@/features/employee-files/Types';

/**
 * The Category of a leave case: which of the nine Employee File categories the case is filed under. One closed list
 * for the administrator form, the self-service form and the intake wizard, so the options cannot drift between them.
 */
export function MhdLeaveFileCategorySelect({
  id,
  className,
  ...selectProps
}: ComponentPropsWithRef<'select'> & { id: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        Category
      </label>
      <select id={id} className={className} {...selectProps}>
        {MHD_EMPLOYEE_FILE_TYPES.map((fileType) => (
          <option key={fileType.key} value={fileType.key}>
            {fileType.label}
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-muted-foreground">
        The employee file this leave case is filed under.
      </p>
    </div>
  );
}
