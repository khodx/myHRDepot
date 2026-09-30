export type MhdEmployeeFileTypeKey =
  | 'general'
  | 'payroll'
  | 'i9'
  | 'medical'
  | 'benefits'
  | 'confidential'
  | 'supervisors'
  | 'hr'
  | 'private';

export interface MhdEmployeeFileTypeDefinition {
  key: MhdEmployeeFileTypeKey;
  label: string;
  description: string;
  restricted: boolean;
}

export const MHD_EMPLOYEE_FILE_TYPES: readonly MhdEmployeeFileTypeDefinition[] = [
  {
    key: 'general',
    label: 'General File',
    description: 'General employment documents that belong in the ordinary personnel record.',
    restricted: false,
  },
  {
    key: 'payroll',
    label: 'Payroll File',
    description: 'Payroll-related employee file documents.',
    restricted: true,
  },
  {
    key: 'i9',
    label: 'I9 File',
    description: 'I-9 employment eligibility documents.',
    restricted: true,
  },
  {
    key: 'medical',
    label: 'Medical File',
    description: 'Medical records kept apart from the ordinary personnel file.',
    restricted: true,
  },
  {
    key: 'benefits',
    label: 'Benefits File',
    description: 'Benefits enrollment, eligibility, and related records.',
    restricted: true,
  },
  {
    key: 'confidential',
    label: 'Confidential File',
    description: 'Confidential HR records requiring tighter handling.',
    restricted: true,
  },
  {
    key: 'supervisors',
    label: "Supervisor's File",
    description: 'Supervisor-maintained working file records.',
    restricted: true,
  },
  {
    key: 'hr',
    label: 'HR File',
    description: 'HR-controlled employee file documents.',
    restricted: true,
  },
  {
    key: 'private',
    label: 'Private File',
    description: 'Private employee records requiring the narrowest handling.',
    restricted: true,
  },
] as const;

export const MHD_EMPLOYEE_FILE_TYPE_KEYS = MHD_EMPLOYEE_FILE_TYPES.map((fileType) => fileType.key);

export function mhdIsEmployeeFileTypeKey(
  value: string | null | undefined,
): value is MhdEmployeeFileTypeKey {
  return MHD_EMPLOYEE_FILE_TYPE_KEYS.includes(value as MhdEmployeeFileTypeKey);
}

export function mhdEmployeeFileLabelForKey(
  value: MhdEmployeeFileTypeKey | null | undefined,
): string {
  return (
    MHD_EMPLOYEE_FILE_TYPES.find((fileType) => fileType.key === value)?.label ?? 'Employee File'
  );
}

/**
 * The form a category's "New Record" flow jumps to automatically, skipping
 * the manual picker, when a company has designated one (migration
 * 0187_employee_file_category_defaults.sql).
 */
export interface MhdEmployeeFileCategoryDefaultTarget {
  formId: string;
  formName: string;
}

/** A single row from `mhd_list_employee_file_category_defaults`. */
export interface MhdEmployeeFileCategoryDefault extends MhdEmployeeFileCategoryDefaultTarget {
  category: MhdEmployeeFileTypeKey;
  formStatus: string;
}
