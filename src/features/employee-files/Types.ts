import type { MhdAttachmentEntityType } from '@/features/attachments/Types';

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
  entityType: MhdAttachmentEntityType;
  description: string;
  restricted: boolean;
}

export const MHD_EMPLOYEE_FILE_TYPES: readonly MhdEmployeeFileTypeDefinition[] = [
  {
    key: 'general',
    label: 'General File',
    entityType: 'EMPLOYEE_GENERAL_FILE',
    description: 'General employment documents that belong in the ordinary personnel record.',
    restricted: false,
  },
  {
    key: 'payroll',
    label: 'Payroll File',
    entityType: 'EMPLOYEE_PAYROLL_FILE',
    description: 'Payroll-related employee file documents.',
    restricted: true,
  },
  {
    key: 'i9',
    label: 'I9 File',
    entityType: 'EMPLOYEE_I9_FILE',
    description: 'I-9 employment eligibility documents.',
    restricted: true,
  },
  {
    key: 'medical',
    label: 'Medical File',
    entityType: 'EMPLOYEE_MEDICAL_FILE',
    description: 'Medical records kept apart from the ordinary personnel file.',
    restricted: true,
  },
  {
    key: 'benefits',
    label: 'Benefits File',
    entityType: 'EMPLOYEE_BENEFITS_FILE',
    description: 'Benefits enrollment, eligibility, and related records.',
    restricted: true,
  },
  {
    key: 'confidential',
    label: 'Confidential File',
    entityType: 'EMPLOYEE_CONFIDENTIAL_FILE',
    description: 'Confidential HR records requiring tighter handling.',
    restricted: true,
  },
  {
    key: 'supervisors',
    label: "Supervisor's File",
    entityType: 'EMPLOYEE_SUPERVISOR_FILE',
    description: 'Supervisor-maintained working file records.',
    restricted: true,
  },
  {
    key: 'hr',
    label: 'HR File',
    entityType: 'EMPLOYEE_HR_FILE',
    description: 'HR-controlled employee file documents.',
    restricted: true,
  },
  {
    key: 'private',
    label: 'Private File',
    entityType: 'EMPLOYEE_PRIVATE_FILE',
    description: 'Private employee records requiring the narrowest handling.',
    restricted: true,
  },
] as const;
